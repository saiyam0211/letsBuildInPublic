import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { ProjectMember } from '../models/ProjectMember';
import { Invitation } from '../models/Invitation';
import { ActivityLog } from '../models/ActivityLog';
import { User } from '../models/User';
import mongoose from 'mongoose';

interface CollaborationError {
  name: string;
  errors: Record<string, { message: string }>;
}

interface MemberQuery {
  projectId: mongoose.Types.ObjectId;
  status?: string;
  role?: string;
}

interface InvitationQuery {
  projectId: mongoose.Types.ObjectId;
  status?: string;
  email?: { $regex: string; $options: string };
}

/**
 * Get project members
 * GET /api/projects/:id/members
 */
export const getProjectMembers = async (
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

    // Validate project ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    const projectObjectId = new mongoose.Types.ObjectId(id);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if user has access to the project
    const userMember = await ProjectMember.findOne({
      projectId: projectObjectId,
      userId: userObjectId,
      status: 'active',
    });

    if (!userMember) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      });
      return;
    }

    // Query parameters
    const status = req.query.status as string;
    const role = req.query.role as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Build query
    const query: MemberQuery = { projectId: projectObjectId };
    if (status && ['active', 'pending', 'suspended'].includes(status)) {
      query.status = status;
    }
    if (role && ['owner', 'admin', 'editor', 'viewer'].includes(role)) {
      query.role = role;
    }

    const skip = (page - 1) * limit;

    // Get members
    const [members, totalMembers] = await Promise.all([
      ProjectMember.find(query)
        .sort({ role: 1, joinedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .populate('projectId', 'name'),
      ProjectMember.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalMembers / limit);

    res.status(200).json({
      success: true,
      message: 'Project members retrieved successfully',
      data: {
        members: members.map(member => member.toJSON()),
        pagination: {
          currentPage: page,
          totalPages,
          totalMembers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching project members:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching project members',
    });
  }
};

/**
 * Invite user to project
 * POST /api/projects/:id/invite
 */
export const inviteToProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role, message } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate project ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    const projectObjectId = new mongoose.Types.ObjectId(id);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if user has permission to invite
    const hasPermission = await ProjectMember.hasPermission(
      id,
      userId,
      'canInvite'
    );
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to invite members to this project',
      });
      return;
    }

    // Check if project exists
    const project = await Project.findById(projectObjectId);
    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      projectId: projectObjectId,
      $or: [{ userId: { $in: await User.find({ email }).distinct('_id') } }],
    });

    if (existingMember) {
      res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
      return;
    }

    // Check if there's already a pending invitation
    const existingInvitation = await Invitation.findOne({
      projectId: projectObjectId,
      email: email.toLowerCase(),
      status: 'pending',
    });

    if (existingInvitation) {
      res.status(400).json({
        success: false,
        message: 'Invitation already sent to this email address',
      });
      return;
    }

    // Create invitation
    const invitation = new Invitation({
      projectId: projectObjectId,
      invitedBy: userObjectId,
      email: email.toLowerCase(),
      role,
      message,
      metadata: {
        inviteSource: 'email',
        ipAddress: req.ip,
        browserInfo: req.get('User-Agent'),
      },
    });

    await invitation.save();

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logData: any = {
      projectId: id,
      userId,
      action: 'invitation.sent',
      entityType: 'invitation',
      entityId: invitation._id,
      description: `Invited ${email} with role ${role}`,
      metadata: { email, role, message },
    };
    if (req.ip) logData.ipAddress = req.ip;
    if (req.get('User-Agent')) logData.userAgent = req.get('User-Agent');

    await ActivityLog.logActivity(logData);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitation: invitation.toJSON(),
      },
    });
  } catch (error) {
    console.error('Error sending invitation:', error);

    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      error.name === 'ValidationError'
    ) {
      const validationError = error as CollaborationError;
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(validationError.errors).map(err => err.message),
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error while sending invitation',
      });
    }
  }
};

/**
 * Accept project invitation
 * POST /api/invitations/:token/accept
 */
