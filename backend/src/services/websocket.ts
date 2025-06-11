import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { JobProgress, jobQueueService } from './jobQueue.js';

// WebSocket event types
export interface ServerToClientEvents {
  'job-progress': (progress: JobProgress) => void;
  'job-completed': (result: Record<string, unknown>) => void;
  'job-failed': (error: string) => void;
  'queue-stats': (stats: Record<string, unknown>) => void;
  notification: (
    message: string,
    type: 'info' | 'success' | 'warning' | 'error'
  ) => void;
}

export interface ClientToServerEvents {
  'join-user-room': (userId: string) => void;
  'join-project-room': (projectId: string) => void;
  'leave-project-room': (projectId: string) => void;
  'get-job-progress': (
    jobId: string,
    callback: (progress: JobProgress | null) => void
  ) => void;
  'get-user-jobs': (callback: (jobs: JobProgress[]) => void) => void;
  'cancel-job': (jobId: string, callback: (success: boolean) => void) => void;
  'get-queue-stats': (
    callback: (stats: Record<string, unknown>) => void
  ) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  userEmail: string;
  rooms: string[];
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || [
          'http://localhost:3000',
        ],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupPeriodicUpdates();

    logger.info('WebSocket server initialized successfully');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        interface DecodedToken {
          userId: string;
          email: string;
        }
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as DecodedToken;

        socket.data.userId = decoded.userId;
        socket.data.userEmail = decoded.email;
        socket.data.rooms = [];

        logger.debug(`User ${decoded.email} connected via WebSocket`);
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on(
      'connection',
      (
        socket: Socket<
          ClientToServerEvents,
          ServerToClientEvents,
          InterServerEvents,
          SocketData
        >
      ) => {
        const userId = socket.data.userId;
        const userEmail = socket.data.userEmail;

        logger.info(
          `User ${userEmail} (${userId}) connected with socket ${socket.id}`
        );

        // Track connected user
        if (!this.connectedUsers.has(userId)) {
          this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId)!.add(socket.id);

        // Auto-join user's personal room
        socket.join(`user:${userId}`);
        socket.data.rooms.push(`user:${userId}`);

        // Handle joining user room explicitly
        socket.on('join-user-room', (requestedUserId: string) => {
          if (requestedUserId === userId) {
            socket.join(`user:${userId}`);
            if (!socket.data.rooms.includes(`user:${userId}`)) {
              socket.data.rooms.push(`user:${userId}`);
            }
            logger.debug(`User ${userEmail} joined personal room`);
          }
        });

        // Handle joining project room
        socket.on('join-project-room', (projectId: string) => {
          socket.join(`project:${projectId}`);
          if (!socket.data.rooms.includes(`project:${projectId}`)) {
            socket.data.rooms.push(`project:${projectId}`);
          }
          logger.debug(`User ${userEmail} joined project room: ${projectId}`);
        });

        // Handle leaving project room
        socket.on('leave-project-room', (projectId: string) => {
          socket.leave(`project:${projectId}`);
          socket.data.rooms = socket.data.rooms.filter(
            room => room !== `project:${projectId}`
          );
          logger.debug(`User ${userEmail} left project room: ${projectId}`);
        });

        // Handle get job progress
        socket.on('get-job-progress', async (jobId: string, callback) => {
          try {
            const progress = await jobQueueService.getJobProgress(jobId);
            callback(progress);
          } catch (error) {
            logger.error('Failed to get job progress:', error);
            callback(null);
          }
        });

        // Handle get user jobs
        socket.on('get-user-jobs', async callback => {
          try {
            const jobs = await jobQueueService.getUserActiveJobs(userId);
            callback(jobs);
          } catch (error) {
            logger.error('Failed to get user jobs:', error);
            callback([]);
          }
        });

        // Handle cancel job
        socket.on('cancel-job', async (jobId: string, callback) => {
          try {
            const success = await jobQueueService.cancelJob(jobId);
            callback(success);

            if (success) {
              this.notifyUser(userId, 'Job cancelled successfully', 'info');
            }
          } catch (error) {
            logger.error('Failed to cancel job:', error);
            callback(false);
          }
        });

        // Handle get queue stats
        socket.on('get-queue-stats', async callback => {
          try {
            const stats = await jobQueueService.getQueueStats();
            callback(stats);
          } catch (error) {
            logger.error('Failed to get queue stats:', error);
            callback({});
          }
        });

        // Handle disconnection
        socket.on('disconnect', reason => {
          logger.info(`User ${userEmail} disconnected: ${reason}`);

          // Remove socket from connected users tracking
          const userSockets = this.connectedUsers.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.connectedUsers.delete(userId);
            }
          }
        });

