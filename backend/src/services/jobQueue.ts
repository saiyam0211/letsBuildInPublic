import Bull from 'bull';
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import { ideaProcessingService, IdeaProcessingRequest } from './ideaProcessing.js';
import { createRedisClient } from '../config/redis.js';

// Create Redis connection using the centralized configuration
export const redis = createRedisClient();

// Job queue for idea processing with explicit Redis config
const redisConfig = process.env.REDIS_HOST && process.env.REDIS_PORT ? {
  port: parseInt(process.env.REDIS_PORT),
  host: process.env.REDIS_HOST,
  ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
  ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
} : undefined;

export const ideaProcessingQueue = new Bull('idea-processing', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 50, // Keep last 50 completed jobs
    removeOnFail: 100,    // Keep last 100 failed jobs
  },
  settings: {
    stalledInterval: 30 * 1000, // How often check for stalled jobs (30 seconds)
    maxStalledCount: 1, // Max amount of times a stalled job will be re-processed
  },
});

// Job data interfaces
export interface IdeaProcessingJobData extends IdeaProcessingRequest {
  userId: string;
  jobId: string;
  priority?: number;
}

export interface JobProgress {
  jobId: string;
  projectId: string;
  userId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
  progress: number; // 0-100
  currentStep: string;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  result?: any;
  metrics: {
    stepsCompleted: string[];
    totalSteps: number;
    aiCost: number;
    tokensUsed: number;
    processingTime: number;
  };
}

export class JobQueueService {
  private static instance: JobQueueService;
  private processorInitialized: boolean = false;

  private constructor() {
    // Start async initialization (fire and forget)
    this.initializeProcessor().catch(error => {
      logger.error('Failed to initialize job processor:', error);
    });
  }

  public static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  /**
   * Initialize the job processor and event listeners
   */
  private async initializeProcessor(): Promise<void> {
    try {
      logger.info('🔧 Initializing Bull job processor...');
      
      // Wait for Redis connection to be ready
      await this.waitForRedisConnection();
      
      // Setup job processor
      await this.setupJobProcessor();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.processorInitialized = true;
      logger.info('✅ Bull job processor initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize job processor:', error);
      throw error;
    }
  }

