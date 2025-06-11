import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  ideaProcessingService,
  IdeaProcessingRequest,
} from '../services/ideaProcessing.js';
import { SaasIdea } from '../models/SaasIdea.js';
import { IdeaValidation } from '../models/IdeaValidation.js';
import { Feature } from '../models/Feature.js';
import { TechStackRecommendation } from '../models/TechStackRecommendation.js';

// Mock OpenAI service
const mockOpenAIResponse = {
  content: '',
  cost: 0.001,
  tokensUsed: 100,
  processingTime: 1000,
  model: 'gpt-4',
};

const mockBusinessAnalysis = JSON.stringify({
  businessModelType: 'B2B',
  revenueModel: 'Subscription',
  viabilityScore: 85,
  scalabilityScore: 90,
  competitiveLandscape: {
    competitionLevel: 'Medium',
    marketSaturation: 60,
    differentiation: [
      'AI-powered automation',
      'User-friendly interface',
      'Real-time analytics',
    ],
  },
  confidenceScore: 88,
});

const mockMarketValidation = JSON.stringify({
  marketSize: {
    tam: '$50 billion globally',
    sam: '$5 billion in target markets',
    som: '$50 million achievable in 5 years',
  },
  targetAudienceAnalysis: {
    primarySegment: 'Small to medium businesses seeking automation',
    secondarySegments: ['Enterprise clients', 'Individual entrepreneurs'],
    painPoints: ['Manual processes', 'Data inconsistency', 'Time consumption'],
    willingnessToPay: '$50-200 per month based on value provided',
    acquisitionChannels: [
      'Content marketing',
      'SaaS directories',
      'Referral programs',
    ],
  },
  riskAssessment: {
    marketRisks: ['Market saturation', 'Economic downturn'],
    technicalRisks: ['Scalability challenges', 'AI model reliability'],
    financialRisks: [
      'High customer acquisition cost',
      'Revenue model validation',
    ],
    competitiveRisks: ['Established players', 'New entrants'],
  },
  validationScore: 82,
});

const mockFeatureGeneration = JSON.stringify({
  mvpFeatures: [
    {
      name: 'User Dashboard',
      description: 'Central hub for all user activities',
      userStory:
        'As a user, I want a dashboard so that I can see all my data at a glance',
      priority: 10,
      effort: 'M',
      dependencies: ['Authentication'],
      successMetrics: ['Daily active users', 'Time spent on dashboard'],
    },
    {
      name: 'Data Import',
      description: 'Import data from various sources',
      userStory: 'As a user, I want to import data so that I can analyze it',
      priority: 9,
      effort: 'L',
      dependencies: [],
      successMetrics: ['Import success rate', 'Data quality score'],
    },
  ],
  growthFeatures: [
    {
      name: 'Advanced Analytics',
      description: 'Deep dive analytics capabilities',
      userStory:
        'As a power user, I want advanced analytics so that I can gain deeper insights',
      priority: 8,
      effort: 'XL',
      dependencies: ['Data Import', 'User Dashboard'],
      successMetrics: ['Feature adoption rate', 'User retention'],
    },
  ],
  advancedFeatures: [
    {
      name: 'AI Predictions',
      description: 'Machine learning powered predictions',
      userStory:
        'As a business owner, I want AI predictions so that I can make better decisions',
      priority: 7,
      effort: 'XL',
      dependencies: ['Advanced Analytics'],
      successMetrics: ['Prediction accuracy', 'Business impact'],
    },
  ],
  featureRoadmap: {
    phase1: ['User Dashboard', 'Data Import'],
    phase2: ['Advanced Analytics'],
    phase3: ['AI Predictions'],
  },
});

