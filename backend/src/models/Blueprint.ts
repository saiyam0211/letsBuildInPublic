import mongoose, { Schema, Document } from 'mongoose';

interface IBlueprintMetadata {
  version: string;
  generatedAt: Date;
  aiConfidenceScore: number;
  estimatedTimeline: string;
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
}

interface IBlueprintSummary {
  projectName: string;
  description: string;
  targetMarket: string;
  keyFeatures: string[];
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    hosting: string;
  };
  mvpFeatures: number;
  totalTasks: number;
}

export interface IBlueprint extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'draft' | 'generating' | 'completed' | 'failed' | 'archived';
  type: 'full' | 'mvp' | 'technical' | 'business' | 'custom';
  metadata: IBlueprintMetadata;
  summary: IBlueprintSummary;
  components: {
    ideaValidation: boolean;
    techStackRecommendation: boolean;
    featureList: boolean;
    taskBreakdown: boolean;
    systemDiagrams: boolean;
    projectBoard: boolean;
  };
  exportFormats: {
    pdf: boolean;
    markdown: boolean;
    json: boolean;
    excel: boolean;
  };
  shareSettings: {
    isPublic: boolean;
    shareLink?: string;
    allowComments: boolean;
    passwordProtected: boolean;
  };
  tags: string[];
  downloadCount: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blueprintMetadataSchema = new Schema<IBlueprintMetadata>(
  {
    version: {
      type: String,
      required: [true, 'Blueprint version is required'],
      default: '1.0.0',
      validate: {
        validator: function (version: string) {
          return /^\d+\.\d+\.\d+$/.test(version);
        },
        message: 'Version must follow semantic versioning (e.g., 1.0.0)',
      },
    },
    generatedAt: {
      type: Date,
      required: [true, 'Generation date is required'],
      default: Date.now,
    },
    aiConfidenceScore: {
      type: Number,
      required: [true, 'AI confidence score is required'],
      min: [0, 'Confidence score cannot be negative'],
      max: [100, 'Confidence score cannot exceed 100'],
    },
    estimatedTimeline: {
      type: String,
      required: [true, 'Estimated timeline is required'],
      trim: true,
      enum: {
        values: [
          '1-2 weeks',
          '3-4 weeks',
          '1-2 months',
          '3-6 months',
          '6-12 months',
          '12+ months',
        ],
        message: 'Invalid timeline estimate',
      },
    },
    estimatedBudget: {
      min: {
        type: Number,
        required: [true, 'Minimum budget estimate is required'],
        min: [0, 'Budget cannot be negative'],
      },
      max: {
        type: Number,
        required: [true, 'Maximum budget estimate is required'],
        min: [0, 'Budget cannot be negative'],
      },
      currency: {
        type: String,
        required: [true, 'Currency is required'],
        default: 'USD',
        enum: {
          values: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'],
          message: 'Invalid currency',
        },
      },
    },
  },
  { _id: false }
);

const blueprintSummarySchema = new Schema<IBlueprintSummary>(
  {
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    targetMarket: {
      type: String,
      required: [true, 'Target market is required'],
      trim: true,
      maxlength: [200, 'Target market cannot exceed 200 characters'],
    },
    keyFeatures: {
      type: [String],
      required: [true, 'Key features are required'],
      validate: {
        validator: function (features: string[]) {
          return features.length >= 3 && features.length <= 10;
        },
        message: 'Must have between 3 and 10 key features',
      },
    },
    techStack: {
      frontend: {
        type: String,
        required: [true, 'Frontend technology is required'],
        trim: true,
      },
      backend: {
        type: String,
        required: [true, 'Backend technology is required'],
        trim: true,
      },
      database: {
        type: String,
        required: [true, 'Database technology is required'],
        trim: true,
      },
      hosting: {
        type: String,
        required: [true, 'Hosting platform is required'],
        trim: true,
      },
    },
    mvpFeatures: {
      type: Number,
      required: [true, 'MVP features count is required'],
      min: [1, 'Must have at least 1 MVP feature'],
    },
    totalTasks: {
      type: Number,
      required: [true, 'Total tasks count is required'],
      min: [1, 'Must have at least 1 task'],
    },
  },
  { _id: false }
);