  /**
   * Wait for Redis connection to be ready
   */
  private async waitForRedisConnection(): Promise<void> {
    const maxRetries = 10;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await redis.ping();
        logger.info('✅ Redis connection ready for Bull queue');
        return;
      } catch (error) {
        retries++;
        logger.warn(`⚠️ Redis not ready, attempt ${retries}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Redis connection not ready after maximum retries');
  }

  /**
   * Add a new idea processing job to the queue
   */
  async addIdeaProcessingJob(data: IdeaProcessingJobData): Promise<Bull.Job<IdeaProcessingJobData>> {
    // Ensure processor is initialized
    if (!this.processorInitialized) {
      logger.warn('⚠️ Processor not initialized, waiting...');
      await this.waitForProcessorReady();
    }
    
    logger.info(`📝 Adding idea processing job for project: ${data.projectId}`);

    const job = await ideaProcessingQueue.add('process-idea', data, {
      priority: data.priority || 0,
      jobId: data.jobId,
      delay: 0, // Start immediately
    });

    logger.info(`✅ Job added to queue with Bull ID: ${job.id}, JobID: ${data.jobId}`);

    // Initialize job progress tracking
    await this.updateJobProgress(data.jobId, {
      jobId: data.jobId,
      projectId: data.projectId,
      userId: data.userId,
      status: 'waiting',
      progress: 0,
      currentStep: 'Initializing',
      metrics: {
        stepsCompleted: [],
        totalSteps: 7,
        aiCost: 0,
        tokensUsed: 0,
        processingTime: 0,
      },
    });

    // Log queue stats after adding job
    const stats = await this.getQueueStats();
    logger.info(`📊 Queue stats after adding job - Waiting: ${stats.waiting}, Active: ${stats.active}`);

    return job;
  }

  /**
   * Wait for processor to be ready
   */
  private async waitForProcessorReady(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const checkInterval = 500; // 500ms
    let waited = 0;
    
    while (!this.processorInitialized && waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }
    
    if (!this.processorInitialized) {
      throw new Error('Job processor failed to initialize within timeout');
    }
  }

  /**
   * Get job status and progress
   */
  async getJobProgress(jobId: string): Promise<JobProgress | null> {
    const progressKey = `job_progress:${jobId}`;
    const progressData = await redis.get(progressKey);
    
    if (!progressData) {
      return null;
    }

    return JSON.parse(progressData);
  }

  /**
   * Update job progress
   */
  async updateJobProgress(jobId: string, progress: Partial<JobProgress>): Promise<void> {
    const progressKey = `job_progress:${jobId}`;
    const existingProgress = await this.getJobProgress(jobId);
    
    const updatedProgress: JobProgress = {
      ...existingProgress,
      ...progress,
      jobId,
    } as JobProgress;

    await redis.setex(progressKey, 3600, JSON.stringify(updatedProgress)); // Expire after 1 hour
    
    // Emit progress update via WebSocket
    this.emitProgressUpdate(updatedProgress);
  }

  /**
   * Get all active jobs for a user
   */
  async getUserActiveJobs(userId: string): Promise<JobProgress[]> {
    const keys = await redis.keys('job_progress:*');
    const activeJobs: JobProgress[] = [];

    for (const key of keys) {
      const progressData = await redis.get(key);
      if (progressData) {
        const progress: JobProgress = JSON.parse(progressData);
        if (progress.userId === userId && ['waiting', 'active', 'delayed'].includes(progress.status)) {
          activeJobs.push(progress);
        }
      }
    }

    return activeJobs;
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await ideaProcessingQueue.getJob(jobId);
      if (job) {
        await job.remove();
        
        // Update progress to cancelled
        await this.updateJobProgress(jobId, {
          status: 'failed',
          progress: 0,
          currentStep: 'Cancelled',
          error: 'Job cancelled by user',
          endTime: new Date(),
        });

        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to cancel job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      ideaProcessingQueue.getWaiting(),
      ideaProcessingQueue.getActive(),
      ideaProcessingQueue.getCompleted(),
      ideaProcessingQueue.getFailed(),
      ideaProcessingQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Setup job processor
   */
  private async setupJobProcessor(): Promise<void> {
    logger.info('🔧 Setting up Bull job processor for "process-idea" jobs...');
    
    ideaProcessingQueue.process('process-idea', 1, async (job: Bull.Job<IdeaProcessingJobData>) => {
      const { data } = job;
      const startTime = Date.now();

      try {
        logger.info(`🚀 Starting idea processing job: ${data.jobId} (Bull ID: ${job.id})`);

        // Update status to active
        await this.updateJobProgress(data.jobId, {
          status: 'active',
          progress: 10,
          currentStep: 'Starting AI analysis',
          startTime: new Date(),
        });

        // Step 1: Save raw idea (10% progress)
        logger.info(`📝 Job ${data.jobId}: Step 1 - Saving idea to database`);
        await job.progress(15);
        await this.updateJobProgress(data.jobId, {
          progress: 15,
          currentStep: 'Saving idea to database',
          metrics: {
            stepsCompleted: ['idea_saved'],
            totalSteps: 7,
            aiCost: 0,
            tokensUsed: 0,
            processingTime: Date.now() - startTime,
          },
        });

        // Step 2: Business analysis (30% progress)
        logger.info(`🏢 Job ${data.jobId}: Step 2 - Analyzing business model`);
        await job.progress(30);
        await this.updateJobProgress(data.jobId, {
          progress: 30,
          currentStep: 'Analyzing business model',
        });

        // Step 3: Market validation (50% progress)
        logger.info(`📈 Job ${data.jobId}: Step 3 - Validating market opportunity`);
        await job.progress(50);
        await this.updateJobProgress(data.jobId, {
          progress: 50,
          currentStep: 'Validating market opportunity',
        });

        // Step 4: Feature generation (70% progress)
        logger.info(`⚡ Job ${data.jobId}: Step 4 - Generating feature roadmap`);
        await job.progress(70);
        await this.updateJobProgress(data.jobId, {
          progress: 70,
          currentStep: 'Generating feature roadmap',
        });

        // Step 5: Tech stack recommendation (85% progress)
        logger.info(`🛠️ Job ${data.jobId}: Step 5 - Recommending technology stack`);
        await job.progress(85);
        await this.updateJobProgress(data.jobId, {
          progress: 85,
          currentStep: 'Recommending technology stack',
        });

        // Process the idea using existing service
        logger.info(`🤖 Job ${data.jobId}: Step 6 - Running AI processing service`);
        const result = await ideaProcessingService.processIdea({
          projectId: data.projectId,
          description: data.description,
          targetAudience: data.targetAudience,
          problemStatement: data.problemStatement,
          desiredFeatures: data.desiredFeatures || [],
          technicalPreferences: data.technicalPreferences || [],
        });

        // Step 6: Finalizing results (95% progress)
        logger.info(`📊 Job ${data.jobId}: Step 7 - Finalizing analysis results`);
        await job.progress(95);
        await this.updateJobProgress(data.jobId, {
          progress: 95,
          currentStep: 'Finalizing analysis results',
        });

        // Complete the job
        const endTime = Date.now();
        const totalProcessingTime = endTime - startTime;

        await this.updateJobProgress(data.jobId, {
          status: 'completed',
          progress: 100,
          currentStep: 'Analysis complete',
          endTime: new Date(),
          result,
          metrics: {
            stepsCompleted: result.processingMetrics.stepsCompleted,
            totalSteps: 7,
            aiCost: result.processingMetrics.aiCost,
            tokensUsed: result.processingMetrics.tokensUsed,
            processingTime: totalProcessingTime,
          },
        });

        logger.info(`✅ Completed idea processing job: ${data.jobId} in ${totalProcessingTime}ms`);
        
        return result;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`❌ Job ${data.jobId} failed:`, error);

        await this.updateJobProgress(data.jobId, {
          status: 'failed',
          progress: 0,
          currentStep: 'Processing failed',
          endTime: new Date(),
          error: errorMessage,
          metrics: {
            stepsCompleted: [],
            totalSteps: 7,
            aiCost: 0,
            tokensUsed: 0,
            processingTime: Date.now() - startTime,
          },
        });

        throw error;
      }
    });
    
    logger.info('✅ Bull job processor setup complete');
  }

  /**
   * Setup event listeners for job lifecycle
   */
  private setupEventListeners(): void {
    ideaProcessingQueue.on('completed', async (job: Bull.Job, result: any) => {
      logger.info(`Job ${job.id} completed successfully`);
    });

    ideaProcessingQueue.on('failed', async (job: Bull.Job, err: Error) => {
      logger.error(`Job ${job.id} failed:`, err);
      
      // Update final failure status
      if (job.data?.jobId) {
        await this.updateJobProgress(job.data.jobId, {
          status: 'failed',
          progress: 0,
          currentStep: 'Processing failed',
          error: err.message,
          endTime: new Date(),
        });
      }
    });

    ideaProcessingQueue.on('stalled', async (job: Bull.Job) => {
      logger.warn(`Job ${job.id} stalled and will be retried`);
    });

    ideaProcessingQueue.on('progress', async (job: Bull.Job, progress: number) => {
      logger.debug(`Job ${job.id} progress: ${progress}%`);
    });

    // Clean up completed jobs periodically
    ideaProcessingQueue.on('cleaned', (jobs, type) => {
      logger.info(`Cleaned ${jobs.length} ${type} jobs from queue`);
    });

    // Redis connection events
    redis.on('connect', () => {
      logger.info('Connected to Redis successfully');
    });

    redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redis.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });
  }

  /**
   * Emit progress update via WebSocket
   */
  private emitProgressUpdate(progress: JobProgress): void {
    // Import WebSocket service dynamically to avoid circular dependencies
    import('./websocket.js').then(({ webSocketService }) => {
      webSocketService.emitJobProgress(progress);
    }).catch(error => {
      logger.error('Failed to emit progress update via WebSocket:', error);
    });
  }

  /**
   * Health check for queue service
   */
  async healthCheck(): Promise<{
    redis: boolean;
    queue: boolean;
    activeJobs: number;
    waitingJobs: number;
  }> {
    try {
      // Test Redis connection
      await redis.ping();
      
      // Get queue stats
      const stats = await this.getQueueStats();
      
      return {
        redis: true,
        queue: true,
        activeJobs: stats.active,
        waitingJobs: stats.waiting,
      };
    } catch (error) {
      logger.error('Queue health check failed:', error);
      return {
        redis: false,
        queue: false,
        activeJobs: 0,
        waitingJobs: 0,
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down job queue service...');
    
    try {
      await ideaProcessingQueue.close();
      await redis.quit();
      logger.info('Job queue service shut down successfully');
    } catch (error) {
      logger.error('Error during job queue shutdown:', error);
    }
  }
}

// Export singleton instance
export const jobQueueService = JobQueueService.getInstance(); 