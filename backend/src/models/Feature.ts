import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: number; // 1-10 scale
  category: 'mvp' | 'growth' | 'future' | 'nice-to-have';
  userPersona: string;
  createdAt: Date;
  updatedAt: Date;
}

const featureSchema = new Schema<IFeature>({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  name: {
    type: String,
    required: [true, 'Feature name is required'],
    trim: true,
    minlength: [3, 'Feature name must be at least 3 characters long'],
    maxlength: [100, 'Feature name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Feature description is required'],
    trim: true,
    minlength: [10, 'Feature description must be at least 10 characters long'],
    maxlength: [1000, 'Feature description cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    required: [true, 'Feature priority is required'],
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Priority must be one of: low, medium, high, critical'
    }
  },
  complexity: {
    type: Number,
    required: [true, 'Feature complexity is required'],
    min: [1, 'Complexity must be at least 1'],
    max: [10, 'Complexity cannot exceed 10'],
    validate: {
      validator: function(value: number) {
        return Number.isInteger(value);
      },
      message: 'Complexity must be an integer'
    }
  },
  category: {
    type: String,
    required: [true, 'Feature category is required'],
    enum: {
      values: ['mvp', 'growth', 'future', 'nice-to-have'],
      message: 'Category must be one of: mvp, growth, future, nice-to-have'
    }
  },
  userPersona: {
    type: String,
    required: [true, 'User persona is required'],
    trim: true,
    minlength: [5, 'User persona must be at least 5 characters long'],
    maxlength: [100, 'User persona cannot exceed 100 characters']
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(_doc, ret) {
      ret.featureId = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Indexes
featureSchema.index({ projectId: 1 });
featureSchema.index({ priority: 1 });
featureSchema.index({ category: 1 });
featureSchema.index({ complexity: 1 });
featureSchema.index({ projectId: 1, category: 1 });
featureSchema.index({ projectId: 1, priority: 1 });
featureSchema.index({ createdAt: -1 });

// Compound index for efficient querying
featureSchema.index({ projectId: 1, category: 1, priority: 1 });

export const Feature = mongoose.model<IFeature>('Feature', featureSchema); 