import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [3, 'Project name must be at least 3 characters long'],
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    minlength: [10, 'Project description must be at least 10 characters long'],
    maxlength: [1000, 'Project description cannot exceed 1000 characters']
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  status: {
    type: String,
    enum: {
      values: ['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'],
      message: 'Status must be one of: planning, in-progress, completed, on-hold, cancelled'
    },
    default: 'planning'
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(_doc, ret) {
      ret.projectId = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Indexes
projectSchema.index({ ownerId: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ ownerId: 1, status: 1 });

// Compound index for efficient querying
projectSchema.index({ ownerId: 1, createdAt: -1 });

export const Project = mongoose.model<IProject>('Project', projectSchema); 