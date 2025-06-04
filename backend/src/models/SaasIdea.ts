import mongoose, { Schema, Document } from 'mongoose';

export interface ISaasIdea extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  description: string;
  targetAudience: string;
  problemStatement: string;
  desiredFeatures: string[];
  technicalPreferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

const saasIdeaSchema = new Schema<ISaasIdea>({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    unique: true // One idea per project
  },
  description: {
    type: String,
    required: [true, 'Idea description is required'],
    trim: true,
    minlength: [50, 'Idea description must be at least 50 characters long'],
    maxlength: [2000, 'Idea description cannot exceed 2000 characters']
  },
  targetAudience: {
    type: String,
    required: [true, 'Target audience is required'],
    trim: true,
    minlength: [10, 'Target audience must be at least 10 characters long'],
    maxlength: [500, 'Target audience cannot exceed 500 characters']
  },
  problemStatement: {
    type: String,
    required: [true, 'Problem statement is required'],
    trim: true,
    minlength: [20, 'Problem statement must be at least 20 characters long'],
    maxlength: [1000, 'Problem statement cannot exceed 1000 characters']
  },
  desiredFeatures: [{
    type: String,
    trim: true,
    minlength: [5, 'Feature description must be at least 5 characters long'],
    maxlength: [200, 'Feature description cannot exceed 200 characters']
  }],
  technicalPreferences: [{
    type: String,
    trim: true,
    minlength: [2, 'Technical preference must be at least 2 characters long'],
    maxlength: [50, 'Technical preference cannot exceed 50 characters']
  }]
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(_doc, ret) {
      ret.ideaId = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Indexes
saasIdeaSchema.index({ createdAt: -1 });

// Validation for arrays
saasIdeaSchema.pre('validate', function(this: ISaasIdea) {
  if (this.desiredFeatures && this.desiredFeatures.length > 20) {
    throw new Error('Cannot have more than 20 desired features');
  }
  if (this.technicalPreferences && this.technicalPreferences.length > 15) {
    throw new Error('Cannot have more than 15 technical preferences');
  }
});

export const SaasIdea = mongoose.model<ISaasIdea>('SaasIdea', saasIdeaSchema); 