export const acceptInvitation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate token parameter
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token parameter is required',
      });
      return;
    }

    // Find valid invitation
    const invitation = await Invitation.findByToken(token);
    if (!invitation) {
      res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation',
      });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check if user email matches invitation email
    const user = await User.findById(userObjectId);
    if (!user || user.email !== invitation.email) {
      res.status(403).json({
        success: false,
        message: 'This invitation is not for your email address',
      });
      return;
    }

    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      projectId: invitation.projectId,
      userId: userObjectId,
    });

    if (existingMember) {
      res.status(400).json({
        success: false,
        message: 'You are already a member of this project',
      });
      return;
    }

    // Accept invitation and create member
    await invitation.accept(userObjectId);

    const member = new ProjectMember({
      projectId: invitation.projectId,
      userId: userObjectId,
      role: invitation.role,
      status: 'active',
    });

    await member.save();

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acceptLogData: any = {
      projectId: invitation.projectId.toString(),
      userId,
      action: 'member.joined',
      entityType: 'member',
      entityId: member._id,
      description: `${user.name} joined the project with role ${invitation.role}`,
      metadata: { role: invitation.role, invitationId: invitation._id },
    };
    if (req.ip) acceptLogData.ipAddress = req.ip;
    if (req.get('User-Agent')) acceptLogData.userAgent = req.get('User-Agent');

    await ActivityLog.logActivity(acceptLogData);

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        member: member.toJSON(),
        project: invitation.projectId,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while accepting invitation',
    });
  }
};

/**
 * Decline project invitation
 * POST /api/invitations/:token/decline
 */
export const declineInvitation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    // Validate token parameter
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token parameter is required',
      });
      return;
    }

    // Find valid invitation
    const invitation = await Invitation.findByToken(token);
    if (!invitation) {
      res.status(404).json({
        success: false,
        message: 'Invalid or expired invitation',
      });
      return;
    }

    // Decline invitation
    await invitation.decline();

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const declineLogData: any = {
      projectId: invitation.projectId.toString(),
      userId: invitation.invitedBy.toString(),
      action: 'invitation.declined',
      entityType: 'invitation',
      entityId: invitation._id,
      description: `Invitation to ${invitation.email} was declined`,
      metadata: { email: invitation.email, role: invitation.role },
    };
    if (req.ip) declineLogData.ipAddress = req.ip;
    if (req.get('User-Agent')) declineLogData.userAgent = req.get('User-Agent');

    await ActivityLog.logActivity(declineLogData);

    res.status(200).json({
      success: true,
      message: 'Invitation declined successfully',
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while declining invitation',
    });
  }
};

/**
 * Update member role
 * PUT /api/projects/:id/members/:memberId
 */
export const updateMemberRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate IDs
    if (
      !id ||
      !memberId ||
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
      return;
    }

    const projectObjectId = new mongoose.Types.ObjectId(id);
    const memberObjectId = new mongoose.Types.ObjectId(memberId);

    // Check permissions
    const hasPermission = await ProjectMember.hasPermission(
      id,
      userId,
      'canManageMembers'
    );
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to manage members',
      });
      return;
    }

    // Find the member to update
    const member = await ProjectMember.findOne({
      _id: memberObjectId,
      projectId: projectObjectId,
    }).populate('userId', 'name email');

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      });
      return;
    }

    // Prevent changing owner role
    if (member.role === 'owner') {
      res.status(400).json({
        success: false,
        message: 'Cannot change the role of the project owner',
      });
      return;
    }

    const oldRole = member.role;
    member.role = role;
    await member.save();

    // Get populated user data safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const populatedUser = member.userId as any;
    const userName = populatedUser?.name || 'Unknown User';

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateLogData: any = {
      projectId: id,
      userId,
      action: 'member.role_changed',
      entityType: 'member',
      entityId: member._id,
      description: `Changed ${userName}'s role from ${oldRole} to ${role}`,
      changes: { role: { old: oldRole, new: role } },
      metadata: { memberId: member._id, targetUserId: member.userId._id },
    };
    if (req.ip) updateLogData.ipAddress = req.ip;
    if (req.get('User-Agent')) updateLogData.userAgent = req.get('User-Agent');

    await ActivityLog.logActivity(updateLogData);

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: {
        member: member.toJSON(),
      },
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating member role',
    });
  }
};

/**
 * Remove member from project
 * DELETE /api/projects/:id/members/:memberId
 */