const blueprintSchema = new Schema<IBlueprint>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Blueprint name is required'],
      trim: true,
      minlength: [3, 'Blueprint name must be at least 3 characters long'],
      maxlength: [100, 'Blueprint name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Blueprint description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      required: [true, 'Blueprint status is required'],
      enum: {
        values: ['draft', 'generating', 'completed', 'failed', 'archived'],
        message: 'Invalid blueprint status',
      },
      default: 'draft',
    },
    type: {
      type: String,
      required: [true, 'Blueprint type is required'],
      enum: {
        values: ['full', 'mvp', 'technical', 'business', 'custom'],
        message: 'Invalid blueprint type',
      },
      default: 'full',
    },
    metadata: {
      type: blueprintMetadataSchema,
      required: [true, 'Blueprint metadata is required'],
    },
    summary: {
      type: blueprintSummarySchema,
      required: [true, 'Blueprint summary is required'],
    },
    components: {
      ideaValidation: { type: Boolean, default: false },
      techStackRecommendation: { type: Boolean, default: false },
      featureList: { type: Boolean, default: false },
      taskBreakdown: { type: Boolean, default: false },
      systemDiagrams: { type: Boolean, default: false },
      projectBoard: { type: Boolean, default: false },
    },
    exportFormats: {
      pdf: { type: Boolean, default: false },
      markdown: { type: Boolean, default: false },
      json: { type: Boolean, default: true },
      excel: { type: Boolean, default: false },
    },
    shareSettings: {
      isPublic: { type: Boolean, default: false },
      shareLink: { type: String, trim: true },
      allowComments: { type: Boolean, default: false },
      passwordProtected: { type: Boolean, default: false },
    },
    tags: {
      type: [String],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: [0, 'Download count cannot be negative'],
    },
    lastAccessedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.blueprintId = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
blueprintSchema.index({ projectId: 1 });
blueprintSchema.index({ status: 1 });
blueprintSchema.index({ type: 1 });
blueprintSchema.index({ 'shareSettings.isPublic': 1 });
blueprintSchema.index({ tags: 1 });
blueprintSchema.index({ downloadCount: -1 });
blueprintSchema.index({ createdAt: -1 });
blueprintSchema.index({ lastAccessedAt: -1 });

// Method to calculate completion percentage
blueprintSchema.methods.getCompletionPercentage = function (
  this: IBlueprint
): number {
  const components = this.components;
  const totalComponents = Object.keys(components).length;
  const completedComponents = Object.values(components).filter(Boolean).length;
  return Math.round((completedComponents / totalComponents) * 100);
};

// Method to generate share link
blueprintSchema.methods.generateShareLink = function (
  this: IBlueprint
): string {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const shareId = new mongoose.Types.ObjectId().toString();
  this.shareSettings.shareLink = `${baseUrl}/blueprint/share/${shareId}`;
  return this.shareSettings.shareLink;
};

// Method to check if user can access blueprint
blueprintSchema.methods.canAccess = function (
  this: IBlueprint,
  userId?: string
): boolean {
  // If blueprint is public, anyone can access
  if (this.shareSettings.isPublic) {
    return true;
  }

  // If userId is provided, check if it's the project owner
  if (userId) {
    // This would need to be implemented with actual user validation
    return true; // Simplified for now
  }

  return false;
};

// Pre-save middleware to update lastAccessedAt
blueprintSchema.pre('save', function (this: IBlueprint) {
  if (this.isModified() && !this.isModified('lastAccessedAt')) {
    this.lastAccessedAt = new Date();
  }
});

export const Blueprint = mongoose.model<IBlueprint>(
  'Blueprint',
  blueprintSchema
);
