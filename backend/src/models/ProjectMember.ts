import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectMember extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManageMembers: boolean;
    canExport: boolean;
    canViewAnalytics: boolean;
  };
  status: 'active' | 'pending' | 'suspended';
  joinedAt: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  hasPermission(permission: keyof IProjectMember['permissions']): boolean;
  updateLastActive(): Promise<IProjectMember>;
}

export interface IProjectMemberModel extends Model<IProjectMember> {
  hasPermission(
    projectId: string,
    userId: string,
    permission: keyof IProjectMember['permissions']
  ): Promise<boolean>;
}

const projectMemberSchema = new Schema<IProjectMember>(
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
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['owner', 'admin', 'editor', 'viewer'],
        message: 'Role must be one of: owner, admin, editor, viewer',
      },
      default: 'viewer',
    },
    permissions: {
      canEdit: {
        type: Boolean,
        default: function () {
          return ['owner', 'admin', 'editor'].includes(this.role);
        },
      },
      canDelete: {
        type: Boolean,
        default: function () {
          return ['owner', 'admin'].includes(this.role);
        },
      },
      canInvite: {
        type: Boolean,
        default: function () {
          return ['owner', 'admin'].includes(this.role);
        },
      },
      canManageMembers: {
        type: Boolean,
        default: function () {
          return ['owner', 'admin'].includes(this.role);
        },
      },
      canExport: {
        type: Boolean,
        default: function () {
          return ['owner', 'admin', 'editor'].includes(this.role);
        },
      },
      canViewAnalytics: {
        type: Boolean,
        default: function () {
          return ['owner', 'admin'].includes(this.role);
        },
      },
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['active', 'pending', 'suspended'],
        message: 'Status must be one of: active, pending, suspended',
      },
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.memberId = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
projectMemberSchema.index({ userId: 1 });
projectMemberSchema.index({ projectId: 1, role: 1 });
projectMemberSchema.index({ projectId: 1, status: 1 });

// Pre-save middleware to set permissions based on role
projectMemberSchema.pre('save', function (next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'owner':
        this.permissions = {
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true,
          canExport: true,
          canViewAnalytics: true,
        };
        break;
      case 'admin':
        this.permissions = {
          canEdit: true,
          canDelete: true,
          canInvite: true,
          canManageMembers: true,
          canExport: true,
          canViewAnalytics: true,
        };
        break;
      case 'editor':
        this.permissions = {
          canEdit: true,
          canDelete: false,
          canInvite: false,
          canManageMembers: false,
          canExport: true,
          canViewAnalytics: false,
        };
        break;
      case 'viewer':
        this.permissions = {
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageMembers: false,
          canExport: false,
          canViewAnalytics: false,
        };
        break;
    }
  }
  next();
});

// Static method to check if user has permission
projectMemberSchema.statics.hasPermission = async function (
  projectId: string,
  userId: string,
  permission: keyof IProjectMember['permissions']
): Promise<boolean> {
  try {
    const member = await this.findOne({
      projectId: new mongoose.Types.ObjectId(projectId),
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active',
    });

    if (!member) return false;

    // Owner has all permissions
    if (member.role === 'owner') return true;

    // Check specific permission
    return member.permissions[permission];
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Add instance method to check if expired
projectMemberSchema.methods.hasPermission = function (
  permission: keyof IProjectMember['permissions']
): boolean {
  if (this.role === 'owner') return true;
  return this.permissions[permission];
};

// Instance method to update last active timestamp
projectMemberSchema.methods.updateLastActive = function () {
  this.lastActiveAt = new Date();
  return this.save();
};

export const ProjectMember = mongoose.model<
  IProjectMember,
  IProjectMemberModel
>('ProjectMember', projectMemberSchema);
