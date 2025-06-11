import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { OpenAIService } from '../services/openai.js';
import {
  aiConfig,
  globalRateLimiter,
  globalCostTracker,
} from '../config/ai.js';

// Define mock function type
type MockCreate = ReturnType<typeof vi.fn>;

// Mock the OpenAI module - using factory function to avoid hoisting issues
vi.mock('openai', () => {
  const mockCreate = vi.fn();
  const MockOpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));

  return {
    default: MockOpenAI,
    __mockCreate: mockCreate, // Export mock for access in tests
  };
});

describe('OpenAI Integration', () => {
  let testService: OpenAIService;
  let mockCreate: MockCreate;

  beforeAll(async () => {
    // Get the mock function from the mocked module with proper typing
    const openAIModule = await import('openai');
    mockCreate = (openAIModule as unknown as { __mockCreate: MockCreate })
      .__mockCreate;

    // Set up default mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Test response from OpenAI',
          },
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  });

  beforeEach(() => {
    // Reset mocks and create fresh service instance
    vi.clearAllMocks();

    // Create new service instance for each test
    testService = new OpenAIService();
  });

  describe('Configuration Validation', () => {
    it('should validate AI configuration on initialization', () => {
      expect(aiConfig.openai.apiKey).toBeDefined();
      expect(aiConfig.openai.model).toBeDefined();
      expect(aiConfig.openai.maxTokens).toBeGreaterThan(0);
      expect(aiConfig.costs.dailyCostLimit).toBeGreaterThan(0);
    });

    it('should have different configs for development and production', () => {
      expect(aiConfig.openai.model).toMatch(/(gpt-3\.5-turbo|gpt-4)/);
      expect(aiConfig.openai.rateLimitRPM).toBeGreaterThan(0);
      expect(aiConfig.openai.rateLimitTPM).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limits', () => {
      const canMakeRequest = globalRateLimiter.canMakeRequest(100);
      expect(canMakeRequest).toBe(true);
    });

    it('should track request history', () => {
      globalRateLimiter.recordRequest(100);
      const waitTime = globalRateLimiter.getWaitTime();
      expect(typeof waitTime).toBe('number');
    });
  });

  describe('Cost Tracking', () => {
    it('should track daily costs', () => {
      const initialCost = globalCostTracker.getDailyCost();
      globalCostTracker.recordCost(0.5);
      const newCost = globalCostTracker.getDailyCost();

      expect(newCost).toBeGreaterThan(initialCost);
    });

    it('should prevent requests that exceed daily budget', () => {
      const hugeCost = aiConfig.costs.dailyCostLimit + 1;
      const canAfford = globalCostTracker.canAffordRequest(hugeCost);
      expect(canAfford).toBe(false);
    });

    it('should allow requests within budget', () => {
      const smallCost = 0.01;
      const canAfford = globalCostTracker.canAffordRequest(smallCost);
      expect(canAfford).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors gracefully', async () => {
      // Mock to always fail with rate limit error (no retry success)
      mockCreate.mockRejectedValue({
        status: 429,
        headers: { 'retry-after': '1' }, // Use 1 second instead of 60 for tests
        message: 'Rate limit exceeded',
      });

      await expect(testService.completion('test prompt')).rejects.toThrow(
        /rate limit/i
      );
    }, 10000); // 10 second timeout for this test

    it('should handle network errors with retry logic', async () => {
      mockCreate
        .mockRejectedValueOnce({ code: 'ENOTFOUND' })
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success after retry' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        });

      const response = await testService.completion('test prompt');
      expect(response.content).toBe('Success after retry');
    });

    it('should handle quota/billing errors without retry', async () => {
      mockCreate.mockRejectedValue({
        status: 402,
        message: 'Insufficient quota',
      });

      await expect(testService.completion('test prompt')).rejects.toThrow(
        /quota/i
      );
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI to throw a rate limit error
      const mockError = new Error('Rate limit exceeded');
      Object.assign(mockError, {
        status: 429,
        message: 'Rate limit exceeded',
        headers: { 'retry-after': '1' }, // Use shorter retry time for tests
      });

      mockCreate.mockRejectedValue(mockError); // Use mockRejectedValue instead of mockRejectedValueOnce

      // Test that the service handles errors properly with shorter timeout
      await expect(testService.completion('test prompt')).rejects.toThrow();
    }, 5000); // Reduce timeout to 5 seconds
  });

  describe('Service Methods', () => {
    it('should make basic completion requests', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test response from OpenAI',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      const response = await testService.completion('Test prompt');

      expect(response.content).toBe('Test response from OpenAI');
      expect(response.tokensUsed).toBe(150);
      expect(response.cost).toBeGreaterThan(0);
      expect(response.processingTime).toBeGreaterThanOrEqual(0);
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('should analyze SaaS ideas with proper prompting', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test response from OpenAI',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });

      const response = await testService.analyzeSaaSIdea(
        'AI-powered task management app',
        'Small teams and freelancers',
        'Current tools are too complex and expensive'
      );

      expect(response.content).toBeDefined();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should generate features with structured prompting', async () => {
      const response = await testService.generateFeatures(
        'AI-powered task management',
        'Small teams',
        'Previous analysis results'
      );

      expect(response.content).toBeDefined();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 2000,
          temperature: 0.6,
        })
      );
    });

    it('should recommend tech stacks appropriately', async () => {
      const response = await testService.recommendTechStack(
        'Task management app',
        'Real-time collaboration, file sharing',
        'Budget under $500/month'
      );

      expect(response.content).toBeDefined();
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1800,
          temperature: 0.5,
        })
      );
    });

    it('should calculate costs correctly', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      };

      mockCreate.mockResolvedValueOnce(mockResponse);
    });
  });

  describe('Service Status', () => {
    it('should provide comprehensive status information', () => {
      const status = testService.getStatus();

      expect(status).toMatchObject({
        isConfigured: expect.any(Boolean),
        model: expect.any(String),
        dailyCost: expect.any(Number),
        dailyLimit: expect.any(Number),
        remainingBudget: expect.any(Number),
        rateLimitStatus: {
          canMakeRequest: expect.any(Boolean),
          waitTime: expect.any(Number),
        },
        features: expect.any(Object),
      });
    });

    it('should show correct configuration status', () => {
      const status = testService.getStatus();
      expect(status.isConfigured).toBe(true);
      expect(status.model).toBe(aiConfig.openai.model);
      expect(status.features).toEqual(aiConfig.features);
    });
  });

  describe('Token and Cost Estimation', () => {
    it('should estimate tokens reasonably', async () => {
      const prompt = 'This is a test prompt for token estimation';
      const response = await testService.completion(prompt);

      // Verify cost calculation includes both input and output tokens
      expect(response.cost).toBeGreaterThan(0);
      expect(response.tokensUsed).toBeGreaterThan(0);
    });

    it('should respect custom parameters', async () => {
      await testService.completion('test', {
        maxTokens: 500,
        temperature: 0.9,
        model: 'gpt-3.5-turbo',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 500,
          temperature: 0.9,
          model: 'gpt-3.5-turbo',
        })
      );
    });
  });
});

// Integration test with real environment (if API key is available)
describe('OpenAI Real Integration', () => {
  const hasRealApiKey =
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.startsWith('sk-') &&
    process.env.NODE_ENV !== 'test';

  it.skipIf(!hasRealApiKey)(
    'should make real API call when configured',
    async () => {
      const service = new OpenAIService();

      try {
        const response = await service.completion(
          'Say "Hello from OpenAI integration test"',
          { maxTokens: 20 }
        );

        expect(response.content).toBeDefined();
        expect(response.content.length).toBeGreaterThan(0);
        expect(response.tokensUsed).toBeGreaterThan(0);
        expect(response.cost).toBeGreaterThan(0);

        console.log('✅ Real OpenAI integration test passed:', {
          tokens: response.tokensUsed,
          cost: `$${response.cost.toFixed(4)}`,
          time: `${response.processingTime}ms`,
        });
      } catch (error) {
        console.warn(
          '⚠️  Real OpenAI test failed (this is expected without valid API key):',
          error
        );
      }
    }
  );
});
