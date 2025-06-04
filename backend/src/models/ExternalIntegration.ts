import mongoose, { Schema, Document } from 'mongoose';

interface IAuthConfig {
  type: 'oauth2' | 'api_key' | 'basic_auth' | 'webhook' | 'none';
  credentials: Record<string, any>;
  scopes?: string[];
  expiresAt?: Date;
  refreshToken?: string;
}

interface ISyncConfig {
  enabled: boolean;
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'manual';
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  syncDirection: 'bidirectional' | 'import' | 'export';
  fieldsMapping: Record<string, string>;
}

interface IIntegrationLog {
  timestamp: Date;
  action: 'sync' | 'auth' | 'webhook' | 'api_call' | 'error';
  status: 'success' | 'failure' | 'warning';
  message: string;
  details?: Record<string, any>;
}

export interface IExternalIntegration extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  provider: 'github' | 'gitlab' | 'jira' | 'trello' | 'slack' | 'discord' | 'notion' | 'airtable' | 'figma' | 'custom';
  category: 'version_control' | 'project_management' | 'communication' | 'design' | 'storage' | 'ci_cd' | 'monitoring' | 'other';
  status: 'active' | 'inactive' | 'error' | 'pending_auth' | 'expired';
  authConfig: IAuthConfig;
  syncConfig: ISyncConfig;
  endpoints: {
    baseUrl: string;
    webhookUrl?: string;
    callbackUrl?: string;
  };
  features: {
    supportsWebhooks: boolean;
    supportsRealTimeSync: boolean;
    supportsBulkOperations: boolean;
    supportsFileUpload: boolean;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    currentUsage: {
      minute: number;
      hour: number;
      day: number;
      lastReset: Date;
    };
  };
  integrationLogs: IIntegrationLog[];
  metadata: {
    version: string;
    configuredBy: mongoose.Types.ObjectId;
    lastModifiedBy: mongoose.Types.ObjectId;
    tags: string[];
    isCustom: boolean;
  };
  statistics: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastSuccessfulSync?: Date;
    averageSyncTime: number;
    dataTransferred: number; // in bytes
  };
  createdAt: Date;
  updatedAt: Date;
}

const authConfigSchema = new Schema<IAuthConfig>({
  type: {
    type: String,
    required: [true, 'Authentication type is required'],
    enum: {
      values: ['oauth2', 'api_key', 'basic_auth', 'webhook', 'none'],
      message: 'Invalid authentication type'
    }
  },
  credentials: {
    type: Schema.Types.Mixed,
    required: [true, 'Credentials are required'],
    select: false // Don't include in queries by default for security
  },
  scopes: {
    type: [String],
    default: []
  },
  expiresAt: {
    type: Date
  },
  refreshToken: {
    type: String,
    select: false // Don't include in queries by default for security
  }
}, { _id: false });

