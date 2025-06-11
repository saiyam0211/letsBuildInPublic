import { vi } from 'vitest';
import type { OpenAIResponse } from '@/services/openai';

/**
 * Mock OpenAI response for testing
 */
export const createMockOpenAIResponse = (
  content: string = 'Mock OpenAI response'
): OpenAIResponse => ({
  content,
  tokensUsed: 100,
  cost: 0.001,
  model: 'gpt-3.5-turbo',
  processingTime: 1000,
});

/**
 * Mock successful OpenAI service calls
 */
export const mockOpenAIService = () => {
  return vi.doMock('@/services/openai', () => ({
    openAIService: {
      completion: vi.fn().mockResolvedValue(createMockOpenAIResponse()),
      analyzeSaaSIdea: vi
        .fn()
        .mockResolvedValue(
          createMockOpenAIResponse('{"viabilityScore": 85, "confidence": 90}')
        ),
      generateFeatures: vi
        .fn()
        .mockResolvedValue(
          createMockOpenAIResponse('{"mvpFeatures": [], "growthFeatures": []}')
        ),
      recommendTechStack: vi
        .fn()
        .mockResolvedValue(
          createMockOpenAIResponse(
            '{"frontend": {"primary": "React"}, "backend": {"primary": "Node.js"}}'
          )
        ),
      getStatus: vi.fn().mockReturnValue({
        isConfigured: true,
        model: 'gpt-3.5-turbo',
        dailyCost: 0,
        dailyLimit: 10,
        remainingBudget: 10,
        rateLimitStatus: { canMakeRequest: true, waitTime: 0 },
        features: { enableAIProcessing: true },
      }),
    },
  }));
};

/**
 * Mock Redis client for testing
 */
export const mockRedisClient = () => {
  const mockRedis = {
    ping: vi.fn().mockResolvedValue('PONG'),
    set: vi.fn().mockResolvedValue('OK'),
    get: vi.fn().mockResolvedValue(null),
    del: vi.fn().mockResolvedValue(1),
    quit: vi.fn().mockResolvedValue('OK'),
    flushdb: vi.fn().mockResolvedValue('OK'),
    on: vi.fn(),
    emit: vi.fn(),
  };

  return vi.doMock('ioredis', () => ({
    default: vi.fn(() => mockRedis),
  }));
};

/**
 * Mock JWT functions for testing
 */
export const mockJWT = () => {
  return vi.doMock('jsonwebtoken', () => ({
    sign: vi.fn().mockReturnValue('mock.jwt.token'),
    verify: vi
      .fn()
      .mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
    decode: vi
      .fn()
      .mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
    TokenExpiredError: class extends Error {},
    JsonWebTokenError: class extends Error {},
    NotBeforeError: class extends Error {},
  }));
};

/**
 * Setup all common mocks for testing
 */
export const setupTestMocks = () => {
  mockOpenAIService();
  mockRedisClient();
  mockJWT();
};

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
};
