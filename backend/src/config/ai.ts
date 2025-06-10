import dotenv from 'dotenv';

dotenv.config();

export interface AIConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    rateLimitRPM: number;
    rateLimitTPM: number;
    timeoutMs: number;
    maxRetries: number;
  };
  langchain: {
    tracingEnabled: boolean;
    apiKey?: string;
  };
  processing: {
    maxConcurrentJobs: number;
    jobTimeoutMs: number;
    retryAttempts: number;
    retryDelayMs: number;
  };
  features: {
    enableAIProcessing: boolean;
    enableMarketAnalysis: boolean;
    enableTechRecommendations: boolean;
    enableFeatureGeneration: boolean;
  };
  costs: {
    maxCostPerRequest: number;
    dailyCostLimit: number;
    warningThreshold: number;
  };
}

// Validate required environment variables
const validateEnvVars = (): void => {
  // Skip validation in test environment
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Test environment detected - skipping OpenAI API key validation');
    return;
  }

  const required = ['OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate OpenAI API key format
  const apiKey = process.env.OPENAI_API_KEY!;
  if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
    throw new Error('Invalid OpenAI API key format. Must start with "sk-" and be at least 40 characters long.');
  }
};

// Get API key with test fallback
const getApiKey = (): string => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.OPENAI_API_KEY || 'sk-test-mock-api-key-for-testing-12345678901234567890';
  }
  return process.env.OPENAI_API_KEY!;
};

// Development vs Production configurations
const developmentConfig: AIConfig = {
  openai: {
    apiKey: getApiKey(),
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Use cheaper model for dev
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1500'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    rateLimitRPM: parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '20'), // Lower limits for dev
    rateLimitTPM: parseInt(process.env.OPENAI_RATE_LIMIT_TPM || '10000'),
    timeoutMs: 30000,
    maxRetries: 3,
  },
  langchain: {
    tracingEnabled: process.env.LANGCHAIN_TRACING_V2 === 'true',
    ...(process.env.LANGCHAIN_API_KEY && { apiKey: process.env.LANGCHAIN_API_KEY }),
  },
  processing: {
    maxConcurrentJobs: 3,
    jobTimeoutMs: 120000, // 2 minutes
    retryAttempts: 3,
    retryDelayMs: 5000,
  },
  features: {
    enableAIProcessing: process.env.ENABLE_AI_PROCESSING !== 'false',
    enableMarketAnalysis: process.env.ENABLE_MARKET_ANALYSIS !== 'false',
    enableTechRecommendations: process.env.ENABLE_TECH_RECOMMENDATIONS !== 'false',
    enableFeatureGeneration: process.env.ENABLE_FEATURE_GENERATION !== 'false',
  },
  costs: {
    maxCostPerRequest: 0.50, // $0.50 per request max
    dailyCostLimit: 10.00, // $10 daily limit for dev
    warningThreshold: 0.80, // Warn at 80% of daily limit
  },
};

const productionConfig: AIConfig = {
  openai: {
    apiKey: getApiKey(),
    model: process.env.OPENAI_MODEL || 'gpt-4', // Use GPT-4 for production
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    rateLimitRPM: parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '60'),
    rateLimitTPM: parseInt(process.env.OPENAI_RATE_LIMIT_TPM || '40000'),
    timeoutMs: 60000,
    maxRetries: 5,
  },
  langchain: {
    tracingEnabled: process.env.LANGCHAIN_TRACING_V2 === 'true',
    ...(process.env.LANGCHAIN_API_KEY && { apiKey: process.env.LANGCHAIN_API_KEY }),
  },
  processing: {
    maxConcurrentJobs: 10,
    jobTimeoutMs: 300000, // 5 minutes
    retryAttempts: 5,
    retryDelayMs: 10000,
  },
  features: {
    enableAIProcessing: process.env.ENABLE_AI_PROCESSING !== 'false',
    enableMarketAnalysis: process.env.ENABLE_MARKET_ANALYSIS !== 'false',
    enableTechRecommendations: process.env.ENABLE_TECH_RECOMMENDATIONS !== 'false',
    enableFeatureGeneration: process.env.ENABLE_FEATURE_GENERATION !== 'false',
  },
  costs: {
    maxCostPerRequest: 2.00, // $2.00 per request max
    dailyCostLimit: 100.00, // $100 daily limit for production
    warningThreshold: 0.80, // Warn at 80% of daily limit
  },
};