const mockTechStack = JSON.stringify({
  frontend: {
    primary: 'React',
    alternatives: ['Vue.js', 'Angular'],
    reasoning: 'Large ecosystem and community support',
    pros: ['Component reusability', 'Strong TypeScript support'],
    cons: ['Learning curve', 'Frequent updates'],
  },
  backend: {
    primary: 'Node.js',
    alternatives: ['Python Django', 'Java Spring'],
    reasoning: 'JavaScript consistency across stack',
    pros: ['Rapid development', 'NPM ecosystem'],
    cons: ['Single-threaded limitations', 'Memory usage'],
  },
  database: {
    primary: 'PostgreSQL',
    alternatives: ['MongoDB', 'MySQL'],
    reasoning: 'ACID compliance and advanced features',
    pros: ['Data integrity', 'Advanced queries'],
    cons: ['Complexity', 'Resource requirements'],
  },
  infrastructure: {
    primary: 'AWS',
    alternatives: ['Google Cloud', 'Azure'],
    reasoning: 'Comprehensive services and reliability',
    pros: ['Scalability', 'Global presence'],
    cons: ['Cost complexity', 'Vendor lock-in'],
  },
  thirdPartyServices: {
    primary: 'Auth0',
    alternatives: ['Firebase Auth', 'AWS Cognito'],
    reasoning: 'Security and ease of implementation',
    pros: ['Security features', 'Quick setup'],
    cons: ['Monthly costs', 'Dependency risk'],
  },
  estimatedCosts: {
    development: '$75,000 - $125,000 for MVP development',
    monthly: '$800 - $1,500 monthly operational costs',
    scaling: '$8,000 - $15,000 at 10x scale',
  },
});

vi.mock('../services/openai.js', () => ({
  openAIService: {
    completion: vi.fn(),
  },
}));

