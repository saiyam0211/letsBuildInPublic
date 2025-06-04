import mongoose, { Schema, Document } from 'mongoose';

interface IColumn {
  id: string;
  name: string;
  position: number;
  taskLimit?: number;
  color?: string;
}

interface IBoardSettings {
  allowTaskCreation: boolean;
  allowColumnReorder: boolean;
  autoArchiveCompleted: boolean;
  notificationsEnabled: boolean;
}

export interface IProjectBoard extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  columns: IColumn[];
  settings: IBoardSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const columnSchema = new Schema<IColumn>(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Column name is required'],
      trim: true,
      minlength: [1, 'Column name must be at least 1 character long'],
      maxlength: [50, 'Column name cannot exceed 50 characters'],
    },
    position: {
      type: Number,
      required: [true, 'Column position is required'],
      min: [0, 'Column position cannot be negative'],
    },
    taskLimit: {
      type: Number,
      min: [1, 'Task limit must be at least 1'],
      max: [100, 'Task limit cannot exceed 100'],
    },
    color: {
      type: String,
      trim: true,
      validate: {
        validator: function (color: string) {
          return !color || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
        },
        message: 'Color must be a valid hex color code',
      },
    },
  },
  { _id: false }
);

const boardSettingsSchema = new Schema<IBoardSettings>(
  {
    allowTaskCreation: {
      type: Boolean,
      default: true,
    },
    allowColumnReorder: {
      type: Boolean,
      default: true,
    },
    autoArchiveCompleted: {
      type: Boolean,
      default: false,
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const projectBoardSchema = new Schema<IProjectBoard>(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
      minlength: [3, 'Board name must be at least 3 characters long'],
      maxlength: [100, 'Board name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Board description cannot exceed 500 characters'],
    },
    columns: {
      type: [columnSchema],
      default: [
        { id: 'todo', name: 'To Do', position: 0 },
        { id: 'in-progress', name: 'In Progress', position: 1 },
        { id: 'review', name: 'Review', position: 2 },
        { id: 'done', name: 'Done', position: 3 },
      ],
      validate: {
        validator: function (columns: IColumn[]) {
          return columns.length >= 2 && columns.length <= 10;
        },
        message: 'Board must have between 2 and 10 columns',
      },
    },
    settings: {
      type: boardSettingsSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        ret.boardId = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
projectBoardSchema.index({ projectId: 1 });
projectBoardSchema.index({ isActive: 1 });
projectBoardSchema.index({ projectId: 1, isActive: 1 });
projectBoardSchema.index({ createdAt: -1 });

// Validation for unique column positions
projectBoardSchema.pre('validate', function (this: IProjectBoard) {
  if (this.columns && this.columns.length > 0) {
    const positions = this.columns.map(col => col.position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      throw new Error('Column positions must be unique');
    }
  }
});

// Method to reorder columns
projectBoardSchema.methods.reorderColumns = function (
  this: IProjectBoard,
  newOrder: string[]
) {
  const reorderedColumns = newOrder.map((columnId, index) => {
    const column = this.columns.find(col => col.id === columnId);
    if (!column) {
      throw new Error(`Column with id ${columnId} not found`);
    }
    return { ...column, position: index };
  });
  this.columns = reorderedColumns;
  return this;
};

export const ProjectBoard = mongoose.model<IProjectBoard>(
  'ProjectBoard',
  projectBoardSchema
);
