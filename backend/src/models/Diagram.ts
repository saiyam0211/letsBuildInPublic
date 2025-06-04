import mongoose, { Schema, Document } from 'mongoose';

interface IDiagramMetadata {
  version: string;
  theme?: string;
  direction?: string;
  nodeCount?: number;
  edgeCount?: number;
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface IDiagram extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  type:
    | 'user-flow'
    | 'system-architecture'
    | 'database-schema'
    | 'api-endpoints'
    | 'sequence'
    | 'class'
    | 'custom';
  content: string; // Mermaid diagram content
  metadata: IDiagramMetadata;
  format: 'mermaid' | 'svg' | 'png' | 'json';
  createdAt: Date;
  updatedAt: Date;
}

const diagramMetadataSchema = new Schema<IDiagramMetadata>(
  {
    version: {
      type: String,
      required: true,
      default: '1.0.0',
      validate: {
        validator: function (version: string) {
          return /^\d+\.\d+\.\d+$/.test(version);
        },
        message: 'Version must be in semantic versioning format (x.y.z)',
      },
    },
    theme: {
      type: String,
      enum: ['default', 'dark', 'forest', 'neutral', 'base'],
      default: 'default',
    },
    direction: {
      type: String,
      enum: ['TB', 'TD', 'BT', 'RL', 'LR'],
      default: 'TB',
    },
    nodeCount: {
      type: Number,
      min: [0, 'Node count cannot be negative'],
      max: [500, 'Node count cannot exceed 500'],
    },
    edgeCount: {
      type: Number,
      min: [0, 'Edge count cannot be negative'],
      max: [1000, 'Edge count cannot exceed 1000'],
    },
    complexity: {
      type: String,
      enum: ['simple', 'medium', 'complex'],
      default: 'simple',
    },
  },
  { _id: false }
);

const diagramSchema = new Schema<IDiagram>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    type: {
      type: String,
      required: [true, 'Diagram type is required'],
      enum: {
        values: [
          'user-flow',
          'system-architecture',
          'database-schema',
          'api-endpoints',
          'sequence',
          'class',
          'custom',
        ],
        message:
          'Type must be one of: user-flow, system-architecture, database-schema, api-endpoints, sequence, class, custom',
      },
    },
    content: {
      type: String,
      required: [true, 'Diagram content is required'],
      minlength: [10, 'Diagram content must be at least 10 characters long'],
      maxlength: [50000, 'Diagram content cannot exceed 50,000 characters'],
    },
    metadata: {
      type: diagramMetadataSchema,
      required: [true, 'Diagram metadata is required'],
    },
    format: {
      type: String,
      required: [true, 'Diagram format is required'],
      enum: {
        values: ['mermaid', 'svg', 'png', 'json'],
        message: 'Format must be one of: mermaid, svg, png, json',
      },
      default: 'mermaid',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.diagramId = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
diagramSchema.index({ projectId: 1 });
diagramSchema.index({ type: 1 });
diagramSchema.index({ format: 1 });
diagramSchema.index({ projectId: 1, type: 1 });
diagramSchema.index({ createdAt: -1 });

// Compound index for efficient querying
diagramSchema.index({ projectId: 1, type: 1, 'metadata.version': -1 });

// Pre-save middleware to auto-calculate complexity
diagramSchema.pre('save', function (this: IDiagram) {
  if (this.metadata.nodeCount && this.metadata.edgeCount) {
    const totalElements = this.metadata.nodeCount + this.metadata.edgeCount;
    if (totalElements <= 10) {
      this.metadata.complexity = 'simple';
    } else if (totalElements <= 50) {
      this.metadata.complexity = 'medium';
    } else {
      this.metadata.complexity = 'complex';
    }
  }
});

export const Diagram = mongoose.model<IDiagram>('Diagram', diagramSchema);
