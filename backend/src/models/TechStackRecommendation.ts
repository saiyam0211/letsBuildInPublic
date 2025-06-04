import mongoose, { Schema, Document } from 'mongoose';

interface ITechOption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cost: 'free' | 'low' | 'medium' | 'high';
  popularity: number; // 1-100 score
}

interface IRationale {
  reasoning: string;
  factors: string[];
  alternatives: string[];
}

export interface ITechStackRecommendation extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  frontend: ITechOption[];
  backend: ITechOption[];
  database: ITechOption[];
  infrastructure: ITechOption[];
  thirdPartyServices: ITechOption[];
  rationale: IRationale;
  alternativeOptions: ITechOption[];
  createdAt: Date;
  updatedAt: Date;
}

const techOptionSchema = new Schema<ITechOption>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Technology name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [300, 'Technology description cannot exceed 300 characters'],
    },
    pros: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Pro cannot exceed 100 characters'],
      },
    ],
    cons: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Con cannot exceed 100 characters'],
      },
    ],
    difficulty: {
      type: String,
      required: true,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Difficulty must be one of: beginner, intermediate, advanced',
      },
    },
    cost: {
      type: String,
      required: true,
      enum: {
        values: ['free', 'low', 'medium', 'high'],
        message: 'Cost must be one of: free, low, medium, high',
      },
    },
    popularity: {
      type: Number,
      required: true,
      min: [1, 'Popularity must be at least 1'],
      max: [100, 'Popularity cannot exceed 100'],
    },
  },
  { _id: false }
);

const rationaleSchema = new Schema<IRationale>(
  {
    reasoning: {
      type: String,
      required: true,
      trim: true,
      minlength: [50, 'Reasoning must be at least 50 characters long'],
      maxlength: [1000, 'Reasoning cannot exceed 1000 characters'],
    },
    factors: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Factor cannot exceed 100 characters'],
      },
    ],
    alternatives: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Alternative cannot exceed 100 characters'],
      },
    ],
  },
  { _id: false }
);

const techStackRecommendationSchema = new Schema<ITechStackRecommendation>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      unique: true, // One tech stack recommendation per project
    },
    frontend: {
      type: [techOptionSchema],
      default: [],
      validate: {
        validator: function (options: ITechOption[]) {
          return options.length <= 5;
        },
        message: 'Cannot have more than 5 frontend options',
      },
    },
    backend: {
      type: [techOptionSchema],
      default: [],
      validate: {
        validator: function (options: ITechOption[]) {
          return options.length <= 5;
        },
        message: 'Cannot have more than 5 backend options',
      },
    },
    database: {
      type: [techOptionSchema],
      default: [],
      validate: {
        validator: function (options: ITechOption[]) {
          return options.length <= 3;
        },
        message: 'Cannot have more than 3 database options',
      },
    },
    infrastructure: {
      type: [techOptionSchema],
      default: [],
      validate: {
        validator: function (options: ITechOption[]) {
          return options.length <= 5;
        },
        message: 'Cannot have more than 5 infrastructure options',
      },
    },
    thirdPartyServices: {
      type: [techOptionSchema],
      default: [],
      validate: {
        validator: function (options: ITechOption[]) {
          return options.length <= 10;
        },
        message: 'Cannot have more than 10 third-party service options',
      },
    },
    rationale: {
      type: rationaleSchema,
      required: [true, 'Rationale is required'],
    },
    alternativeOptions: {
      type: [techOptionSchema],
      default: [],
      validate: {
        validator: function (options: ITechOption[]) {
          return options.length <= 5;
        },
        message: 'Cannot have more than 5 alternative options',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.recommendationId = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
techStackRecommendationSchema.index({ createdAt: -1 });

export const TechStackRecommendation = mongoose.model<ITechStackRecommendation>(
  'TechStackRecommendation',
  techStackRecommendationSchema
);
