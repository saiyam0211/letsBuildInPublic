import OpenAI from 'openai';
import {
  aiConfig,
  globalRateLimiter,
  globalCostTracker,
} from '../config/ai.js';

export interface OpenAIResponse {
  content: string;
  tokensUsed: number;
  cost: number;
  model: string;
  processingTime: number;
}

export interface OpenAIError {
  type:
    | 'rate_limit'
    | 'insufficient_quota'
    | 'api_error'
    | 'network_error'
    | 'timeout'
    | 'validation_error';
  message: string;
  retryAfter?: number;
  canRetry: boolean;
}

export class OpenAIService {
  private client: OpenAI;
  private readonly pricing = {
    'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }, // per 1K tokens
  };

  constructor() {
    this.client = new OpenAI({
      apiKey: aiConfig.openai.apiKey,
      timeout: aiConfig.openai.timeoutMs,
    });
    console.log('🤖 OpenAI Service initialized');
  }

  /**
   * Calculate estimated cost for a request
   */
  private estimateCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number {
    const modelPricing = this.pricing[model as keyof typeof this.pricing];
    if (!modelPricing) {
      console.warn(
        `⚠️  Unknown model pricing for ${model}, using GPT-4 pricing`
      );
      return (
        this.pricing['gpt-4'].input * (inputTokens / 1000) +
        this.pricing['gpt-4'].output * (outputTokens / 1000)
      );
    }

    return (
      modelPricing.input * (inputTokens / 1000) +
      modelPricing.output * (outputTokens / 1000)
    );
  }

