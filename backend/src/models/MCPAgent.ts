import mongoose, { Schema, Document } from 'mongoose';

interface IAgentCapability {
  name: string;
  description: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

interface IAgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  tools: string[];
  rateLimitPerMinute: number;
}

interface IExecutionLog {
  timestamp: Date;
  input: string;
  output: string;
  tokensUsed: number;
  executionTime: number;
  success: boolean;
  errorMessage?: string;
}

export interface IMCPAgent extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'idea-validator' | 'tech-recommender' | 'task-generator' | 'diagram-creator' | 'code-assistant' | 'custom';
  version: string;
  status: 'active' | 'inactive' | 'error' | 'training' | 'updating';
  capabilities: IAgentCapability[];
  config: IAgentConfig;
  executionLogs: IExecutionLog[];
  performance: {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    averageTokensUsed: number;
    lastExecutedAt?: Date;
  };
  usage: {
    tokensUsedToday: number;
    executionsToday: number;
    monthlyTokenLimit: number;
    monthlyExecutionLimit: number;
  };
  metadata: {
    createdBy: mongoose.Types.ObjectId;
    lastModifiedBy: mongoose.Types.ObjectId;
    tags: string[];
    isPublic: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const agentCapabilitySchema = new Schema<IAgentCapability>({
  name: {
    type: String,
    required: [true, 'Capability name is required'],
    trim: true,
    minlength: [2, 'Capability name must be at least 2 characters long'],
    maxlength: [50, 'Capability name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Capability description is required'],
    trim: true,
    maxlength: [200, 'Capability description cannot exceed 200 characters']
  },
  enabled: {
    type: Boolean,
    default: true
  },
  parameters: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const agentConfigSchema = new Schema<IAgentConfig>({
  model: {
    type: String,
    required: [true, 'AI model is required'],
    enum: {
      values: ['gpt-4o', 'gpt-4o-mini', 'claude-3-sonnet', 'claude-3-haiku', 'gemini-pro', 'llama-3-70b'],
      message: 'Invalid AI model'
    },
    default: 'gpt-4o-mini'
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature is required'],
    min: [0, 'Temperature cannot be negative'],
    max: [2, 'Temperature cannot exceed 2'],
    default: 0.7
  },
  maxTokens: {
    type: Number,
    required: [true, 'Max tokens is required'],
    min: [100, 'Max tokens must be at least 100'],
    max: [128000, 'Max tokens cannot exceed 128000'],
    default: 4000
  },
  systemPrompt: {
    type: String,
    trim: true,
    maxlength: [2000, 'System prompt cannot exceed 2000 characters']
  },
  tools: {
    type: [String],
    default: [],
    validate: {
      validator: function(tools: string[]) {
        return tools.length <= 20;
      },
      message: 'Cannot have more than 20 tools'
    }
  },
  rateLimitPerMinute: {
    type: Number,
    required: [true, 'Rate limit is required'],
    min: [1, 'Rate limit must be at least 1'],
    max: [1000, 'Rate limit cannot exceed 1000'],
    default: 60
  }
}, { _id: false });

const executionLogSchema = new Schema<IExecutionLog>({
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  input: {
    type: String,
    required: [true, 'Input is required'],
    trim: true,
    maxlength: [10000, 'Input cannot exceed 10000 characters']
  },
  output: {
    type: String,
    required: [true, 'Output is required'],
    trim: true,
    maxlength: [50000, 'Output cannot exceed 50000 characters']
  },
  tokensUsed: {
    type: Number,
    required: [true, 'Tokens used is required'],
    min: [0, 'Tokens used cannot be negative']
  },
  executionTime: {
    type: Number,
    required: [true, 'Execution time is required'],
    min: [0, 'Execution time cannot be negative']
  },
  success: {
    type: Boolean,
    required: [true, 'Success status is required']
  },
  errorMessage: {
    type: String,
    trim: true,
    maxlength: [1000, 'Error message cannot exceed 1000 characters']
  }
}, { _id: false });

const mcpAgentSchema = new Schema<IMCPAgent>({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  name: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true,
    minlength: [3, 'Agent name must be at least 3 characters long'],
    maxlength: [100, 'Agent name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Agent description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Agent type is required'],
    enum: {
      values: ['idea-validator', 'tech-recommender', 'task-generator', 'diagram-creator', 'code-assistant', 'custom'],
      message: 'Invalid agent type'
    }
  },
  version: {
    type: String,
    required: [true, 'Agent version is required'],
    default: '1.0.0',
    validate: {
      validator: function(version: string) {
        return /^\d+\.\d+\.\d+$/.test(version);
      },
      message: 'Version must follow semantic versioning (e.g., 1.0.0)'
    }
  },
  status: {
    type: String,
    required: [true, 'Agent status is required'],
    enum: {
      values: ['active', 'inactive', 'error', 'training', 'updating'],
      message: 'Invalid agent status'
    },
    default: 'active'
  },
  capabilities: {
    type: [agentCapabilitySchema],
    required: [true, 'Agent capabilities are required'],
    validate: {
      validator: function(capabilities: IAgentCapability[]) {
        return capabilities.length >= 1 && capabilities.length <= 10;
      },
      message: 'Agent must have between 1 and 10 capabilities'
    }
  },
  config: {
    type: agentConfigSchema,
    required: [true, 'Agent configuration is required']
  },
  executionLogs: {
    type: [executionLogSchema],
    default: [],
    validate: {
      validator: function(logs: IExecutionLog[]) {
        return logs.length <= 1000;
      },
      message: 'Cannot store more than 1000 execution logs'
    }
  },
  performance: {
    totalExecutions: { type: Number, default: 0, min: 0 },
    successRate: { type: Number, default: 100, min: 0, max: 100 },
    averageExecutionTime: { type: Number, default: 0, min: 0 },
    averageTokensUsed: { type: Number, default: 0, min: 0 },
    lastExecutedAt: { type: Date }
  },
  usage: {
    tokensUsedToday: { type: Number, default: 0, min: 0 },
    executionsToday: { type: Number, default: 0, min: 0 },
    monthlyTokenLimit: { type: Number, default: 100000, min: 1000 },
    monthlyExecutionLimit: { type: Number, default: 1000, min: 100 }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user ID is required']
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Last modified by user ID is required']
    },
    tags: {
      type: [String],
      validate: {
        validator: function(tags: string[]) {
          return tags.length <= 5;
        },
        message: 'Cannot have more than 5 tags'
      }
    },
    isPublic: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(_doc, ret) {
      ret.agentId = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Indexes
mcpAgentSchema.index({ projectId: 1 });
mcpAgentSchema.index({ type: 1 });
mcpAgentSchema.index({ status: 1 });
mcpAgentSchema.index({ 'metadata.isPublic': 1 });
mcpAgentSchema.index({ 'metadata.tags': 1 });
mcpAgentSchema.index({ createdAt: -1 });
mcpAgentSchema.index({ 'performance.lastExecutedAt': -1 });
mcpAgentSchema.index({ projectId: 1, type: 1 });

// Method to log execution
mcpAgentSchema.methods.logExecution = function(
  this: IMCPAgent, 
  input: string, 
  output: string, 
  tokensUsed: number, 
  executionTime: number, 
  success: boolean, 
  errorMessage?: string
) {
  const log: IExecutionLog = {
    timestamp: new Date(),
    input,
    output,
    tokensUsed,
    executionTime,
    success,
    ...(errorMessage && { errorMessage })
  };

  // Add to logs (keep only last 100 logs)
  this.executionLogs.push(log);
  if (this.executionLogs.length > 100) {
    this.executionLogs = this.executionLogs.slice(-100);
  }

  // Update performance metrics
  this.performance.totalExecutions += 1;
  this.performance.lastExecutedAt = new Date();
  
  // Calculate success rate
  const recentLogs = this.executionLogs.slice(-100);
  const successfulExecutions = recentLogs.filter(log => log.success).length;
  this.performance.successRate = Math.round((successfulExecutions / recentLogs.length) * 100);
  
  // Calculate averages
  this.performance.averageExecutionTime = Math.round(
    recentLogs.reduce((sum, log) => sum + log.executionTime, 0) / recentLogs.length
  );
  this.performance.averageTokensUsed = Math.round(
    recentLogs.reduce((sum, log) => sum + log.tokensUsed, 0) / recentLogs.length
  );

  // Update daily usage
  this.usage.tokensUsedToday += tokensUsed;
  this.usage.executionsToday += 1;

  return this;
};

// Method to check if agent can execute (rate limiting)
mcpAgentSchema.methods.canExecute = function(this: IMCPAgent): boolean {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check daily limits
  if (this.usage.executionsToday >= this.usage.monthlyExecutionLimit / 30) {
    return false;
  }
  
  if (this.usage.tokensUsedToday >= this.usage.monthlyTokenLimit / 30) {
    return false;
  }

  // Check rate limiting (simplified - would need more sophisticated implementation)
  const recentExecutions = this.executionLogs.filter(
    log => log.timestamp.getTime() > (now.getTime() - 60000) // Last minute
  );
  
  return recentExecutions.length < this.config.rateLimitPerMinute;
};

// Reset daily usage at midnight (would be handled by a cron job)
mcpAgentSchema.methods.resetDailyUsage = function(this: IMCPAgent) {
  this.usage.tokensUsedToday = 0;
  this.usage.executionsToday = 0;
  return this;
};

export const MCPAgent = mongoose.model<IMCPAgent>('MCPAgent', mcpAgentSchema); 