const syncConfigSchema = new Schema<ISyncConfig>({
  enabled: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    required: [true, 'Sync frequency is required'],
    enum: {
      values: ['real-time', 'hourly', 'daily', 'weekly', 'manual'],
      message: 'Invalid sync frequency'
    },
    default: 'daily'
  },
  lastSyncAt: {
    type: Date
  },
  nextSyncAt: {
    type: Date
  },
  syncDirection: {
    type: String,
    required: [true, 'Sync direction is required'],
    enum: {
      values: ['bidirectional', 'import', 'export'],
      message: 'Invalid sync direction'
    },
    default: 'bidirectional'
  },
  fieldsMapping: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const integrationLogSchema = new Schema<IIntegrationLog>({
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: {
      values: ['sync', 'auth', 'webhook', 'api_call', 'error'],
      message: 'Invalid action type'
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['success', 'failure', 'warning'],
      message: 'Invalid status'
    }
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const externalIntegrationSchema = new Schema<IExternalIntegration>({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  name: {
    type: String,
    required: [true, 'Integration name is required'],
    trim: true,
    minlength: [3, 'Integration name must be at least 3 characters long'],
    maxlength: [100, 'Integration name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Integration description cannot exceed 500 characters']
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
    enum: {
      values: ['github', 'gitlab', 'jira', 'trello', 'slack', 'discord', 'notion', 'airtable', 'figma', 'custom'],
      message: 'Invalid provider'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['version_control', 'project_management', 'communication', 'design', 'storage', 'ci_cd', 'monitoring', 'other'],
      message: 'Invalid category'
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['active', 'inactive', 'error', 'pending_auth', 'expired'],
      message: 'Invalid status'
    },
    default: 'pending_auth'
  },
  authConfig: {
    type: authConfigSchema,
    required: [true, 'Authentication configuration is required']
  },
  syncConfig: {
    type: syncConfigSchema,
    required: [true, 'Sync configuration is required']
  },
  endpoints: {
    baseUrl: {
      type: String,
      required: [true, 'Base URL is required'],
      validate: {
        validator: function(url: string) {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format'
      }
    },
    webhookUrl: {
      type: String,
      validate: {
        validator: function(url: string) {
          if (!url) return true;
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid webhook URL format'
      }
    },
    callbackUrl: {
      type: String,
      validate: {
        validator: function(url: string) {
          if (!url) return true;
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid callback URL format'
      }
    }
  },
  features: {
    supportsWebhooks: { type: Boolean, default: false },
    supportsRealTimeSync: { type: Boolean, default: false },
    supportsBulkOperations: { type: Boolean, default: false },
    supportsFileUpload: { type: Boolean, default: false }
  },
  rateLimits: {
    requestsPerMinute: { type: Number, default: 60, min: 1, max: 10000 },
    requestsPerHour: { type: Number, default: 3600, min: 60, max: 100000 },
    requestsPerDay: { type: Number, default: 86400, min: 1000, max: 1000000 },
    currentUsage: {
      minute: { type: Number, default: 0, min: 0 },
      hour: { type: Number, default: 0, min: 0 },
      day: { type: Number, default: 0, min: 0 },
      lastReset: { type: Date, default: Date.now }
    }
  },
  integrationLogs: {
    type: [integrationLogSchema],
    default: [],
    validate: {
      validator: function(logs: IIntegrationLog[]) {
        return logs.length <= 500;
      },
      message: 'Cannot store more than 500 integration logs'
    }
  },
  metadata: {
    version: {
      type: String,
      required: [true, 'Version is required'],
      default: '1.0.0',
      validate: {
        validator: function(version: string) {
          return /^\d+\.\d+\.\d+$/.test(version);
        },
        message: 'Version must follow semantic versioning (e.g., 1.0.0)'
      }
    },
    configuredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Configured by user ID is required']
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
    isCustom: { type: Boolean, default: false }
  },
  statistics: {
    totalSyncs: { type: Number, default: 0, min: 0 },
    successfulSyncs: { type: Number, default: 0, min: 0 },
    failedSyncs: { type: Number, default: 0, min: 0 },
    lastSuccessfulSync: { type: Date },
    averageSyncTime: { type: Number, default: 0, min: 0 },
    dataTransferred: { type: Number, default: 0, min: 0 }
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(_doc, ret) {
      ret.integrationId = ret._id;
      delete ret._id;
      // Remove sensitive data from JSON output
      if (ret.authConfig && ret.authConfig.credentials) {
        ret.authConfig.credentials = '[REDACTED]';
      }
      if (ret.authConfig && ret.authConfig.refreshToken) {
        ret.authConfig.refreshToken = '[REDACTED]';
      }
      return ret;
    }
  }
});

// Indexes
externalIntegrationSchema.index({ projectId: 1 });
externalIntegrationSchema.index({ provider: 1 });
externalIntegrationSchema.index({ category: 1 });
externalIntegrationSchema.index({ status: 1 });
externalIntegrationSchema.index({ projectId: 1, provider: 1 });
externalIntegrationSchema.index({ 'syncConfig.enabled': 1 });
externalIntegrationSchema.index({ 'syncConfig.nextSyncAt': 1 });
externalIntegrationSchema.index({ createdAt: -1 });
externalIntegrationSchema.index({ 'metadata.tags': 1 });

// Method to log integration activity
externalIntegrationSchema.methods.logActivity = function(
  this: IExternalIntegration,
  action: string,
  status: string,
  message: string,
  details?: Record<string, any>
) {
  const log: IIntegrationLog = {
    timestamp: new Date(),
    action: action as any,
    status: status as any,
    message,
    ...(details && { details })
  };

  // Add to logs (keep only last 100 logs)
  this.integrationLogs.push(log);
  if (this.integrationLogs.length > 100) {
    this.integrationLogs = this.integrationLogs.slice(-100);
  }

  return this;
};

// Method to check rate limits
externalIntegrationSchema.methods.checkRateLimit = function(this: IExternalIntegration): boolean {
  const now = new Date();
  const resetTime = new Date(this.rateLimits.currentUsage.lastReset);
  
  // Reset counters if needed
  if (now.getTime() - resetTime.getTime() > 86400000) { // 24 hours
    this.rateLimits.currentUsage.day = 0;
    this.rateLimits.currentUsage.hour = 0;
    this.rateLimits.currentUsage.minute = 0;
    this.rateLimits.currentUsage.lastReset = now;
  } else if (now.getTime() - resetTime.getTime() > 3600000) { // 1 hour
    this.rateLimits.currentUsage.hour = 0;
    this.rateLimits.currentUsage.minute = 0;
  } else if (now.getTime() - resetTime.getTime() > 60000) { // 1 minute
    this.rateLimits.currentUsage.minute = 0;
  }

  // Check limits
  return (
    this.rateLimits.currentUsage.minute < this.rateLimits.requestsPerMinute &&
    this.rateLimits.currentUsage.hour < this.rateLimits.requestsPerHour &&
    this.rateLimits.currentUsage.day < this.rateLimits.requestsPerDay
  );
};

// Method to increment rate limit usage
externalIntegrationSchema.methods.incrementUsage = function(this: IExternalIntegration) {
  this.rateLimits.currentUsage.minute += 1;
  this.rateLimits.currentUsage.hour += 1;
  this.rateLimits.currentUsage.day += 1;
  return this;
};

// Method to calculate success rate
externalIntegrationSchema.methods.getSuccessRate = function(this: IExternalIntegration): number {
  if (this.statistics.totalSyncs === 0) return 100;
  return Math.round((this.statistics.successfulSyncs / this.statistics.totalSyncs) * 100);
};

export const ExternalIntegration = mongoose.model<IExternalIntegration>('ExternalIntegration', externalIntegrationSchema); 