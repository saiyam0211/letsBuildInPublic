import express, { Request, Response } from 'express';
import { body, param } from 'express-validator';
import { ideaProcessingService } from '../services/ideaProcessing.js';
import {
  jobQueueService,
  IdeaProcessingJobData,
} from '../services/jobQueue.js';
import { authenticateToken } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validation schemas
const processIdeaValidation = [
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('targetAudience')
    .isLength({ min: 5, max: 500 })
    .withMessage('Target audience must be between 5 and 500 characters'),
  body('problemStatement')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Problem statement must be between 10 and 1000 characters'),
  body('desiredFeatures')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Desired features must be an array with maximum 20 items'),
  body('technicalPreferences')
    .optional()
    .isArray({ max: 15 })
    .withMessage(
      'Technical preferences must be an array with maximum 15 items'
    ),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Priority must be an integer between 0 and 10'),
];

const jobIdValidation = [
  param('jobId').isUUID().withMessage('Job ID must be a valid UUID'),
];

const projectIdValidation = [
  param('projectId')
    .isMongoId()
    .withMessage('Project ID must be a valid MongoDB ObjectId'),
];

/**
 * @route POST /api/projects/:projectId/ideas/process
 * @desc Start asynchronous idea processing
 * @access Private
 */
router.post(
  '/projects/:projectId/ideas/process',
  authenticateToken,
  [...projectIdValidation, ...processIdeaValidation],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
        });
        return;
      }

      const {
        description,
        targetAudience,
        problemStatement,
        desiredFeatures = [],
        technicalPreferences = [],
        priority = 0,
      } = req.body;

      const userId = req.user!.userId;
      const jobId = uuidv4();

      // Create job data
      const jobData: IdeaProcessingJobData = {
        jobId,
        userId,
        projectId,
        description,
        targetAudience,
        problemStatement,
        desiredFeatures,
        technicalPreferences,
        priority,
      };

      // Add job to queue
      const job = await jobQueueService.addIdeaProcessingJob(jobData);

      logger.info(
        `Started idea processing job ${jobId} for project ${projectId} by user ${userId}`
      );

      res.status(202).json({
        success: true,
        message: 'Idea processing started',
        data: {
          jobId,
          projectId,
          status: 'queued',
          estimatedDuration: '2-5 minutes',
          bullJobId: job.id,
        },
      });
    } catch (error) {
      logger.error('Failed to start idea processing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start idea processing',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route POST /api/projects/:projectId/ideas/process-sync
 * @desc Process idea synchronously (for backward compatibility)
 * @access Private
 */
router.post(
  '/projects/:projectId/ideas/process-sync',
  authenticateToken,
  [...projectIdValidation, ...processIdeaValidation],
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      if (!projectId) {
        res.status(400).json({
          success: false,
          message: 'Project ID is required',
        });
        return;
      }

      const {
        description,
        targetAudience,
        problemStatement,
        desiredFeatures = [],
        technicalPreferences = [],
      } = req.body;

      // Process idea directly (synchronous)
      const result = await ideaProcessingService.processIdea({
        projectId,
        description,
        targetAudience,
        problemStatement,
        desiredFeatures,
        technicalPreferences,
      });

      logger.info(
        `Completed synchronous idea processing for project ${projectId}`
      );

      res.status(200).json({
        success: true,
        message: 'Idea processed successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Failed to process idea synchronously:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process idea',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route GET /api/jobs/:jobId/status
 * @desc Get job status and progress
 * @access Private
 */
router.get(
  '/jobs/:jobId/status',
  authenticateToken,
  jobIdValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        res.status(400).json({
          success: false,
          message: 'Job ID is required',
        });
        return;
      }

      const userId = req.user!.userId;

      const progress = await jobQueueService.getJobProgress(jobId);

      if (!progress) {
        res.status(404).json({
          success: false,
          message: 'Job not found',
        });
        return;
      }

      // Check if user owns this job
      if (progress.userId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this job',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      logger.error('Failed to get job status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route DELETE /api/jobs/:jobId
 * @desc Cancel a job
 * @access Private
 */
router.delete(
  '/jobs/:jobId',
  authenticateToken,
  jobIdValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        res.status(400).json({
          success: false,
          message: 'Job ID is required',
        });
        return;
      }

      const userId = req.user!.userId;

      // Get job progress to verify ownership
      const progress = await jobQueueService.getJobProgress(jobId);

      if (!progress) {
        res.status(404).json({
          success: false,
          message: 'Job not found',
        });
        return;
      }

      if (progress.userId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this job',
        });
        return;
      }

      const cancelled = await jobQueueService.cancelJob(jobId);

      if (cancelled) {
        res.status(200).json({
          success: true,
          message: 'Job cancelled successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to cancel job',
        });
      }
    } catch (error) {
      logger.error('Failed to cancel job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel job',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route GET /api/jobs/my-jobs
 * @desc Get user's active jobs
 * @access Private
 */
router.get(
  '/jobs/my-jobs',
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const activeJobs = await jobQueueService.getUserActiveJobs(userId);

      res.status(200).json({
        success: true,
        data: {
          activeJobs,
          count: activeJobs.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get user jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user jobs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route GET /api/queue/stats
 * @desc Get queue statistics (admin only)
 * @access Private (Admin)
 */
router.get(
  '/queue/stats',
  authenticateToken,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // Check if user is admin (optional - can be implemented later)
      // const isAdmin = req.user!.role === 'admin';
      // if (!isAdmin) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Admin access required',
      //   });
      // }

      const stats = await jobQueueService.getQueueStats();
      const healthCheck = await jobQueueService.healthCheck();

      res.status(200).json({
        success: true,
        data: {
          queue: stats,
          health: healthCheck,
        },
      });
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get queue stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route GET /api/projects/:projectId/ideas/latest
 * @desc Get latest processed idea result for a project
 * @access Private
 */
router.get(
  '/projects/:projectId/ideas/latest',
  authenticateToken,
  projectIdValidation,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;

      // Get user's latest completed job for this project
      const activeJobs = await jobQueueService.getUserActiveJobs(userId);
      const completedJob = activeJobs.find(
        job => job.projectId === projectId && job.status === 'completed'
      );

      if (!completedJob || !completedJob.result) {
        res.status(404).json({
          success: false,
          message: 'No completed idea processing found for this project',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          result: completedJob.result,
          processedAt: completedJob.endTime,
          metrics: completedJob.metrics,
        },
      });
    } catch (error) {
      logger.error('Failed to get latest idea result:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get latest idea result',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * @route GET /api/queue/health
 * @desc Health check for queue services
 * @access Public
 */
router.get(
  '/queue/health',
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const healthCheck = await jobQueueService.healthCheck();

      const statusCode = healthCheck.redis && healthCheck.queue ? 200 : 503;

      res.status(statusCode).json({
        success: healthCheck.redis && healthCheck.queue,
        data: healthCheck,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Queue health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export default router;
