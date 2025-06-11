import mongoose from 'mongoose';
import { openAIService, OpenAIResponse } from './openai.js';
import { SaasIdea, ISaasIdea } from '../models/SaasIdea.js';
import { IdeaValidation } from '../models/IdeaValidation.js';
import { Feature } from '../models/Feature.js';
import { TechStackRecommendation } from '../models/TechStackRecommendation.js';

export interface IdeaProcessingRequest {
  projectId: string;
  description: string;
  targetAudience: string;
  problemStatement: string;
  desiredFeatures?: string[];
  technicalPreferences?: string[];
}

export interface ProcessedIdeaResult {
  ideaId: string;
  businessAnalysis: BusinessAnalysisResult;
  marketValidation: MarketValidationResult;
  features: FeatureGenerationResult;
  techStack: TechStackResult;
  processingMetrics: ProcessingMetrics;
}

export interface BusinessAnalysisResult {
  businessModelType: 'B2B' | 'B2C' | 'B2B2C' | 'Marketplace' | 'Platform';
  revenueModel:
    | 'Subscription'
    | 'Freemium'
    | 'Usage-Based'
    | 'One-Time'
    | 'Hybrid';
  viabilityScore: number; // 0-100
  scalabilityScore: number; // 0-100
  competitiveLandscape: {
    competitionLevel: 'Low' | 'Medium' | 'High';
    marketSaturation: number; // 0-100
    differentiation: string[];
  };
  confidenceScore: number; // 0-100
}

export interface MarketValidationResult {
  marketSize: {
    tam: string; // Total Addressable Market
    sam: string; // Serviceable Addressable Market
    som: string; // Serviceable Obtainable Market
  };
  targetAudienceAnalysis: {
    primarySegment: string;
    secondarySegments: string[];
    painPoints: string[];
    willingnessToPay: string;
    acquisitionChannels: string[];
  };
  riskAssessment: {
    marketRisks: string[];
    technicalRisks: string[];
    financialRisks: string[];
    competitiveRisks: string[];
  };
  validationScore: number; // 0-100
}

export interface FeatureGenerationResult {
  mvpFeatures: ProcessedFeature[];
  growthFeatures: ProcessedFeature[];
  advancedFeatures: ProcessedFeature[];
  featureRoadmap: {
    phase1: string[]; // MVP (0-3 months)
    phase2: string[]; // Growth (3-12 months)
    phase3: string[]; // Advanced (12+ months)
  };
}

export interface ProcessedFeature {
  name: string;
  description: string;
  userStory: string;
  priority: number; // 1-10
  effort: 'S' | 'M' | 'L' | 'XL';
  dependencies: string[];
  successMetrics: string[];
}

export interface TechStackResult {
  frontend: TechStackComponent;
  backend: TechStackComponent;
  database: TechStackComponent;
  infrastructure: TechStackComponent;
  thirdPartyServices: TechStackComponent;
  estimatedCosts: {
    development: string;
    monthly: string;
    scaling: string;
  };
}

export interface TechStackComponent {
  primary: string;
  alternatives: string[];
  reasoning: string;
  pros: string[];
  cons: string[];
}

export interface ProcessingMetrics {
  totalProcessingTime: number; // milliseconds
  aiCost: number; // USD
  tokensUsed: number;
  stepsCompleted: string[];
  confidenceScore: number; // Overall 0-100
}

