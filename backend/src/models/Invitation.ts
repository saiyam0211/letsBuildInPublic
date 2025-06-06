import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

export interface IInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  token: string;
  message?: string;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: mongoose.Types.ObjectId;
  remindersSent: number;
  lastReminderAt?: Date;
  metadata: {
    inviteSource: 'email' | 'link' | 'bulk';
    browserInfo?: string;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isExpired(): boolean;
  accept(userId: mongoose.Types.ObjectId): Promise<boolean>;
  decline(): Promise<boolean>;
  cancel(): Promise<IInvitation>;
  sendReminder(): Promise<IInvitation>;
  extendExpiry(days?: number): Promise<IInvitation>;
}

export interface IInvitationModel extends Model<IInvitation> {
  generateToken(): string;
  findByToken(token: string): Promise<IInvitation | null>;
}

const invitationSchema = new Schema<IInvitation>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviter ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Invalid email format',
      },
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['admin', 'editor', 'viewer'],
        message: 'Role must be one of: admin, editor, viewer',
      },
      default: 'viewer',
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'accepted', 'declined', 'expired', 'cancelled'],
        message:
          'Status must be one of: pending, accepted, declined, expired, cancelled',
      },
      default: 'pending',
    },
    token: {
      type: String,
      unique: true,
      default: function () {
        return crypto.randomBytes(32).toString('hex');
      },
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Invitation message cannot exceed 500 characters'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      default: function () {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      },
    },
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remindersSent: {
      type: Number,
      default: 0,
      min: [0, 'Reminders sent cannot be negative'],
      max: [3, 'Cannot send more than 3 reminders'],
    },
    lastReminderAt: {
      type: Date,
    },
    metadata: {
      inviteSource: {
        type: String,
        enum: ['email', 'link', 'bulk'],
        default: 'email',
      },
      browserInfo: {
        type: String,
        trim: true,
        maxlength: [200, 'Browser info cannot exceed 200 characters'],
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
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.invitationId = ret._id;
        delete ret._id;
        delete ret.token; // Don't expose token in JSON responses
        return ret;
      },
    },
  }
);

// Indexes
invitationSchema.index({ email: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ expiresAt: 1 });
invitationSchema.index({ projectId: 1, email: 1 });
invitationSchema.index({ projectId: 1, status: 1 });

// Pre-save middleware to generate token
invitationSchema.pre('save', function (next) {
  if (this.isNew && !this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Virtual to check if invitation can be reminded
invitationSchema.virtual('canSendReminder').get(function () {
  if (this.status !== 'pending' || this.isExpired()) return false;
  if (this.remindersSent >= 3) return false;

  // Can send reminder if no reminder sent yet, or last reminder was more than 2 days ago
  if (!this.lastReminderAt) return true;
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  return this.lastReminderAt < twoDaysAgo;
});

// Static method to generate unique token
invitationSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to find valid invitation by token
invitationSchema.statics.findByToken = async function (token: string) {
  try {
    const invitation = await this.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });
    return invitation;
  } catch (error) {
    console.error('Error finding invitation by token:', error);
    return null;
  }
};

// Instance method to accept invitation
invitationSchema.methods.accept = async function (
  userId: mongoose.Types.ObjectId
) {
  if (this.status !== 'pending' || this.isExpired()) return false;

  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  await this.save();
  return true;
};

// Instance method to decline invitation
invitationSchema.methods.decline = async function () {
  if (this.status !== 'pending') return false;

  this.status = 'declined';
  await this.save();
  return true;
};

// Instance method to cancel invitation
invitationSchema.methods.cancel = async function () {
  if (this.status !== 'pending') {
    throw new Error('Only pending invitations can be cancelled');
  }

  this.status = 'cancelled';
  return this.save();
};

// Instance method to send reminder
invitationSchema.methods.sendReminder = async function () {
  if (!this.canSendReminder) {
    throw new Error('Cannot send reminder for this invitation');
  }

  this.remindersSent += 1;
  this.lastReminderAt = new Date();

  return this.save();
};

// Instance method to extend expiry
invitationSchema.methods.extendExpiry = function (days: number = 7) {
  const newExpiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  this.expiresAt = newExpiryDate;
  return this.save();
};

// Add instance method to check if expired
invitationSchema.methods.isExpired = function (): boolean {
  return this.expiresAt < new Date();
};

export const Invitation = mongoose.model<IInvitation, IInvitationModel>(
  'Invitation',
  invitationSchema
);
