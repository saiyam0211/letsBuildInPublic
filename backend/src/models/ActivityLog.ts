import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  entityType:
    | 'project'
    | 'feature'
    | 'task'
    | 'member'
    | 'invitation'
    | 'blueprint'
    | 'idea'
    | 'diagram';
  entityId?: mongoose.Types.ObjectId;
  details: {
    description: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    metadata?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  isVisible: boolean;
  createdAt: Date;
}

export interface IActivityLogModel extends Model<IActivityLog> {
  logActivity(activityData: {
    projectId: string | mongoose.Types.ObjectId;
    userId: string | mongoose.Types.ObjectId;
    action: string;
    entityType: string;
    entityId?: string | mongoose.Types.ObjectId;
    description: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
  }): Promise<IActivityLog>;

  getProjectFeed(
    projectId: string | mongoose.Types.ObjectId,
    options?: {
      page?: number;
      limit?: number;
      actions?: string[];
      severity?: string[];
      userId?: string | mongoose.Types.ObjectId;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    logs: IActivityLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalLogs: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>;

  getAnalytics(
    projectId: string | mongoose.Types.ObjectId,
    period?: 'day' | 'week' | 'month'
  ): Promise<{
    period: string;
    totalActivity: number;
    activeUsers: number;
    actionBreakdown: Array<{ _id: string; count: number }>;
    severityBreakdown: Array<{ _id: string; count: number }>;
  }>;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      maxlength: [100, 'Action cannot exceed 100 characters'],
      enum: {
        values: [
          // Project actions
          'project.created',
          'project.updated',
          'project.deleted',
          'project.status_changed',

          // Member actions
          'member.invited',
          'member.joined',
          'member.left',
          'member.removed',
          'member.role_changed',
          'member.permissions_updated',

          // Invitation actions
          'invitation.sent',
          'invitation.accepted',
          'invitation.declined',
          'invitation.cancelled',
          'invitation.reminder_sent',
          'invitation.expired',

          // Feature actions
          'feature.created',
          'feature.updated',
          'feature.deleted',
          'feature.priority_changed',

          // Task actions
          'task.created',
          'task.updated',
          'task.deleted',
          'task.status_changed',
          'task.assigned',
          'task.completed',

          // Blueprint actions
          'blueprint.generated',
          'blueprint.updated',
          'blueprint.exported',
          'blueprint.shared',
          'blueprint.archived',

          // Idea actions
          'idea.created',
          'idea.updated',
          'idea.validated',
          'idea.archived',

          // Diagram actions
          'diagram.created',
          'diagram.updated',
          'diagram.deleted',
          'diagram.exported',

          // System actions
          'system.backup_created',
          'system.data_imported',
          'system.data_exported',
          'system.settings_updated',
        ],
        message: 'Invalid action type',
      },
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: {
        values: [
          'project',
          'feature',
          'task',
          'member',
          'invitation',
          'blueprint',
          'idea',
          'diagram',
        ],
        message:
          'Entity type must be one of: project, feature, task, member, invitation, blueprint, idea, diagram',
      },
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    details: {
      description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
      },
      changes: {
        type: Schema.Types.Mixed,
        validate: {
          validator: function (
            changes: Record<string, { old: unknown; new: unknown }>
          ) {
            if (!changes) return true;

            // Ensure it's an object and has valid structure
            if (typeof changes !== 'object') return false;

            let changeCount = 0;
            for (const [, value] of Object.entries(changes)) {
              if (
                value &&
                typeof value === 'object' &&
                'old' in value &&
                'new' in value
              ) {
                changeCount++;
              }
            }

            return changeCount > 0;
          },
          message: 'Changes must be an object with old/new value pairs',
        },
      },
      metadata: {
        type: Schema.Types.Mixed,
        validate: {
          validator: function (metadata: Record<string, unknown>) {
            if (!metadata) return true;
            return typeof metadata === 'object';
          },
          message: 'Metadata must be an object',
        },
      },
    },
    ipAddress: {
      type: String,
      trim: true,
      validate: {
        validator: function (ip: string) {
          if (!ip) return true;
          // IPv4 pattern
          const ipv4Pattern =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          // IPv6 pattern (including IPv4-mapped IPv6 addresses)
          const ipv6Pattern =
            /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^::ffff:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;
          // Additional IPv6 patterns
          const ipv6CompressedPattern =
            /^([0-9a-fA-F]{1,4}:){1,7}:([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^::[0-9a-fA-F]{1,4}$/;

          return (
            ipv4Pattern.test(ip) ||
            ipv6Pattern.test(ip) ||
            ipv6CompressedPattern.test(ip)
          );
        },
        message: 'Invalid IP address format',
      },
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: [500, 'User agent cannot exceed 500 characters'],
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Severity must be one of: low, medium, high, critical',
      },
      default: 'low',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10 && tags.every(tag => tag.length <= 50);
        },
        message: 'Cannot have more than 10 tags, each tag max 50 characters',
      },
    },
    isVisible: {
      type: Boolean,
      default: true,
      required: [true, 'Visibility flag is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.logId = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ severity: 1 });
activityLogSchema.index({ tags: 1 });
activityLogSchema.index({ isVisible: 1 });
activityLogSchema.index({ projectId: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ projectId: 1, userId: 1, createdAt: -1 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function (activityData: {
  projectId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: string | mongoose.Types.ObjectId;
  description: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}) {
  const log = new this({
    projectId: new mongoose.Types.ObjectId(activityData.projectId.toString()),
    userId: new mongoose.Types.ObjectId(activityData.userId.toString()),
    action: activityData.action,
    entityType: activityData.entityType,
    entityId: activityData.entityId
      ? new mongoose.Types.ObjectId(activityData.entityId.toString())
      : undefined,
    details: {
      description: activityData.description,
      changes: activityData.changes,
      metadata: activityData.metadata,
    },
    ipAddress: activityData.ipAddress,
    userAgent: activityData.userAgent,
    severity: activityData.severity || 'low',
    tags: activityData.tags || [],
  });

  return log.save();
};

// Static method to get project activity feed
activityLogSchema.statics.getProjectFeed = async function (
  projectId: string | mongoose.Types.ObjectId,
  options: {
    page?: number;
    limit?: number;
    actions?: string[];
    severity?: string[];
    userId?: string | mongoose.Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const {
    page = 1,
    limit = 50,
    actions,
    severity,
    userId,
    startDate,
    endDate,
  } = options;

  const query: {
    projectId: mongoose.Types.ObjectId;
    isVisible: boolean;
    action?: { $in: string[] };
    severity?: { $in: string[] };
    userId?: mongoose.Types.ObjectId;
    createdAt?: {
      $gte?: Date;
      $lte?: Date;
    };
  } = {
    projectId: new mongoose.Types.ObjectId(projectId.toString()),
    isVisible: true,
  };

  if (actions && actions.length > 0) {
    query.action = { $in: actions };
  }

  if (severity && severity.length > 0) {
    query.severity = { $in: severity };
  }

  if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId.toString());
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, totalLogs] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
    this.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalLogs / limit);

  return {
    logs,
    pagination: {
      currentPage: page,
      totalPages,
      totalLogs,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Static method to get activity analytics
activityLogSchema.statics.getAnalytics = async function (
  projectId: string | mongoose.Types.ObjectId,
  period: 'day' | 'week' | 'month' = 'week'
) {
  const projectObjectId = new mongoose.Types.ObjectId(projectId.toString());

  let startDate: Date;
  switch (period) {
    case 'day':
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  const [actionBreakdown, severityBreakdown, totalActivity, activeUsers] =
    await Promise.all([
      this.aggregate([
        {
          $match: {
            projectId: projectObjectId,
            createdAt: { $gte: startDate },
            isVisible: true,
          },
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
      this.aggregate([
        {
          $match: {
            projectId: projectObjectId,
            createdAt: { $gte: startDate },
            isVisible: true,
          },
        },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
          },
        },
      ]),
      this.countDocuments({
        projectId: projectObjectId,
        createdAt: { $gte: startDate },
        isVisible: true,
      }),
      this.distinct('userId', {
        projectId: projectObjectId,
        createdAt: { $gte: startDate },
        isVisible: true,
      }),
    ]);

  return {
    period,
    totalActivity,
    activeUsers: activeUsers.length,
    actionBreakdown,
    severityBreakdown,
  };
};

export const ActivityLog = mongoose.model<IActivityLog, IActivityLogModel>(
  'ActivityLog',
  activityLogSchema
);