        // Handle connection errors
        socket.on('error', error => {
          logger.error(`Socket error for user ${userEmail}:`, error);
        });

        // Send welcome message
        this.notifyUser(userId, 'Connected to real-time updates', 'success');

        // Send current user's active jobs
        this.sendUserActiveJobs(userId);
      }
    );
  }

  /**
   * Setup periodic updates
   */
  private setupPeriodicUpdates(): void {
    // Send queue statistics every 30 seconds to all connected clients
    setInterval(async () => {
      try {
        const stats = await jobQueueService.getQueueStats();
        this.broadcast('queue-stats', stats);
      } catch (error) {
        logger.error('Failed to broadcast queue stats:', error);
      }
    }, 30000);

    // Clean up disconnected users every 5 minutes
    setInterval(() => {
      const cleanupCount = this.cleanupDisconnectedUsers();
      if (cleanupCount > 0) {
        logger.debug(`Cleaned up ${cleanupCount} disconnected user entries`);
      }
    }, 300000);
  }

  /**
   * Emit job progress update to relevant users
   */
  emitJobProgress(progress: JobProgress): void {
    if (!this.io) return;

    // Send to user's personal room
    this.io.to(`user:${progress.userId}`).emit('job-progress', progress);

    // Send to project room if others are watching
    this.io.to(`project:${progress.projectId}`).emit('job-progress', progress);

    logger.debug(
      `Emitted job progress for ${progress.jobId}: ${progress.progress}% - ${progress.currentStep}`
    );
  }

  /**
   * Emit job completion
   */
  emitJobCompleted(
    userId: string,
    projectId: string,
    result: Record<string, unknown>
  ): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('job-completed', result);
    this.io.to(`project:${projectId}`).emit('job-completed', result);

    this.notifyUser(userId, 'Idea analysis completed successfully!', 'success');

    logger.info(
      `Emitted job completion for user ${userId}, project ${projectId}`
    );
  }

  /**
   * Emit job failure
   */
  emitJobFailed(userId: string, projectId: string, error: string): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('job-failed', error);
    this.io.to(`project:${projectId}`).emit('job-failed', error);

    this.notifyUser(userId, `Idea analysis failed: ${error}`, 'error');

    logger.warn(`Emitted job failure for user ${userId}: ${error}`);
  }

  /**
   * Send notification to specific user
   */
  notifyUser(
    userId: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('notification', message, type);
    logger.debug(`Sent ${type} notification to user ${userId}: ${message}`);
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(event: keyof ServerToClientEvents, ...args: unknown[]): void {
    if (!this.io) return;

    // Type assertion needed for the complex event emission
    (this.io.emit as (event: string, ...args: unknown[]) => void)(
      event,
      ...args
    );
  }

  /**
   * Send user's active jobs
   */
  private async sendUserActiveJobs(userId: string): Promise<void> {
    try {
      const activeJobs = await jobQueueService.getUserActiveJobs(userId);

      if (activeJobs.length > 0) {
        activeJobs.forEach(job => {
          this.emitJobProgress(job);
        });
      }
    } catch (error) {
      logger.error(`Failed to send active jobs for user ${userId}:`, error);
    }
  }

  /**
   * Clean up tracking for disconnected users
   */
  private cleanupDisconnectedUsers(): number {
    let cleanupCount = 0;

    for (const [userId, socketIds] of this.connectedUsers.entries()) {
      const validSockets = Array.from(socketIds).filter(socketId => {
        return this.io?.sockets.sockets.has(socketId);
      });

      if (validSockets.length === 0) {
        this.connectedUsers.delete(userId);
        cleanupCount++;
      } else if (validSockets.length < socketIds.size) {
        this.connectedUsers.set(userId, new Set(validSockets));
      }
    }

    return cleanupCount;
  }

  /**
   * Get connected user count
   */
  getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users list
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get server instance for external use
   */
  getServer(): Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  > | null {
    return this.io;
  }

  /**
   * Health check
   */
  healthCheck(): {
    status: boolean;
    connectedUsers: number;
    connectedSockets: number;
  } {
    return {
      status: this.io !== null,
      connectedUsers: this.getConnectedUserCount(),
      connectedSockets: this.io?.sockets.sockets.size || 0,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.io) {
      logger.info('Shutting down WebSocket server...');

      // Notify all connected users
      this.broadcast(
        'notification',
        'Server is shutting down. Please reconnect in a moment.',
        'info'
      );

      // Close all connections
      this.io.close();
      this.io = null;
      this.connectedUsers.clear();

      logger.info('WebSocket server shut down successfully');
    }
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();