export const removeMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate IDs
    if (
      !id ||
      !memberId ||
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
      return;
    }

    const projectObjectId = new mongoose.Types.ObjectId(id);
    const memberObjectId = new mongoose.Types.ObjectId(memberId);

    // Check permissions
    const hasPermission = await ProjectMember.hasPermission(
      id,
      userId,
      'canManageMembers'
    );
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to manage members',
      });
      return;
    }

    // Find the member to remove
    const member = await ProjectMember.findOne({
      _id: memberObjectId,
      projectId: projectObjectId,
    }).populate('userId', 'name email');

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      });
      return;
    }

    // Prevent removing owner
    if (member.role === 'owner') {
      res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner',
      });
      return;
    }

    // Get populated user data safely before deletion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const populatedUser = member.userId as any;
    const userName = populatedUser?.name || 'Unknown User';
    const userIdToLog = member.userId._id;

    await member.deleteOne();

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const removeLogData: any = {
      projectId: id,
      userId,
      action: 'member.removed',
      entityType: 'member',
      description: `Removed ${userName} from the project`,
      metadata: {
        removedUserId: userIdToLog,
        removedUserName: userName,
        role: member.role,
      },
    };
    if (req.ip) removeLogData.ipAddress = req.ip;
    if (req.get('User-Agent')) removeLogData.userAgent = req.get('User-Agent');

    await ActivityLog.logActivity(removeLogData);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing member',
    });
  }
};

/**
 * Get project invitations
 * GET /api/projects/:id/invitations
 */
export const getProjectInvitations = async (
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

    // Validate project ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    const projectObjectId = new mongoose.Types.ObjectId(id);

    // Check permissions
    const hasPermission = await ProjectMember.hasPermission(
      id,
      userId,
      'canInvite'
    );
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view invitations',
      });
      return;
    }

    // Query parameters
    const status = req.query.status as string;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Build query
    const query: InvitationQuery = { projectId: projectObjectId };
    if (
      status &&
      ['pending', 'accepted', 'declined', 'expired', 'cancelled'].includes(
        status
      )
    ) {
      query.status = status;
    }
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    // Get invitations
    const [invitations, totalInvitations] = await Promise.all([
      Invitation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('invitedBy', 'name email'),
      Invitation.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalInvitations / limit);

    res.status(200).json({
      success: true,
      message: 'Project invitations retrieved successfully',
      data: {
        invitations: invitations.map(invitation => invitation.toJSON()),
        pagination: {
          currentPage: page,
          totalPages,
          totalInvitations,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching project invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching project invitations',
    });
  }
};

/**
 * Get project activity feed
 * GET /api/projects/:id/activity
 */
export const getProjectActivity = async (
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

    // Validate project ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    // Check if user has access to the project
    const userMember = await ProjectMember.findOne({
      projectId: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active',
    });

    if (!userMember) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this project',
      });
      return;
    }

    // Query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const actions = req.query.actions as string;
    const severity = req.query.severity as string;
    const targetUserId = req.query.userId as string;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      page,
      limit,
    };

    if (actions) options.actions = actions.split(',');
    if (severity) options.severity = severity.split(',');
    if (targetUserId)
      options.userId = new mongoose.Types.ObjectId(targetUserId);
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const result = await ActivityLog.getProjectFeed(id, options);

    res.status(200).json({
      success: true,
      message: 'Project activity feed retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error fetching project activity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching project activity',
    });
  }
};

/**
 * Get project activity analytics
 * GET /api/projects/:id/activity/analytics
 */
export const getActivityAnalytics = async (
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

    // Validate project ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
      });
      return;
    }

    // Check permissions
    const hasPermission = await ProjectMember.hasPermission(
      id,
      userId,
      'canViewAnalytics'
    );
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view analytics',
      });
      return;
    }

    const period = (req.query.period as 'day' | 'week' | 'month') || 'week';
    const analytics = await ActivityLog.getAnalytics(id, period);

    res.status(200).json({
      success: true,
      message: 'Activity analytics retrieved successfully',
      data: analytics,
    });
  } catch (error) {
    console.error('Error fetching activity analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching activity analytics',
    });
  }
};
