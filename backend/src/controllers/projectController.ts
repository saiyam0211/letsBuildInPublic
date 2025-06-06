import { Request, Response } from 'express';
import { Project, IProject } from '../models/Project';
import { SaasIdea } from '../models/SaasIdea';
import { Feature } from '../models/Feature';
import { Task } from '../models/Task';
import { TechStackRecommendation } from '../models/TechStackRecommendation';
import { Diagram } from '../models/Diagram';
import { Blueprint } from '../models/Blueprint';
import mongoose from 'mongoose';
import { ProjectMember } from '../models/ProjectMember';
import { ActivityLog } from '../models/ActivityLog';

interface ProjectOverview {
  project: IProject;
  totalFeatures: number;
  totalTasks: number;
  completedTasks: number;
  techStackStatus: boolean;
  diagramsCount: number;
  blueprintStatus: boolean;
  ideaValidated: boolean;
  progressPercentage: number;
}

interface ValidationError extends Error {
  name: 'ValidationError';
  errors: Record<string, { message: string }>;
}

interface ProjectQuery {
  ownerId: mongoose.Types.ObjectId;
  status?: string;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
}

/**
 * Create a new project
 * POST /api/projects
 */
export const createProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate required fields
    if (!name || !description) {
      res.status(400).json({
        success: false,
        message: 'Project name and description are required',
      });
      return;
    }

    // Create new project
    const projectData = {
      name: name.trim(),
      description: description.trim(),
      ownerId: new mongoose.Types.ObjectId(userId),
      status: 'planning' as const,
    };

    const project = new Project(projectData);
    await project.save();

    // Create owner membership
    const ownerMember = new ProjectMember({
      projectId: project._id,
      userId: new mongoose.Types.ObjectId(userId),
      role: 'owner',
      status: 'active',
    });
    await ownerMember.save();

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logData: any = {
      projectId: project._id.toString(),
      userId,
      action: 'project.created',
      entityType: 'project',
      entityId: project._id,
      description: `Created new project: ${project.name}`,
      metadata: {
        projectName: project.name,
        projectDescription: project.description,
      },
    };
    if (req.ip) logData.ipAddress = req.ip;
    if (req.get('User-Agent')) logData.userAgent = req.get('User-Agent');

    await ActivityLog.logActivity(logData);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: project.toJSON(),
        membership: ownerMember.toJSON(),
      },
    });
  } catch (error) {
    console.error('Error creating project:', error);

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ValidationError'
    ) {
      const validationError = error as ValidationError;
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(validationError.errors).map(err => err.message),
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating project',
      });
    }
  }
};

/**
 * Get user's projects with pagination and filtering
 * GET /api/projects
 */
export const getUserProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    // Build query - userId is guaranteed to be defined at this point
    const query: ProjectQuery = {
      ownerId: new mongoose.Types.ObjectId(userId!),
    };

    if (
      status &&
      ['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'].includes(
        status
      )
    ) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [projects, totalProjects] = await Promise.all([
      Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('ownerId', 'name email'),
      Project.countDocuments(query),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProjects / limit);

    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: {
        projects: projects.map(project => project.toJSON()),
        pagination: {
          currentPage: page,
          totalPages,
          totalProjects,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching projects',
    });
  }
};

/**
 * Get project details by ID
 * GET /api/projects/:id
 */
export const getProjectDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
      return;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    // Find project and verify ownership - userId is guaranteed to be defined at this point
    const project = await Project.findOne({
      _id: new mongoose.Types.ObjectId(id),
      ownerId: new mongoose.Types.ObjectId(userId!),
    }).populate('ownerId', 'name email');

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project details retrieved successfully',
      data: {
        project: project.toJSON(),
      },
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching project details',
    });
  }
};

/**
 * Update project details
 * PUT /api/projects/:id
 */
export const updateProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
      return;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    // Remove fields that shouldn't be updated directly
    const { _id, ownerId, createdAt, ...allowedUpdates } = updateData;

    // Find and update project with ownership verification
    const project = await Project.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        ownerId: new mongoose.Types.ObjectId(userId!),
      },
      {
        ...allowedUpdates,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate('ownerId', 'name email');

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: project.toJSON(),
      },
    });
  } catch (error) {
    console.error('Error updating project:', error);

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ValidationError'
    ) {
      const validationError = error as ValidationError;
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(validationError.errors).map(err => err.message),
      });
    } else if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'CastError'
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating project',
      });
    }
  }
};

/**
 * Delete a project and all associated data
 * DELETE /api/projects/:id
 */
export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
      return;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    const projectObjectId = new mongoose.Types.ObjectId(id);
    const userObjectId = new mongoose.Types.ObjectId(userId!);

    // Find project and verify ownership
    const project = await Project.findOne({
      _id: projectObjectId,
      ownerId: userObjectId,
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Delete all associated data in parallel
    await Promise.all([
      SaasIdea.deleteMany({ projectId: projectObjectId }),
      Feature.deleteMany({ projectId: projectObjectId }),
      Task.deleteMany({ projectId: projectObjectId }),
      TechStackRecommendation.deleteMany({ projectId: projectObjectId }),
      Diagram.deleteMany({ projectId: projectObjectId }),
      Blueprint.deleteMany({ projectId: projectObjectId }),
    ]);

    // Delete the project itself
    await Project.findByIdAndDelete(projectObjectId);

    res.status(200).json({
      success: true,
      message: 'Project and all associated data deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting project',
    });
  }
};

/**
 * Get comprehensive project overview with analytics
 * GET /api/projects/:id/overview
 */
export const getProjectOverview = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
      return;
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    const projectObjectId = new mongoose.Types.ObjectId(id);
    const userObjectId = new mongoose.Types.ObjectId(userId!);

    // Find project and verify ownership
    const project = await Project.findOne({
      _id: projectObjectId,
      ownerId: userObjectId,
    }).populate('ownerId', 'name email');

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found or access denied',
      });
      return;
    }

    // Gather analytics data in parallel
    const [
      totalFeatures,
      totalTasks,
      completedTasks,
      techStackExists,
      diagramsCount,
      blueprintExists,
      ideaExists,
    ] = await Promise.all([
      Feature.countDocuments({ projectId: projectObjectId }),
      Task.countDocuments({ projectId: projectObjectId }),
      Task.countDocuments({ projectId: projectObjectId, status: 'completed' }),
      TechStackRecommendation.exists({ projectId: projectObjectId }),
      Diagram.countDocuments({ projectId: projectObjectId }),
      Blueprint.exists({ projectId: projectObjectId }),
      SaasIdea.exists({ projectId: projectObjectId }),
    ]);

    // Calculate progress percentage
    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const overview: ProjectOverview = {
      project: project.toJSON() as IProject,
      totalFeatures,
      totalTasks,
      completedTasks,
      techStackStatus: !!techStackExists,
      diagramsCount,
      blueprintStatus: !!blueprintExists,
      ideaValidated: !!ideaExists,
      progressPercentage,
    };

    res.status(200).json({
      success: true,
      message: 'Project overview retrieved successfully',
      data: {
        overview,
      },
    });
  } catch (error) {
    console.error('Error fetching project overview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching project overview',
    });
  }
};
