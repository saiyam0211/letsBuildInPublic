import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  effortEstimate: number; // in hours
  assigneeId?: mongoose.Types.ObjectId;
  featureId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [5, 'Task title must be at least 5 characters long'],
      maxlength: [150, 'Task title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      minlength: [10, 'Task description must be at least 10 characters long'],
      maxlength: [1000, 'Task description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      required: [true, 'Task status is required'],
      enum: {
        values: ['todo', 'in-progress', 'review', 'done', 'blocked'],
        message:
          'Status must be one of: todo, in-progress, review, done, blocked',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      required: [true, 'Task priority is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Priority must be one of: low, medium, high, critical',
      },
      default: 'medium',
    },
    effortEstimate: {
      type: Number,
      required: [true, 'Effort estimate is required'],
      min: [0.5, 'Effort estimate must be at least 0.5 hours'],
      max: [200, 'Effort estimate cannot exceed 200 hours'],
      validate: {
        validator: function (value: number) {
          return value % 0.5 === 0; // Must be in 0.5 hour increments
        },
        message: 'Effort estimate must be in 0.5 hour increments',
      },
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    featureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feature',
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.taskId = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ assigneeId: 1 });
taskSchema.index({ featureId: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, assigneeId: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });
// Compound index for complex queries
taskSchema.index({ projectId: 1, status: 1, priority: 1 });
taskSchema.index({ createdAt: -1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