const testConfig: AIConfig = {
  openai: {
    apiKey: getApiKey(),
    model: 'gpt-3.5-turbo', // Use cheaper model for tests
    maxTokens: 500, // Smaller for tests
    temperature: 0.5,
    rateLimitRPM: 1000, // High limits for tests
    rateLimitTPM: 100000,
    timeoutMs: 10000, // Shorter timeout for tests
    maxRetries: 1, // Fewer retries for tests
  },
  langchain: {
    tracingEnabled: false, // Disable tracing in tests
  },
  processing: {
    maxConcurrentJobs: 1,
    jobTimeoutMs: 30000,
    retryAttempts: 1,
    retryDelayMs: 100,
  },
  features: {
    enableAIProcessing: true,
    enableMarketAnalysis: true,
    enableTechRecommendations: true,
    enableFeatureGeneration: true,
  },
  costs: {
    maxCostPerRequest: 1.00,
    dailyCostLimit: 5.00, // Lower limit for tests
    warningThreshold: 0.80,
  },
};

// Initialize and validate configuration
const initializeAIConfig = (): AIConfig => {
  validateEnvVars();
  
  const environment = process.env.NODE_ENV || 'development';
  let config: AIConfig;
  
  switch (environment) {
    case 'test':
      config = testConfig;
      break;
    case 'production':
      config = productionConfig;
      break;
    default:
      config = developmentConfig;
  }
  
  console.log(`🤖 AI Configuration initialized for ${environment.toUpperCase()} mode`);
  console.log(`   Model: ${config.openai.model}`);
  console.log(`   Rate Limits: ${config.openai.rateLimitRPM} RPM, ${config.openai.rateLimitTPM} TPM`);
  console.log(`   Daily Cost Limit: $${config.costs.dailyCostLimit}`);
  
  return config;
};

export const aiConfig = initializeAIConfig();

// Rate limiting helper
export class RateLimiter {
  private requests: number[] = [];
  private tokens: number = 0;
  private lastReset: number = Date.now();

  constructor(private config: AIConfig['openai']) {}

  canMakeRequest(estimatedTokens: number = 100): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Remove requests older than 1 minute
    this.requests = this.requests.filter(time => now - time < oneMinute);

    // Reset token count every minute
    if (now - this.lastReset > oneMinute) {
      this.tokens = 0;
      this.lastReset = now;
    }

    // Check rate limits
    const withinRPMLimit = this.requests.length < this.config.rateLimitRPM;
    const withinTPMLimit = (this.tokens + estimatedTokens) <= this.config.rateLimitTPM;

    return withinRPMLimit && withinTPMLimit;
  }

  recordRequest(tokensUsed: number): void {
    this.requests.push(Date.now());
    this.tokens += tokensUsed;
  }

  getWaitTime(): number {
    const now = Date.now();
    const oldestRequest = this.requests[0];
    
    if (!oldestRequest) return 0;
    
    const timeSinceOldest = now - oldestRequest;
    const waitTime = (60 * 1000) - timeSinceOldest;
    
    return Math.max(0, waitTime);
  }
}

// Cost tracking helper
export class CostTracker {
  private dailyCost: number = 0;
  private lastReset: Date = new Date();

  constructor(private config: AIConfig['costs']) {}

  canAffordRequest(estimatedCost: number): boolean {
    this.resetIfNewDay();
    return (this.dailyCost + estimatedCost) <= this.config.dailyCostLimit;
  }

  recordCost(cost: number): void {
    this.resetIfNewDay();
    this.dailyCost += cost;

    if (this.dailyCost >= this.config.dailyCostLimit * this.config.warningThreshold) {
      console.warn(`⚠️  AI costs approaching daily limit: $${this.dailyCost.toFixed(2)}/$${this.config.dailyCostLimit}`);
    }
  }

  private resetIfNewDay(): void {
    const now = new Date();
    if (now.getDate() !== this.lastReset.getDate()) {
      this.dailyCost = 0;
      this.lastReset = now;
      console.log('📊 Daily AI cost tracking reset');
    }
  }

  getDailyCost(): number {
    this.resetIfNewDay();
    return this.dailyCost;
  }
}

export const globalRateLimiter = new RateLimiter(aiConfig.openai);
export const globalCostTracker = new CostTracker(aiConfig.costs); 