export class IdeaProcessingService {
  /**
   * Main entry point for processing a SaaS idea
   */
  async processIdea(
    request: IdeaProcessingRequest
  ): Promise<ProcessedIdeaResult> {
    const startTime = Date.now();
    const stepsCompleted: string[] = [];
    let totalCost = 0;
    let totalTokens = 0;

    console.log(
      `🚀 Starting idea processing for project: ${request.projectId}`
    );

    try {
      // Step 1: Save the raw idea to database
      const savedIdea = await this.saveIdeaToDatabase(request);
      stepsCompleted.push('idea_saved');
      console.log(`✅ Step 1: Idea saved with ID: ${savedIdea._id}`);

      // Step 2: Business model analysis
      const businessAnalysis = await this.analyzeBusinessModel(request);
      totalCost += businessAnalysis.cost;
      totalTokens += businessAnalysis.tokensUsed;
      stepsCompleted.push('business_analysis');
      console.log(
        `✅ Step 2: Business analysis complete (${businessAnalysis.processingTime}ms)`
      );

      // Step 3: Market validation
      const marketValidation = await this.validateMarket(
        request,
        businessAnalysis.content
      );
      totalCost += marketValidation.cost;
      totalTokens += marketValidation.tokensUsed;
      stepsCompleted.push('market_validation');
      console.log(
        `✅ Step 3: Market validation complete (${marketValidation.processingTime}ms)`
      );

      // Step 4: Feature generation
      const featureGeneration = await this.generateFeatures(
        request,
        businessAnalysis.content
      );
      totalCost += featureGeneration.cost;
      totalTokens += featureGeneration.tokensUsed;
      stepsCompleted.push('feature_generation');
      console.log(
        `✅ Step 4: Feature generation complete (${featureGeneration.processingTime}ms)`
      );

      // Step 5: Tech stack recommendation
      const techStackRecommendation = await this.recommendTechStack(
        request,
        featureGeneration.content
      );
      totalCost += techStackRecommendation.cost;
      totalTokens += techStackRecommendation.tokensUsed;
      stepsCompleted.push('tech_stack_recommendation');
      console.log(
        `✅ Step 5: Tech stack recommendation complete (${techStackRecommendation.processingTime}ms)`
      );

      // Step 6: Parse and structure results
      const businessResult = this.parseBusinessAnalysis(
        businessAnalysis.content
      );
      const marketResult = this.parseMarketValidation(marketValidation.content);
      const featuresResult = this.parseFeatureGeneration(
        featureGeneration.content
      );
      const techStackResult = this.parseTechStackRecommendation(
        techStackRecommendation.content
      );
      stepsCompleted.push('results_parsed');

      // Step 7: Save structured results to database
      await this.saveProcessingResults(savedIdea._id.toString(), {
        businessResult,
        marketResult,
        featuresResult,
        techStackResult,
      });
      stepsCompleted.push('results_saved');

      const totalProcessingTime = Date.now() - startTime;
      console.log(
        `🎉 Idea processing complete! Total time: ${totalProcessingTime}ms, Cost: $${totalCost.toFixed(4)}`
      );

      return {
        ideaId: savedIdea._id.toString(),
        businessAnalysis: businessResult,
        marketValidation: marketResult,
        features: featuresResult,
        techStack: techStackResult,
        processingMetrics: {
          totalProcessingTime,
          aiCost: totalCost,
          tokensUsed: totalTokens,
          stepsCompleted,
          confidenceScore: this.calculateOverallConfidence(
            businessResult,
            marketResult
          ),
        },
      };
    } catch (error) {
      console.error(`❌ Idea processing failed:`, error);
      throw new Error(
        `Idea processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate if a string is a valid MongoDB ObjectId
   */
  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Save the raw idea to the database
   */
  private async saveIdeaToDatabase(
    request: IdeaProcessingRequest
  ): Promise<ISaasIdea> {
    // Validate projectId before creating ObjectId
    if (!this.isValidObjectId(request.projectId)) {
      throw new Error(
        'Invalid project ID format. Must be a 24-character hex string.'
      );
    }

    const ideaData = {
      projectId: new mongoose.Types.ObjectId(request.projectId),
      description: request.description,
      targetAudience: request.targetAudience,
      problemStatement: request.problemStatement,
      desiredFeatures: request.desiredFeatures || [],
      technicalPreferences: request.technicalPreferences || [],
    };

    // Check if idea already exists for this project
    const existingIdea = await SaasIdea.findOne({
      projectId: ideaData.projectId,
    });
    if (existingIdea) {
      // Update existing idea
      Object.assign(existingIdea, ideaData);
      return await existingIdea.save();
    } else {
      // Create new idea
      const newIdea = new SaasIdea(ideaData);
      return await newIdea.save();
    }
  }

  /**
   * Analyze business model with advanced prompting
   */
  private async analyzeBusinessModel(
    request: IdeaProcessingRequest
  ): Promise<OpenAIResponse> {
    const systemMessage = `You are an expert business strategist and SaaS consultant with 15+ years of experience analyzing technology startups. Your task is to perform a comprehensive business model analysis.

Analyze the business model considering:
1. Business Model Type (B2B, B2C, B2B2C, Marketplace, Platform)
2. Revenue Model (Subscription, Freemium, Usage-Based, One-Time, Hybrid)
3. Viability Score (0-100 based on market demand, execution complexity, revenue potential)
4. Scalability Score (0-100 based on technical scalability and business model scaling)
5. Competitive Landscape (competition level, market saturation, differentiation opportunities)

Provide response in this exact JSON format:
{
  "businessModelType": "B2B|B2C|B2B2C|Marketplace|Platform",
  "revenueModel": "Subscription|Freemium|Usage-Based|One-Time|Hybrid",
  "viabilityScore": number,
  "scalabilityScore": number,
  "competitiveLandscape": {
    "competitionLevel": "Low|Medium|High",
    "marketSaturation": number,
    "differentiation": ["point1", "point2", "point3"]
  },
  "confidenceScore": number,
  "reasoning": {
    "businessModelJustification": "detailed explanation",
    "revenueModelRationale": "detailed explanation",
    "viabilityFactors": ["factor1", "factor2", "factor3"],
    "scalabilityFactors": ["factor1", "factor2", "factor3"],
    "competitiveAdvantages": ["advantage1", "advantage2"],
    "potentialChallenges": ["challenge1", "challenge2"]
  }
}`;

    const prompt = `Analyze this SaaS business idea:

**Description:** ${request.description}

**Target Audience:** ${request.targetAudience}

**Problem Statement:** ${request.problemStatement}

**Desired Features:** ${request.desiredFeatures?.join(', ') || 'Not specified'}

**Technical Preferences:** ${request.technicalPreferences?.join(', ') || 'Not specified'}

Provide a comprehensive business model analysis with confidence scores and detailed reasoning.`;

    return await openAIService.completion(prompt, {
      systemMessage,
      maxTokens: 1500,
      temperature: 0.3, // Lower temperature for more analytical response
    });
  }

  /**
   * Validate market opportunity with comprehensive analysis
   */
  private async validateMarket(
    request: IdeaProcessingRequest,
    businessAnalysis: string
  ): Promise<OpenAIResponse> {
    const systemMessage = `You are a senior market research analyst and venture capital partner specializing in SaaS market validation. Your expertise includes market sizing, competitive analysis, and customer segmentation.

Perform comprehensive market validation including:
1. Market Size Analysis (TAM, SAM, SOM estimates)
2. Target Audience Deep Dive (segments, pain points, willingness to pay)
3. Risk Assessment (market, technical, financial, competitive risks)
4. Validation Score (0-100 based on market opportunity and execution feasibility)

Consider the business analysis context: ${businessAnalysis.substring(0, 500)}

Provide response in this exact JSON format:
{
  "marketSize": {
    "tam": "Total Addressable Market estimate",
    "sam": "Serviceable Addressable Market estimate", 
    "som": "Serviceable Obtainable Market estimate"
  },
  "targetAudienceAnalysis": {
    "primarySegment": "detailed description",
    "secondarySegments": ["segment1", "segment2"],
    "painPoints": ["pain1", "pain2", "pain3"],
    "willingnessToPay": "price range and justification",
    "acquisitionChannels": ["channel1", "channel2", "channel3"]
  },
  "riskAssessment": {
    "marketRisks": ["risk1", "risk2"],
    "technicalRisks": ["risk1", "risk2"],
    "financialRisks": ["risk1", "risk2"],
    "competitiveRisks": ["risk1", "risk2"]
  },
  "validationScore": number,
  "keyInsights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}`;

    const prompt = `Validate the market opportunity for this SaaS idea:

**Description:** ${request.description}

**Target Audience:** ${request.targetAudience}

**Problem Statement:** ${request.problemStatement}

**Business Context:** ${businessAnalysis.substring(0, 300)}

Provide comprehensive market validation with specific data points and actionable insights.`;

    return await openAIService.completion(prompt, {
      systemMessage,
      maxTokens: 1800,
      temperature: 0.4,
    });
  }

  /**
   * Generate comprehensive feature roadmap
   */
  private async generateFeatures(
    request: IdeaProcessingRequest,
    businessContext: string
  ): Promise<OpenAIResponse> {
    const systemMessage = `You are a senior product manager with extensive experience in SaaS product development and feature prioritization. You excel at breaking down complex ideas into actionable feature sets.

Generate a comprehensive feature roadmap with:
1. MVP Features (essential for initial launch)
2. Growth Features (drive user acquisition and retention)
3. Advanced Features (market leadership and differentiation)
4. Feature Roadmap (phased implementation timeline)

For each feature include: name, description, user story, priority (1-10), effort (S/M/L/XL), dependencies, success metrics.

Consider business context: ${businessContext.substring(0, 400)}

Provide response in this exact JSON format:
{
  "mvpFeatures": [
    {
      "name": "feature name",
      "description": "detailed description",
      "userStory": "As a [user], I want [goal] so that [benefit]",
      "priority": number,
      "effort": "S|M|L|XL",
      "dependencies": ["dependency1", "dependency2"],
      "successMetrics": ["metric1", "metric2"]
    }
  ],
  "growthFeatures": [...],
  "advancedFeatures": [...],
  "featureRoadmap": {
    "phase1": ["MVP feature names for 0-3 months"],
    "phase2": ["Growth feature names for 3-12 months"],
    "phase3": ["Advanced feature names for 12+ months"]
  },
  "developmentGuidance": {
    "mvpTimeline": "estimated timeline",
    "keyMilestones": ["milestone1", "milestone2"],
    "riskFactors": ["risk1", "risk2"],
    "successCriteria": ["criteria1", "criteria2"]
  }
}`;

    const prompt = `Generate features for this SaaS idea:

**Description:** ${request.description}

**Target Audience:** ${request.targetAudience}

**Problem Statement:** ${request.problemStatement}

**Desired Features:** ${request.desiredFeatures?.join(', ') || 'Not specified'}

**Business Context:** ${businessContext.substring(0, 300)}

Create a comprehensive feature roadmap with clear priorities and implementation guidance.`;

    return await openAIService.completion(prompt, {
      systemMessage,
      maxTokens: 2000,
      temperature: 0.5,
    });
  }

  /**
   * Recommend comprehensive tech stack
   */
  private async recommendTechStack(
    request: IdeaProcessingRequest,
    featuresContext: string
  ): Promise<OpenAIResponse> {
    const systemMessage = `You are a senior technical architect and CTO with 15+ years of experience building scalable SaaS platforms. You specialize in technology selection, architecture design, and cost optimization.

Recommend a comprehensive tech stack considering:
1. Frontend Technologies (framework, UI libraries, state management)
2. Backend Technologies (runtime, framework, databases, APIs)
3. Infrastructure (hosting, CDN, monitoring, security)
4. Third-party Services (auth, payments, analytics, communication)
5. Cost Estimates (development, monthly operations, scaling costs)

Consider features context: ${featuresContext.substring(0, 400)}

Provide response in this exact JSON format:
{
  "frontend": {
    "primary": "main technology",
    "alternatives": ["alt1", "alt2"],
    "reasoning": "detailed explanation",
    "pros": ["pro1", "pro2"],
    "cons": ["con1", "con2"]
  },
  "backend": {...},
  "database": {...},
  "infrastructure": {...},
  "thirdPartyServices": {...},
  "estimatedCosts": {
    "development": "cost range and timeline",
    "monthly": "monthly operational costs",
    "scaling": "costs at scale (10x, 100x users)"
  },
  "architectureRecommendations": {
    "scalabilityConsiderations": ["consideration1", "consideration2"],
    "securityRequirements": ["requirement1", "requirement2"],
    "performanceOptimizations": ["optimization1", "optimization2"],
    "futureProofing": ["strategy1", "strategy2"]
  }
}`;

    const techPreferences = request.technicalPreferences?.length
      ? `Technical Preferences: ${request.technicalPreferences.join(', ')}`
      : '';

    const prompt = `Recommend a tech stack for this SaaS idea:

**Description:** ${request.description}

**Target Audience:** ${request.targetAudience}

${techPreferences}

**Key Features Context:** ${featuresContext.substring(0, 400)}

Provide detailed technology recommendations with cost analysis and architecture guidance.`;

    return await openAIService.completion(prompt, {
      systemMessage,
      maxTokens: 1800,
      temperature: 0.3,
    });
  }

  /**
   * Parse business analysis JSON response
   */
  private parseBusinessAnalysis(aiResponse: string): BusinessAnalysisResult {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        businessModelType: parsed.businessModelType || 'B2B',
        revenueModel: parsed.revenueModel || 'Subscription',
        viabilityScore: parsed.viabilityScore || 0,
        scalabilityScore: parsed.scalabilityScore || 0,
        competitiveLandscape: {
          competitionLevel:
            parsed.competitiveLandscape?.competitionLevel || 'Medium',
          marketSaturation: parsed.competitiveLandscape?.marketSaturation || 50,
          differentiation: parsed.competitiveLandscape?.differentiation || [],
        },
        confidenceScore: parsed.confidenceScore || 0,
      };
    } catch (error) {
      console.warn('Failed to parse business analysis JSON, using fallback');
      return this.createFallbackBusinessAnalysis();
    }
  }

  /**
   * Parse market validation JSON response
   */
  private parseMarketValidation(aiResponse: string): MarketValidationResult {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        marketSize: {
          tam: parsed.marketSize?.tam || 'Not determined',
          sam: parsed.marketSize?.sam || 'Not determined',
          som: parsed.marketSize?.som || 'Not determined',
        },
        targetAudienceAnalysis: {
          primarySegment:
            parsed.targetAudienceAnalysis?.primarySegment || 'Not specified',
          secondarySegments:
            parsed.targetAudienceAnalysis?.secondarySegments || [],
          painPoints: parsed.targetAudienceAnalysis?.painPoints || [],
          willingnessToPay:
            parsed.targetAudienceAnalysis?.willingnessToPay || 'Not determined',
          acquisitionChannels:
            parsed.targetAudienceAnalysis?.acquisitionChannels || [],
        },
        riskAssessment: {
          marketRisks: parsed.riskAssessment?.marketRisks || [],
          technicalRisks: parsed.riskAssessment?.technicalRisks || [],
          financialRisks: parsed.riskAssessment?.financialRisks || [],
          competitiveRisks: parsed.riskAssessment?.competitiveRisks || [],
        },
        validationScore: parsed.validationScore || 0,
      };
    } catch (error) {
      console.warn('Failed to parse market validation JSON, using fallback');
      return this.createFallbackMarketValidation();
    }
  }

  /**
   * Parse feature generation JSON response
   */
  private parseFeatureGeneration(aiResponse: string): FeatureGenerationResult {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        mvpFeatures: parsed.mvpFeatures || [],
        growthFeatures: parsed.growthFeatures || [],
        advancedFeatures: parsed.advancedFeatures || [],
        featureRoadmap: {
          phase1: parsed.featureRoadmap?.phase1 || [],
          phase2: parsed.featureRoadmap?.phase2 || [],
          phase3: parsed.featureRoadmap?.phase3 || [],
        },
      };
    } catch (error) {
      console.warn('Failed to parse feature generation JSON, using fallback');
      return this.createFallbackFeatureGeneration();
    }
  }

  /**
   * Parse tech stack recommendation JSON response
   */
  private parseTechStackRecommendation(aiResponse: string): TechStackResult {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        frontend: this.parseTechComponent(parsed.frontend),
        backend: this.parseTechComponent(parsed.backend),
        database: this.parseTechComponent(parsed.database),
        infrastructure: this.parseTechComponent(parsed.infrastructure),
        thirdPartyServices: this.parseTechComponent(parsed.thirdPartyServices),
        estimatedCosts: {
          development: parsed.estimatedCosts?.development || 'Not estimated',
          monthly: parsed.estimatedCosts?.monthly || 'Not estimated',
          scaling: parsed.estimatedCosts?.scaling || 'Not estimated',
        },
      };
    } catch (error) {
      console.warn('Failed to parse tech stack JSON, using fallback');
      return this.createFallbackTechStack();
    }
  }

  /**
   * Helper to parse tech stack component
   */
  private parseTechComponent(component: unknown): TechStackComponent {
    if (typeof component === 'object' && component !== null) {
      const comp = component as Record<string, unknown>;
      return {
        primary: String(comp.primary || ''),
        alternatives: Array.isArray(comp.alternatives)
          ? comp.alternatives.map(String)
          : [],
        reasoning: String(comp.reasoning || ''),
        pros: Array.isArray(comp.pros) ? comp.pros.map(String) : [],
        cons: Array.isArray(comp.cons) ? comp.cons.map(String) : [],
      };
    }
    return {
      primary: '',
      alternatives: [],
      reasoning: '',
      pros: [],
      cons: [],
    };
  }

  /**
   * Save structured processing results to database
   */
  private async saveProcessingResults(
    ideaId: string,
    results: {
      businessResult: BusinessAnalysisResult;
      marketResult: MarketValidationResult;
      featuresResult: FeatureGenerationResult;
      techStackResult: TechStackResult;
    }
  ): Promise<void> {
    // Save to IdeaValidation collection
    const validationData = {
      ideaId: new mongoose.Types.ObjectId(ideaId),
      marketPotential: results.marketResult.validationScore,
      similarProducts: [], // Could be extracted from market analysis
      differentiationOpportunities:
        results.businessResult.competitiveLandscape.differentiation,
      risks: this.formatRisksForDatabase(results.marketResult.riskAssessment),
      confidenceScore: results.businessResult.confidenceScore,
      improvementSuggestions: [], // Could be extracted from recommendations
    };

    await IdeaValidation.findOneAndUpdate(
      { ideaId: validationData.ideaId },
      validationData,
      { upsert: true, new: true }
    );

    // Save features to Feature collection
    await this.saveFeaturesToDatabase(ideaId, results.featuresResult);

    // Save tech stack to TechStackRecommendation collection
    await this.saveTechStackToDatabase(ideaId, results.techStackResult);
  }

  /**
   * Save features to database
   */
  private async saveFeaturesToDatabase(
    ideaId: string,
    features: FeatureGenerationResult
  ): Promise<void> {
    const allFeatures = [
      ...features.mvpFeatures.map(f => ({ ...f, category: 'mvp' as const })),
      ...features.growthFeatures.map(f => ({
        ...f,
        category: 'growth' as const,
      })),
      ...features.advancedFeatures.map(f => ({
        ...f,
        category: 'future' as const,
      })),
    ];

    // Get projectId from the saved idea
    const savedIdea = await SaasIdea.findById(ideaId);
    if (!savedIdea) {
      throw new Error('Saved idea not found');
    }
    const projectId = savedIdea.projectId;

    // Delete existing features for this project
    await Feature.deleteMany({ projectId: projectId });

    // Insert new features
    const featureDocuments = allFeatures.map(feature => ({
      projectId: projectId,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      priority: this.mapPriorityToEnum(feature.priority),
      complexity: Math.min(Math.max(feature.priority, 1), 10), // Map priority 1-10 to complexity 1-10
      userPersona: 'Primary User', // Default user persona
    }));

    if (featureDocuments.length > 0) {
      await Feature.insertMany(featureDocuments);
    }
  }

  /**
   * Map priority number to priority enum
   */
  private mapPriorityToEnum(
    priority: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (priority >= 9) return 'critical';
    if (priority >= 7) return 'high';
    if (priority >= 5) return 'medium';
    return 'low';
  }

  /**
   * Save tech stack to database
   */
  private async saveTechStackToDatabase(
    ideaId: string,
    techStack: TechStackResult
  ): Promise<void> {
    // Get projectId from the saved idea
    const savedIdea = await SaasIdea.findById(ideaId);
    if (!savedIdea) {
      throw new Error('Saved idea not found');
    }
    const projectId = savedIdea.projectId;

    const techStackData = {
      projectId: projectId,
      frontend: [
        {
          name: techStack.frontend.primary,
          description: techStack.frontend.reasoning,
          pros: techStack.frontend.pros,
          cons: techStack.frontend.cons,
          difficulty: 'intermediate' as const,
          cost: 'free' as const,
          popularity: 85,
        },
      ],
      backend: [
        {
          name: techStack.backend.primary,
          description: techStack.backend.reasoning,
          pros: techStack.backend.pros,
          cons: techStack.backend.cons,
          difficulty: 'intermediate' as const,
          cost: 'free' as const,
          popularity: 80,
        },
      ],
      database: [
        {
          name: techStack.database.primary,
          description: techStack.database.reasoning,
          pros: techStack.database.pros,
          cons: techStack.database.cons,
          difficulty: 'intermediate' as const,
          cost: 'free' as const,
          popularity: 75,
        },
      ],
      infrastructure: [
        {
          name: techStack.infrastructure.primary,
          description: techStack.infrastructure.reasoning,
          pros: techStack.infrastructure.pros,
          cons: techStack.infrastructure.cons,
          difficulty: 'advanced' as const,
          cost: 'medium' as const,
          popularity: 90,
        },
      ],
      thirdPartyServices: [
        {
          name: techStack.thirdPartyServices.primary,
          description: techStack.thirdPartyServices.reasoning,
          pros: techStack.thirdPartyServices.pros,
          cons: techStack.thirdPartyServices.cons,
          difficulty: 'beginner' as const,
          cost: 'medium' as const,
          popularity: 70,
        },
      ],
      rationale: {
        reasoning: `Development: ${techStack.estimatedCosts.development}, Monthly: ${techStack.estimatedCosts.monthly}`,
        factors: [
          'Cost effectiveness',
          'Development speed',
          'Scalability',
          'Team expertise',
        ],
        alternatives: [
          ...techStack.frontend.alternatives,
          ...techStack.backend.alternatives,
          ...techStack.database.alternatives,
        ].slice(0, 5), // Limit to 5 alternatives
      },
      alternativeOptions: [],
    };

    await TechStackRecommendation.findOneAndUpdate(
      { projectId: techStackData.projectId },
      techStackData,
      { upsert: true, new: true }
    );
  }

  /**
   * Format risks for database storage
   */
  private formatRisksForDatabase(
    riskAssessment: MarketValidationResult['riskAssessment']
  ): Array<{
    type: string;
    description: string;
    severity: string;
  }> {
    const risks: Array<{
      type: string;
      description: string;
      severity: string;
    }> = [];

    if (riskAssessment.marketRisks) {
      risks.push(
        ...riskAssessment.marketRisks.map((risk: string) => ({
          type: 'market',
          description: risk,
          severity: 'medium',
        }))
      );
    }

    if (riskAssessment.technicalRisks) {
      risks.push(
        ...riskAssessment.technicalRisks.map((risk: string) => ({
          type: 'technical',
          description: risk,
          severity: 'medium',
        }))
      );
    }

    if (riskAssessment.financialRisks) {
      risks.push(
        ...riskAssessment.financialRisks.map((risk: string) => ({
          type: 'financial',
          description: risk,
          severity: 'medium',
        }))
      );
    }

    if (riskAssessment.competitiveRisks) {
      risks.push(
        ...riskAssessment.competitiveRisks.map((risk: string) => ({
          type: 'competitive',
          description: risk,
          severity: 'medium',
        }))
      );
    }

    return risks;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(
    business: BusinessAnalysisResult,
    market: MarketValidationResult
  ): number {
    return Math.round((business.confidenceScore + market.validationScore) / 2);
  }

  /**
   * Fallback business analysis if JSON parsing fails
   */
  private createFallbackBusinessAnalysis(): BusinessAnalysisResult {
    return {
      businessModelType: 'B2B',
      revenueModel: 'Subscription',
      viabilityScore: 50,
      scalabilityScore: 50,
      competitiveLandscape: {
        competitionLevel: 'Medium',
        marketSaturation: 50,
        differentiation: ['AI-powered features', 'User-friendly interface'],
      },
      confidenceScore: 50,
    };
  }

  /**
   * Fallback market validation if JSON parsing fails
   */
  private createFallbackMarketValidation(): MarketValidationResult {
    return {
      marketSize: {
        tam: 'Market size analysis unavailable',
        sam: 'Market size analysis unavailable',
        som: 'Market size analysis unavailable',
      },
      targetAudienceAnalysis: {
        primarySegment: 'Business professionals',
        secondarySegments: [],
        painPoints: ['Inefficient processes', 'Manual work'],
        willingnessToPay: 'Price sensitivity analysis needed',
        acquisitionChannels: ['Digital marketing', 'Referrals'],
      },
      riskAssessment: {
        marketRisks: ['Market competition'],
        technicalRisks: ['Technical complexity'],
        financialRisks: ['Funding requirements'],
        competitiveRisks: ['Established competitors'],
      },
      validationScore: 50,
    };
  }

  /**
   * Fallback feature generation if JSON parsing fails
   */
  private createFallbackFeatureGeneration(): FeatureGenerationResult {
    return {
      mvpFeatures: [
        {
          name: 'Core Functionality',
          description: 'Basic platform features',
          userStory:
            'As a user, I want core functionality so that I can solve my problem',
          priority: 10,
          effort: 'L',
          dependencies: [],
          successMetrics: ['User adoption', 'Feature usage'],
        },
      ],
      growthFeatures: [],
      advancedFeatures: [],
      featureRoadmap: {
        phase1: ['Core Functionality'],
        phase2: [],
        phase3: [],
      },
    };
  }

  /**
   * Fallback tech stack if JSON parsing fails
   */
  private createFallbackTechStack(): TechStackResult {
    return {
      frontend: {
        primary: 'React',
        alternatives: ['Vue.js', 'Angular'],
        reasoning: 'Popular and well-supported framework',
        pros: ['Large community', 'Extensive ecosystem'],
        cons: ['Learning curve', 'Complexity'],
      },
      backend: {
        primary: 'Node.js',
        alternatives: ['Python', 'Java'],
        reasoning: 'JavaScript consistency',
        pros: ['Fast development', 'Large ecosystem'],
        cons: ['Single-threaded limitations'],
      },
      database: {
        primary: 'PostgreSQL',
        alternatives: ['MongoDB', 'MySQL'],
        reasoning: 'Reliable and feature-rich',
        pros: ['ACID compliance', 'Advanced features'],
        cons: ['Complexity', 'Resource usage'],
      },
      infrastructure: {
        primary: 'AWS',
        alternatives: ['Google Cloud', 'Azure'],
        reasoning: 'Comprehensive service offering',
        pros: ['Scalability', 'Reliability'],
        cons: ['Cost complexity', 'Learning curve'],
      },
      thirdPartyServices: {
        primary: 'Auth0',
        alternatives: ['Firebase Auth', 'AWS Cognito'],
        reasoning: 'Easy to implement and secure',
        pros: ['Security', 'Easy integration'],
        cons: ['Cost at scale', 'Vendor lock-in'],
      },
      estimatedCosts: {
        development: '$50,000 - $150,000 for MVP',
        monthly: '$500 - $2,000 monthly operations',
        scaling: '$5,000 - $20,000 at scale',
      },
    };
  }
}

export const ideaProcessingService = new IdeaProcessingService();