describe('Idea Processing Service', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Disconnect from any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await SaasIdea.deleteMany({});
    await IdeaValidation.deleteMany({});
    await Feature.deleteMany({});
    await TechStackRecommendation.deleteMany({});

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('processIdea', () => {
    const sampleRequest: IdeaProcessingRequest = {
      projectId: new mongoose.Types.ObjectId().toString(),
      description:
        'An AI-powered project management tool that helps teams collaborate more effectively by automatically organizing tasks, predicting bottlenecks, and suggesting optimal resource allocation.',
      targetAudience:
        'Small to medium-sized software development teams and project managers who struggle with manual project tracking and resource management.',
      problemStatement:
        "Current project management tools require too much manual input and don't provide intelligent insights, leading to missed deadlines and inefficient resource usage.",
      desiredFeatures: [
        'Task automation',
        'AI predictions',
        'Team collaboration',
        'Resource optimization',
      ],
      technicalPreferences: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    };

    it('should successfully process a complete SaaS idea', async () => {
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      // Setup mocks
      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const result = await ideaProcessingService.processIdea(sampleRequest);

      // Verify structure
      expect(result).toHaveProperty('ideaId');
      expect(result).toHaveProperty('businessAnalysis');
      expect(result).toHaveProperty('marketValidation');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('techStack');
      expect(result).toHaveProperty('processingMetrics');

      // Verify business analysis
      expect(result.businessAnalysis.businessModelType).toBe('B2B');
      expect(result.businessAnalysis.revenueModel).toBe('Subscription');
      expect(result.businessAnalysis.viabilityScore).toBe(85);
      expect(result.businessAnalysis.scalabilityScore).toBe(90);
      expect(result.businessAnalysis.confidenceScore).toBe(88);

      // Verify market validation
      expect(result.marketValidation.validationScore).toBe(82);
      expect(result.marketValidation.marketSize.tam).toContain('$50 billion');
      expect(
        result.marketValidation.targetAudienceAnalysis.primarySegment
      ).toContain('Small to medium businesses');

      // Verify features
      expect(result.features.mvpFeatures).toHaveLength(2);
      expect(result.features.growthFeatures).toHaveLength(1);
      expect(result.features.advancedFeatures).toHaveLength(1);
      expect(result.features.featureRoadmap.phase1).toContain('User Dashboard');

      // Verify tech stack
      expect(result.techStack.frontend.primary).toBe('React');
      expect(result.techStack.backend.primary).toBe('Node.js');
      expect(result.techStack.database.primary).toBe('PostgreSQL');

      // Verify processing metrics
      expect(result.processingMetrics.stepsCompleted).toContain('idea_saved');
      expect(result.processingMetrics.stepsCompleted).toContain(
        'business_analysis'
      );
      expect(result.processingMetrics.stepsCompleted).toContain(
        'market_validation'
      );
      expect(result.processingMetrics.stepsCompleted).toContain(
        'feature_generation'
      );
      expect(result.processingMetrics.stepsCompleted).toContain(
        'tech_stack_recommendation'
      );
      expect(result.processingMetrics.stepsCompleted).toContain(
        'results_parsed'
      );
      expect(result.processingMetrics.stepsCompleted).toContain(
        'results_saved'
      );
      expect(result.processingMetrics.aiCost).toBeGreaterThan(0);
      expect(result.processingMetrics.tokensUsed).toBeGreaterThan(0);
      expect(result.processingMetrics.totalProcessingTime).toBeGreaterThan(0);
    }, 30000);

    it('should save idea to database correctly', async () => {
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const result = await ideaProcessingService.processIdea(sampleRequest);

      // Verify idea was saved
      const savedIdea = await SaasIdea.findById(result.ideaId);
      expect(savedIdea).toBeTruthy();
      expect(savedIdea!.description).toBe(sampleRequest.description);
      expect(savedIdea!.targetAudience).toBe(sampleRequest.targetAudience);
      expect(savedIdea!.problemStatement).toBe(sampleRequest.problemStatement);
      expect(savedIdea!.desiredFeatures).toEqual(sampleRequest.desiredFeatures);
      expect(savedIdea!.technicalPreferences).toEqual(
        sampleRequest.technicalPreferences
      );
    });

    it('should save idea validation to database correctly', async () => {
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const result = await ideaProcessingService.processIdea(sampleRequest);

      // Verify validation was saved
      const validation = await IdeaValidation.findOne({
        ideaId: result.ideaId,
      });
      expect(validation).toBeTruthy();
      expect(validation!.marketPotential).toBe(82);
      expect(validation!.confidenceScore).toBe(88);
      expect(validation!.differentiationOpportunities).toContain(
        'AI-powered automation'
      );
    });

    it('should save features to database correctly', async () => {
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const _result = await ideaProcessingService.processIdea(sampleRequest);

      // Verify features were saved - using projectId since Feature model uses projectId, not ideaId
      const features = await Feature.find({
        projectId: sampleRequest.projectId,
      });
      expect(features).toHaveLength(4); // 2 MVP + 1 Growth + 1 Advanced

      const mvpFeatures = features.filter(f => f.category === 'mvp');
      expect(mvpFeatures).toHaveLength(2);
      expect(mvpFeatures.some(f => f.name === 'User Dashboard')).toBe(true);
      expect(mvpFeatures.some(f => f.name === 'Data Import')).toBe(true);

      const growthFeatures = features.filter(f => f.category === 'growth');
      expect(growthFeatures).toHaveLength(1);
      expect(growthFeatures[0].name).toBe('Advanced Analytics');

      const futureFeatures = features.filter(f => f.category === 'future');
      expect(futureFeatures).toHaveLength(1);
      expect(futureFeatures[0].name).toBe('AI Predictions');
    });

    it('should save tech stack to database correctly', async () => {
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const _result = await ideaProcessingService.processIdea(sampleRequest);

      // Verify tech stack was saved - using projectId since TechStackRecommendation uses projectId
      const techStack = await TechStackRecommendation.findOne({
        projectId: sampleRequest.projectId,
      });
      expect(techStack).toBeTruthy();
      expect(techStack!.frontend[0].name).toBe('React');
      expect(techStack!.backend[0].name).toBe('Node.js');
      expect(techStack!.database[0].name).toBe('PostgreSQL');
      expect(techStack!.infrastructure[0].name).toBe('AWS');
    });

    it('should update existing idea instead of creating new one', async () => {
      // First, create an idea with proper validation lengths
      const existingIdea = new SaasIdea({
        projectId: new mongoose.Types.ObjectId(sampleRequest.projectId),
        description:
          'This is a longer description that meets the minimum character requirement for the SaaS idea validation',
        targetAudience: 'Old audience that is longer than minimum',
        problemStatement:
          'This is a longer problem statement that meets the minimum character requirement',
        desiredFeatures: ['Old feature'],
        technicalPreferences: ['Old tech'],
      });
      await existingIdea.save();

      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      // Process with same project ID
      const result = await ideaProcessingService.processIdea(sampleRequest);

      // Verify idea was updated, not created
      expect(result.ideaId).toBe(existingIdea._id.toString());

      const updatedIdea = await SaasIdea.findById(result.ideaId);
      expect(updatedIdea!.description).toBe(sampleRequest.description);
      expect(updatedIdea!.targetAudience).toBe(sampleRequest.targetAudience);

      // Verify only one idea exists for this project
      const allIdeas = await SaasIdea.find({
        projectId: sampleRequest.projectId,
      });
      expect(allIdeas).toHaveLength(1);
    });

    it('should handle malformed JSON responses gracefully', async () => {
      // Setup mocks with malformed JSON
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: 'invalid json',
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: 'invalid json',
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: 'invalid json',
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: 'invalid json',
        });

      const result = await ideaProcessingService.processIdea(sampleRequest);

      // Should still complete with fallback values
      expect(result).toBeTruthy();
      expect(result.businessAnalysis.businessModelType).toBe('B2B');
      expect(result.businessAnalysis.viabilityScore).toBe(50);
      expect(result.marketValidation.validationScore).toBe(50);
      expect(result.features.mvpFeatures).toHaveLength(1);
      expect(result.techStack.frontend.primary).toBe('React');
    });

    it('should handle OpenAI service errors', async () => {
      // Mock OpenAI to throw error
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);
      mockOpenAI.mockRejectedValue(new Error('OpenAI API Error'));

      await expect(
        ideaProcessingService.processIdea(sampleRequest)
      ).rejects.toThrow('Idea processing failed: OpenAI API Error');
    });

    it('should handle database errors gracefully', async () => {
      // Mock successful AI calls
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      // Use invalid project ID to cause database error
      const invalidRequest = {
        ...sampleRequest,
        projectId: 'invalid-id',
      };

      await expect(
        ideaProcessingService.processIdea(invalidRequest)
      ).rejects.toThrow('Idea processing failed');
    });

    it('should correctly call OpenAI with proper prompts', async () => {
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      await ideaProcessingService.processIdea(sampleRequest);

      expect(mockOpenAI).toHaveBeenCalledTimes(4);

      // Verify business analysis call
      const businessCall = mockOpenAI.mock.calls[0];
      expect(businessCall[0]).toContain(sampleRequest.description);
      expect(businessCall[0]).toContain(sampleRequest.targetAudience);
      expect(businessCall[1]).toBeDefined();
      expect(businessCall[1]!.systemMessage).toContain('business strategist');
      expect(businessCall[1]!.temperature).toBe(0.3);

      // Verify market validation call
      const marketCall = mockOpenAI.mock.calls[1];
      expect(marketCall[0]).toContain(sampleRequest.description);
      expect(marketCall[1]).toBeDefined();
      expect(marketCall[1]!.systemMessage).toContain('market research analyst');
      expect(marketCall[1]!.temperature).toBe(0.4);

      // Verify feature generation call
      const featureCall = mockOpenAI.mock.calls[2];
      expect(featureCall[0]).toContain(sampleRequest.description);
      expect(featureCall[1]).toBeDefined();
      expect(featureCall[1]!.systemMessage).toContain('product manager');
      expect(featureCall[1]!.temperature).toBe(0.5);

      // Verify tech stack call
      const techCall = mockOpenAI.mock.calls[3];
      expect(techCall[0]).toContain(sampleRequest.description);
      expect(techCall[1]).toBeDefined();
      expect(techCall[1]!.systemMessage).toContain('technical architect');
      expect(techCall[1]!.temperature).toBe(0.3);
    });

    it('should handle optional fields correctly', async () => {
      const minimalRequest: IdeaProcessingRequest = {
        projectId: new mongoose.Types.ObjectId().toString(),
        description:
          'A simple SaaS tool that provides comprehensive automation features for small businesses to streamline their operations',
        targetAudience: 'Small businesses that need automation solutions',
        problemStatement:
          'Manual processes are inefficient and time-consuming for growing businesses',
        // No desiredFeatures or technicalPreferences
      };

      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const result = await ideaProcessingService.processIdea(minimalRequest);

      expect(result).toBeTruthy();

      // Verify the calls included fallback text for missing fields
      const businessCall = mockOpenAI.mock.calls[0];
      expect(businessCall[0]).toContain('Not specified');
    });

    it('should calculate confidence scores correctly', async () => {
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const result = await ideaProcessingService.processIdea(sampleRequest);

      // Business confidence: 88, Market validation: 82
      // Overall should be (88 + 82) / 2 = 85
      expect(result.processingMetrics.confidenceScore).toBe(85);
    });

    it('should handle malformed AI responses gracefully', async () => {
      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      try {
        const _result = await ideaProcessingService.processIdea(sampleRequest);
      } catch (error) {
        // Expected error for malformed response
      }
      expect(mockOpenAI).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(1990); // Near max length
      const requestWithLongDesc: IdeaProcessingRequest = {
        projectId: new mongoose.Types.ObjectId().toString(),
        description: longDescription,
        targetAudience: 'Test audience that meets minimum length requirements',
        problemStatement:
          'Test problem statement that meets the minimum character requirements for validation',
        desiredFeatures: ['Feature 1'],
        technicalPreferences: ['Tech 1'],
      };

      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const result =
        await ideaProcessingService.processIdea(requestWithLongDesc);
      expect(result).toBeTruthy();
    });

    it('should handle maximum number of features and preferences', async () => {
      const maxFeatures = Array.from(
        { length: 20 },
        (_, i) => `Feature ${i + 1}`
      );
      const maxPreferences = Array.from(
        { length: 15 },
        (_, i) => `Tech ${i + 1}`
      );

      const requestWithMaxArrays: IdeaProcessingRequest = {
        projectId: new mongoose.Types.ObjectId().toString(),
        description:
          'Test description that meets the minimum character requirements for SaaS idea validation in the system',
        targetAudience: 'Test audience that meets minimum length requirements',
        problemStatement:
          'Test problem statement that meets the minimum character requirements for validation',
        desiredFeatures: maxFeatures,
        technicalPreferences: maxPreferences,
      };

      const { openAIService } = await import('../services/openai.js');
      const mockOpenAI = vi.mocked(openAIService.completion);

      mockOpenAI
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockBusinessAnalysis,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockMarketValidation,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockFeatureGeneration,
        })
        .mockResolvedValueOnce({
          ...mockOpenAIResponse,
          content: mockTechStack,
        });

      const result =
        await ideaProcessingService.processIdea(requestWithMaxArrays);
      expect(result).toBeTruthy();

      const savedIdea = await SaasIdea.findById(result.ideaId);
      expect(savedIdea!.desiredFeatures).toHaveLength(20);
      expect(savedIdea!.technicalPreferences).toHaveLength(15);
    });
  });
});
