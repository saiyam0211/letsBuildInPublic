import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase, checkDatabaseHealth } from '@/config/database';
import { validateAuthConfig } from '@/config/auth';
import { logger } from '@/utils/logger';
import { webSocketService } from '@/services/websocket';
import { jobQueueService } from '@/services/jobQueue';
import mongoose from 'mongoose';

// Import routes
import authRoutes from '@/routes/auth';
import projectRoutes from '@/routes/projects';
import collaborationRoutes from '@/routes/collaboration';
import ideaProcessingRoutes from '@/routes/ideaProcessing';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config(); // fallback

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket server
webSocketService.initialize(server);

// Initialize database connection
async function initializeDatabase() {
  try {
    // Skip database initialization in test environment if already connected
    if (
      process.env.NODE_ENV === 'test' &&
      mongoose.connection.readyState === 1
    ) {
      logger.info('Database already connected in test environment');
      return;
    }

    await connectDatabase();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Validate authentication configuration
try {
  validateAuthConfig();
  logger.info('Authentication configuration validated');
} catch (error) {
  logger.error('Authentication configuration validation failed:', error);
  process.exit(1);
}

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with enhanced status
app.get('/health', async (_req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  const queueHealth = await jobQueueService.healthCheck();
  const wsHealth = webSocketService.healthCheck();

  const allHealthy =
    dbHealthy && queueHealth.redis && queueHealth.queue && wsHealth.status;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'OK' : 'Service Unavailable',
    message: 'SaaS Blueprint Generator API is running',
    services: {
      database: dbHealthy ? 'Connected' : 'Disconnected',
      redis: queueHealth.redis ? 'Connected' : 'Disconnected',
      jobQueue: queueHealth.queue ? 'Active' : 'Inactive',
      webSocket: wsHealth.status ? 'Active' : 'Inactive',
    },
    metrics: {
      activeJobs: queueHealth.activeJobs,
      waitingJobs: queueHealth.waitingJobs,
      connectedUsers: wsHealth.connectedUsers,
      connectedSockets: wsHealth.connectedSockets,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.get('/api', (_req, res) => {
  res.json({
    message: '🚀 Welcome to SaaS Blueprint Generator API',
    version: '1.0.0',
    status: 'Week 4 Day 4 - Feature 1 COMPLETE ✅ (ALL ENDPOINTS IMPLEMENTED)',
    nextPhase: 'Week 4 Day 5 - Frontend Integration & Feature 2',
    features: {
      completed: [
        'Express server setup',
        'Security middleware',
        'CORS configuration',
        'Rate limiting',
        'Environment configuration',
        'MongoDB connection',
        'Database models and schemas',
        'Data validation and indexing',
        'Database seed scripts',
        'JWT authentication system',
        'User registration and login',
        'Token refresh mechanism',
        'Password hashing and security',
        'Role-based access control foundation',
        'Input validation and sanitization',
        'Authentication rate limiting',
        'Project CRUD operations',
        'Project management API',
        'Project overview and analytics',
        'User project filtering and pagination',
        'OpenAI integration service',
        'AI-powered idea processing',
        'Background job queue with Bull',
        'WebSocket real-time updates',
        'Result aggregation and confidence scoring',
        'Comprehensive error handling and retry mechanisms',
        '✅ Feature 1: SaaS Idea Input & Processing - COMPLETE',
        '  - SaaS Idea CRUD API endpoints',
        '  - Project-based idea management',
        '  - Complete validation and error handling',
        '  - Nested route parameter handling',
        '  - Comprehensive API testing and validation',
        '  - AI processing endpoints for specific ideas',
        '  - Processing status tracking per idea',
      ],
      upcoming: [
        'Feature 2: AI-Powered Idea Analysis',
        'Feature 3: Blueprint Generation Engine',
        'Frontend idea submission interface',
        'Real-time processing UI',
        'Frontend integration with WebSocket',
        'Advanced AI features',
        'Real-time collaboration',
      ],
    },
    services: {
      database: 'MongoDB with Mongoose',
      cache: 'Redis with IORedis',
      queue: 'Bull Queue for background processing',
      websocket: 'Socket.IO for real-time communication',
      ai: 'OpenAI GPT-4 for idea analysis',
    },
    endpoints: {
      health: '/health',
      api: '/api',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/password',
      },
      projects: {
        create: 'POST /api/projects',
        list: 'GET /api/projects',
        details: 'GET /api/projects/:id',
        update: 'PUT /api/projects/:id',
        delete: 'DELETE /api/projects/:id',
        overview: 'GET /api/projects/:id/overview',
      },
      ideas: {
        submit: 'POST /api/projects/:id/ideas',
        list: 'GET /api/projects/:id/ideas',
        details: 'GET /api/projects/:id/ideas/:ideaId',
        update: 'PUT /api/projects/:id/ideas/:ideaId',
        delete: 'DELETE /api/projects/:id/ideas/:ideaId',
        processById: 'POST /api/projects/:id/ideas/:ideaId/process',
        statusById: 'GET /api/projects/:id/ideas/:ideaId/status',
      },
      ideaProcessing: {
        processAsync: 'POST /api/projects/:projectId/ideas/process',
        processSync: 'POST /api/projects/:projectId/ideas/process-sync',
        jobStatus: 'GET /api/jobs/:jobId/status',
        cancelJob: 'DELETE /api/jobs/:jobId',
        myJobs: 'GET /api/jobs/my-jobs',
        latestResult: 'GET /api/projects/:projectId/ideas/latest',
        queueStats: 'GET /api/queue/stats',
        queueHealth: 'GET /api/queue/health',
      },
    },
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Project management routes
app.use('/api/projects', projectRoutes);

// Collaboration routes
app.use('/api', collaborationRoutes);

// Idea processing routes
app.use('/api', ideaProcessingRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`,
  });
});

// Error interface for proper typing
interface HttpError extends Error {
  status?: number;
}

// Error handling middleware
app.use((err: HttpError, _req: express.Request, res: express.Response) => {
  logger.error('Error:', err);

  const status = err.status || 500;

  res.status(status).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  // Initialize database and start server
  initializeDatabase().then(() => {
    server.listen(PORT, () => {
      logger.info(`
🚀 SaaS Blueprint Generator API Server Started
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server running on: http://localhost:${PORT}
🔗 API endpoint: http://localhost:${PORT}/api
💊 Health check: http://localhost:${PORT}/health
🔐 Authentication: http://localhost:${PORT}/api/auth
🗄️  Database: MongoDB connected
📊 Job Queue: Bull with Redis
🔄 WebSocket: Socket.IO enabled
🤖 AI Service: OpenAI GPT-4 ready
⏰ Started at: ${new Date().toISOString()}

📋 New Features:
  • Background job processing
  • Real-time progress updates
  • Enhanced error handling
  • Confidence scoring
  • Result aggregation
    `);
    });
  });

  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');

    try {
      await Promise.all([
        webSocketService.shutdown(),
        jobQueueService.shutdown(),
      ]);

      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');

    try {
      await Promise.all([
        webSocketService.shutdown(),
        jobQueueService.shutdown(),
      ]);

      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
}

export default app;