  /**
   * Estimate input tokens (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateInputTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Handle OpenAI API errors with proper categorization
   */
  private handleOpenAIError(error: unknown): OpenAIError {
    if (error && typeof error === 'object' && 'status' in error) {
      const statusError = error as {
        status: number;
        headers?: Record<string, string>;
        message?: string;
      };

      if (statusError.status === 429) {
        const retryAfter = statusError.headers?.['retry-after']
          ? parseInt(statusError.headers['retry-after'])
          : 60;
        return {
          type: 'rate_limit',
          message:
            'Rate limit exceeded. Please wait before making another request.',
          retryAfter: retryAfter * 1000, // Convert to milliseconds
          canRetry: true,
        };
      }

      if (
        statusError.status === 402 ||
        (statusError.status === 400 && statusError.message?.includes('quota'))
      ) {
        return {
          type: 'insufficient_quota',
          message:
            'Insufficient quota or billing issue. Please check your OpenAI account.',
          canRetry: false,
        };
      }

      if (statusError.status === 400) {
        return {
          type: 'validation_error',
          message: statusError.message || 'Invalid request parameters.',
          canRetry: false,
        };
      }
    }

    if (error && typeof error === 'object' && 'code' in error) {
      const codeError = error as { code: string; message?: string };

      if (codeError.code === 'ENOTFOUND' || codeError.code === 'ECONNREFUSED') {
        return {
          type: 'network_error',
          message:
            'Network connection failed. Please check your internet connection.',
          canRetry: true,
        };
      }

      if (
        codeError.code === 'TIMEOUT' ||
        codeError.message?.includes('timeout')
      ) {
        return {
          type: 'timeout',
          message:
            'Request timed out. The operation took too long to complete.',
          canRetry: true,
        };
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred with the OpenAI API.';
    return {
      type: 'api_error',
      message,
      canRetry: true,
    };
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = aiConfig.openai.maxRetries,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const openAIError = this.handleOpenAIError(error);

        if (!openAIError.canRetry || attempt === maxRetries) {
          console.error(
            `❌ OpenAI request failed after ${attempt + 1} attempts:`,
            openAIError.message
          );
          throw new Error(`OpenAI ${openAIError.type}: ${openAIError.message}`);
        }

        const delay =
          openAIError.retryAfter || baseDelay * Math.pow(2, attempt);
        console.warn(
          `⚠️  Attempt ${attempt + 1} failed (${openAIError.type}), retrying in ${delay}ms...`
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Make a completion request with full error handling and monitoring
   */
  async completion(
    prompt: string,
    options: {
      systemMessage?: string;
      maxTokens?: number;
      temperature?: number;
      model?: string;
    } = {}
  ): Promise<OpenAIResponse> {
    const startTime = Date.now();
    const model = options.model || aiConfig.openai.model;
    const maxTokens = options.maxTokens || aiConfig.openai.maxTokens;
    const temperature = options.temperature ?? aiConfig.openai.temperature;

    // Estimate tokens and cost before making request
    const systemTokens = options.systemMessage
      ? this.estimateInputTokens(options.systemMessage)
      : 0;
    const promptTokens = this.estimateInputTokens(prompt);
    const estimatedInputTokens = systemTokens + promptTokens;
    const estimatedOutputTokens = maxTokens;
    const estimatedCost = this.estimateCost(
      estimatedInputTokens,
      estimatedOutputTokens,
      model
    );

    // Check rate limits
    if (
      !globalRateLimiter.canMakeRequest(
        estimatedInputTokens + estimatedOutputTokens
      )
    ) {
      const waitTime = globalRateLimiter.getWaitTime();
      throw new Error(
        `Rate limit reached. Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`
      );
    }

    // Check cost limits
    if (!globalCostTracker.canAffordRequest(estimatedCost)) {
      throw new Error(
        `Daily cost limit would be exceeded. Estimated cost: $${estimatedCost.toFixed(4)}, remaining budget: $${(aiConfig.costs.dailyCostLimit - globalCostTracker.getDailyCost()).toFixed(2)}`
      );
    }

    // Check feature availability
    if (!aiConfig.features.enableAIProcessing) {
      throw new Error(
        'AI processing is currently disabled. Please check configuration.'
      );
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options.systemMessage) {
      messages.push({
        role: 'system',
        content: options.systemMessage,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    console.log(
      `🤖 Making OpenAI request: ${model}, estimated cost: $${estimatedCost.toFixed(4)}`
    );

    const response = await this.withRetry(async () => {
      return await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: false,
      });
    });

    // Extract response data
    const content = response.choices[0]?.message?.content || '';
    const usage = response.usage;
    const actualInputTokens = usage?.prompt_tokens || estimatedInputTokens;
    const actualOutputTokens = usage?.completion_tokens || 0;
    const totalTokens =
      usage?.total_tokens || actualInputTokens + actualOutputTokens;
    const actualCost = this.estimateCost(
      actualInputTokens,
      actualOutputTokens,
      model
    );
    const processingTime = Date.now() - startTime;

    // Record metrics
    globalRateLimiter.recordRequest(totalTokens);
    globalCostTracker.recordCost(actualCost);

    console.log(
      `✅ OpenAI request completed: ${totalTokens} tokens, $${actualCost.toFixed(4)}, ${processingTime}ms`
    );

    return {
      content,
      tokensUsed: totalTokens,
      cost: actualCost,
      model,
      processingTime,
    };
  }

  /**
   * Analyze SaaS idea with structured prompting
   */
  async analyzeSaaSIdea(
    description: string,
    targetAudience: string,
    problemStatement: string
  ): Promise<OpenAIResponse> {
    const systemMessage = `You are an expert SaaS business analyst and product strategist. Analyze the provided SaaS idea comprehensively and provide structured insights.

Your analysis should cover:
1. Business Model Viability (market fit, scalability, revenue potential)
2. Target Audience Analysis (demographics, pain points, willingness to pay)
3. Problem-Solution Fit (how well the solution addresses the problem)
4. Market Opportunity (size, competition, barriers to entry)
5. Risk Assessment (technical, market, financial risks)
6. Improvement Recommendations (specific actionable suggestions)

Provide your response in JSON format with confidence scores (0-100) for each aspect.`;

    const prompt = `Analyze this SaaS idea:

**Description:** ${description}

**Target Audience:** ${targetAudience}

**Problem Statement:** ${problemStatement}

Please provide a comprehensive analysis with confidence scores and specific recommendations.`;

    return this.completion(prompt, {
      systemMessage,
      maxTokens: 2000,
      temperature: 0.7,
    });
  }

  /**
   * Generate features for a SaaS idea
   */
  async generateFeatures(
    ideaDescription: string,
    targetAudience: string,
    analysisResults?: string
  ): Promise<OpenAIResponse> {
    const systemMessage = `You are a product manager expert specializing in SaaS feature definition. Generate a comprehensive list of features for the given SaaS idea.

Categorize features into:
1. MVP Core Features (essential for launch)
2. Growth Features (for user acquisition and retention)  
3. Advanced Features (for market leadership)

For each feature provide:
- Name and description
- User story format
- Priority score (1-10)
- Effort estimation (S/M/L/XL)
- Success metrics

Respond in structured JSON format.`;

    const analysisContext = analysisResults
      ? `\n\n**Previous Analysis Results:**\n${analysisResults}`
      : '';

    const prompt = `Generate features for this SaaS idea:

**Idea:** ${ideaDescription}

**Target Audience:** ${targetAudience}${analysisContext}

Provide comprehensive feature specifications with priorities and effort estimates.`;

    return this.completion(prompt, {
      systemMessage,
      maxTokens: 2000,
      temperature: 0.6,
    });
  }

  /**
   * Recommend tech stack for a SaaS idea
   */
  async recommendTechStack(
    ideaDescription: string,
    features: string,
    constraints?: string
  ): Promise<OpenAIResponse> {
    const systemMessage = `You are a senior technical architect specializing in SaaS platforms. Recommend an optimal tech stack based on the SaaS idea, features, and constraints.

Consider:
1. Frontend technologies (framework, UI libraries, state management)
2. Backend technologies (runtime, framework, APIs)
3. Database technologies (primary DB, caching, search)
4. Infrastructure (hosting, CDN, monitoring)
5. Third-party services (authentication, payments, analytics)

Provide rationale for each choice, cost estimates, and alternative options.

Respond in structured JSON format with explanations.`;

    const constraintsText = constraints
      ? `\n\n**Constraints:** ${constraints}`
      : '';

    const prompt = `Recommend a tech stack for:

**SaaS Idea:** ${ideaDescription}

**Key Features:** ${features}${constraintsText}

Provide detailed recommendations with cost considerations and alternatives.`;

    return this.completion(prompt, {
      systemMessage,
      maxTokens: 1800,
      temperature: 0.5,
    });
  }

  /**
   * Get current service status and metrics
   */
  getStatus() {
    return {
      isConfigured: !!aiConfig.openai.apiKey,
      model: aiConfig.openai.model,
      dailyCost: globalCostTracker.getDailyCost(),
      dailyLimit: aiConfig.costs.dailyCostLimit,
      remainingBudget:
        aiConfig.costs.dailyCostLimit - globalCostTracker.getDailyCost(),
      rateLimitStatus: {
        canMakeRequest: globalRateLimiter.canMakeRequest(),
        waitTime: globalRateLimiter.getWaitTime(),
      },
      features: aiConfig.features,
    };
  }
}

export const openAIService = new OpenAIService();
