import mongoose, { Schema, Document } from 'mongoose';

interface ISimilarProduct {
  name: string;
  description: string;
  url?: string;
  similarityScore: number;
}

interface IRisk {
  type: 'market' | 'technical' | 'financial' | 'competitive';
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigation?: string;
}

export interface IIdeaValidation extends Document {
  _id: mongoose.Types.ObjectId;
  ideaId: mongoose.Types.ObjectId;
  marketPotential: number; // 0-100 score
  similarProducts: ISimilarProduct[];
  differentiationOpportunities: string[];
  risks: IRisk[];
  confidenceScore: number; // 0-100 AI confidence
  improvementSuggestions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const similarProductSchema = new Schema<ISimilarProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Product description cannot exceed 500 characters'],
    },
    url: {
      type: String,
      trim: true,
      validate: {
        validator: function (url: string) {
          return !url || /^https?:\/\/.+/.test(url);
        },
        message: 'Please provide a valid URL',
      },
    },
    similarityScore: {
      type: Number,
      required: true,
      min: [0, 'Similarity score cannot be negative'],
      max: [100, 'Similarity score cannot exceed 100'],
    },
  },
  { _id: false }
);

const riskSchema = new Schema<IRisk>(
  {
    type: {
      type: String,
      required: true,
      enum: {
        values: ['market', 'technical', 'financial', 'competitive'],
        message:
          'Risk type must be one of: market, technical, financial, competitive',
      },
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, 'Risk description must be at least 10 characters long'],
      maxlength: [500, 'Risk description cannot exceed 500 characters'],
    },
    severity: {
      type: String,
      required: true,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Risk severity must be one of: low, medium, high',
      },
    },
    mitigation: {
      type: String,
      trim: true,
      maxlength: [300, 'Risk mitigation cannot exceed 300 characters'],
    },
  },
  { _id: false }
);

const ideaValidationSchema = new Schema<IIdeaValidation>(
  {
    ideaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SaasIdea',
      required: [true, 'Idea ID is required'],
      unique: true, // One validation per idea
    },
    marketPotential: {
      type: Number,
      required: [true, 'Market potential score is required'],
      min: [0, 'Market potential cannot be negative'],
      max: [100, 'Market potential cannot exceed 100'],
    },
    similarProducts: {
      type: [similarProductSchema],
      default: [],
      validate: {
        validator: function (products: ISimilarProduct[]) {
          return products.length <= 10;
        },
        message: 'Cannot have more than 10 similar products',
      },
    },
    differentiationOpportunities: [
      {
        type: String,
        trim: true,
        minlength: [
          10,
          'Differentiation opportunity must be at least 10 characters long',
        ],
        maxlength: [
          300,
          'Differentiation opportunity cannot exceed 300 characters',
        ],
      },
    ],
    risks: {
      type: [riskSchema],
      default: [],
      validate: {
        validator: function (risks: IRisk[]) {
          return risks.length <= 15;
        },
        message: 'Cannot have more than 15 risks',
      },
    },
    confidenceScore: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence score cannot be negative'],
      max: [100, 'Confidence score cannot exceed 100'],
    },
    improvementSuggestions: [
      {
        type: String,
        trim: true,
        minlength: [
          10,
          'Improvement suggestion must be at least 10 characters long',
        ],
        maxlength: [300, 'Improvement suggestion cannot exceed 300 characters'],
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.validationId = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
ideaValidationSchema.index({ marketPotential: -1 });
ideaValidationSchema.index({ confidenceScore: -1 });
ideaValidationSchema.index({ createdAt: -1 });

// Validation for arrays
ideaValidationSchema.pre('validate', function (this: IIdeaValidation) {
  if (
    this.differentiationOpportunities &&
    this.differentiationOpportunities.length > 10
  ) {
    throw new Error('Cannot have more than 10 differentiation opportunities');
  }
  if (this.improvementSuggestions && this.improvementSuggestions.length > 15) {
    throw new Error('Cannot have more than 15 improvement suggestions');
  }
});

export const IdeaValidation = mongoose.model<IIdeaValidation>(
  'IdeaValidation',
  ideaValidationSchema
);
