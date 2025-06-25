import { Request, Response } from 'express';
import { SaasIdea } from '../models/SaasIdea.js';
import { Project } from '../models/Project.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * @desc    Submit a new SaaS idea for a project
 * @route   POST /api/projects/:id/ideas
 * @access  Private
 */
export const submitIdea = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user!.userId;

    const {
      description,
      targetAudience,
      problemStatement,
      desiredFeatures = [],
      technicalPreferences = [],
    } = req.body;

    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ ownerId: userId }, { 'members.userId': userId }],
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Check if project already has an idea (one idea per project)
    const existingIdea = await SaasIdea.findOne({ projectId });
    if (existingIdea) {
      res.status(409).json({
        success: false,
        message: 'Project already has a SaaS idea. Use PUT to update it.',
        data: { ideaId: existingIdea._id },
      });
      return;
    }

    // Create new idea
    const newIdea = new SaasIdea({
      projectId,
      description,
      targetAudience,
      problemStatement,
      desiredFeatures,
      technicalPreferences,
    });

    await newIdea.save();

    logger.info(
      `Created new SaaS idea ${newIdea._id} for project ${projectId} by user ${userId}`
    );

    res.status(201).json({
      success: true,
      message: 'SaaS idea submitted successfully',
      data: newIdea,
    });
  } catch (error) {
    logger.error('Failed to submit SaaS idea:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit SaaS idea',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @desc    Get SaaS idea details by project and idea ID
 * @route   GET /api/projects/:id/ideas/:ideaId
 * @access  Private
 */
export const getIdeaDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: projectId, ideaId } = req.params;
    const userId = req.user!.userId;

    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ ownerId: userId }, { 'members.userId': userId }],
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Find the idea
    const idea = await SaasIdea.findOne({
      _id: ideaId,
      projectId,
    });

    if (!idea) {
      res.status(404).json({
        success: false,
        message: 'SaaS idea not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: idea,
    });
  } catch (error) {
    logger.error('Failed to get SaaS idea details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve SaaS idea',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @desc    Get all SaaS ideas for a project (typically just one)
 * @route   GET /api/projects/:id/ideas
 * @access  Private
 */
export const getProjectIdeas = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user!.userId;

    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ ownerId: userId }, { 'members.userId': userId }],
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Find ideas for this project
    const ideas = await SaasIdea.find({ projectId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: ideas,
      count: ideas.length,
    });
  } catch (error) {
    logger.error('Failed to get project ideas:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project ideas',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @desc    Update a SaaS idea
 * @route   PUT /api/projects/:id/ideas/:ideaId
 * @access  Private
 */
export const updateIdea = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: projectId, ideaId } = req.params;
    const userId = req.user!.userId;

    const {
      description,
      targetAudience,
      problemStatement,
      desiredFeatures,
      technicalPreferences,
    } = req.body;

    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ ownerId: userId }, { 'members.userId': userId }],
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Update the idea
    const updatedIdea = await SaasIdea.findOneAndUpdate(
      { _id: ideaId, projectId },
      {
        ...(description && { description }),
        ...(targetAudience && { targetAudience }),
        ...(problemStatement && { problemStatement }),
        ...(desiredFeatures && { desiredFeatures }),
        ...(technicalPreferences && { technicalPreferences }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedIdea) {
      res.status(404).json({
        success: false,
        message: 'SaaS idea not found',
      });
      return;
    }

    logger.info(
      `Updated SaaS idea ${ideaId} for project ${projectId} by user ${userId}`
    );

    res.status(200).json({
      success: true,
      message: 'SaaS idea updated successfully',
      data: updatedIdea,
    });
  } catch (error) {
    logger.error('Failed to update SaaS idea:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update SaaS idea',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @desc    Delete a SaaS idea
 * @route   DELETE /api/projects/:id/ideas/:ideaId
 * @access  Private
 */
export const deleteIdea = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: projectId, ideaId } = req.params;
    const userId = req.user!.userId;

    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ ownerId: userId }, { 'members.userId': userId }],
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Delete the idea
    const deletedIdea = await SaasIdea.findOneAndDelete({
      _id: ideaId,
      projectId,
    });

    if (!deletedIdea) {
      res.status(404).json({
        success: false,
        message: 'SaaS idea not found',
      });
      return;
    }

    logger.info(
      `Deleted SaaS idea ${ideaId} from project ${projectId} by user ${userId}`
    );

    res.status(200).json({
      success: true,
      message: 'SaaS idea deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete SaaS idea:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete SaaS idea',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @desc    Trigger AI processing for a specific SaaS idea
 * @route   POST /api/projects/:id/ideas/:ideaId/process
 * @access  Private
 */
export const processIdeaById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: projectId, ideaId } = req.params;
    const userId = req.user!.userId;

    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ ownerId: userId }, { 'members.userId': userId }],
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Find the idea
    const idea = await SaasIdea.findOne({
      _id: ideaId,
      projectId,
    });

    if (!idea) {
      res.status(404).json({
        success: false,
        message: 'SaaS idea not found',
      });
      return;
    }

    // Import job queue service dynamically to avoid circular dependencies
    const { jobQueueService } = await import('../services/jobQueue.js');
    const { v4: uuidv4 } = await import('uuid');

    // Create job data from the existing idea
    const jobId = uuidv4();
    const jobData = {
      jobId,
      userId,
      projectId: projectId as string, // Type assertion since we know it exists from params
      description: idea.description,
      targetAudience: idea.targetAudience,
      problemStatement: idea.problemStatement,
      desiredFeatures: idea.desiredFeatures || [],
      technicalPreferences: idea.technicalPreferences || [],
      priority: 0,
    };

    // Add job to queue
    const job = await jobQueueService.addIdeaProcessingJob(jobData);

    logger.info(
      `Started AI processing for idea ${ideaId} in project ${projectId} by user ${userId}`
    );

    res.status(202).json({
      success: true,
      message: 'AI processing started for idea',
      data: {
        jobId,
        ideaId,
        projectId,
        status: 'queued',
        estimatedDuration: '2-5 minutes',
        bullJobId: job.id,
      },
    });
  } catch (error) {
    logger.error('Failed to start AI processing for idea:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start AI processing',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @desc    Get AI processing status for a specific SaaS idea
 * @route   GET /api/projects/:id/ideas/:ideaId/status
 * @access  Private
 */
export const getIdeaProcessingStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: projectId, ideaId } = req.params;
    const userId = req.user!.userId;

    // Verify project exists and user has access
    const project = await Project.findOne({
      _id: projectId,
      $or: [{ ownerId: userId }, { 'members.userId': userId }],
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Find the idea
    const idea = await SaasIdea.findOne({
      _id: ideaId,
      projectId,
    });

    if (!idea) {
      res.status(404).json({
        success: false,
        message: 'SaaS idea not found',
      });
      return;
    }

    // Import job queue service dynamically
    const { jobQueueService } = await import('../services/jobQueue.js');

    // Get all user's active jobs and find ones for this project/idea
    const activeJobs = await jobQueueService.getUserActiveJobs(userId);
    const ideaJobs = activeJobs.filter(job => job.projectId === projectId);

    if (ideaJobs.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No processing jobs found for this idea',
        data: {
          ideaId,
          projectId,
          status: 'not_processed',
          hasActiveJobs: false,
          jobs: [],
        },
      });
      return;
    }

    // Return the most recent job status
    const latestJob = ideaJobs.sort(
      (a, b) =>
        new Date(b.startTime || 0).getTime() -
        new Date(a.startTime || 0).getTime()
    )[0];

    // Since we filtered ideaJobs and checked length > 0, latestJob should exist
    if (!latestJob) {
      res.status(500).json({
        success: false,
        message: 'Unexpected error: no job found after filtering',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ideaId,
        projectId,
        status: latestJob.status,
        progress: latestJob.progress,
        currentStep: latestJob.currentStep,
        jobId: latestJob.jobId,
        startTime: latestJob.startTime,
        endTime: latestJob.endTime,
        error: latestJob.error,
        result: latestJob.result,
        metrics: latestJob.metrics,
        hasActiveJobs: ideaJobs.some(job =>
          ['waiting', 'active'].includes(job.status)
        ),
        totalJobs: ideaJobs.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get idea processing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get processing status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
