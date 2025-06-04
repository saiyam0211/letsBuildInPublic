import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { 
  User, 
  Project, 
  SaasIdea, 
  IdeaValidation, 
  Feature, 
  TechStackRecommendation, 
  Task, 
  Diagram,
  ProjectBoard,
  Blueprint,
  MCPAgent,
  ExternalIntegration
} from '../models/index.js';
import { logger } from '../utils/logger.js';

// Configure dotenv to load environment variables
dotenv.config();

async function seedDatabase() {
  try {
    await connectDatabase();
    logger.info('Connected to database for seeding');

    // Clear existing data more thoroughly
    const collections = [
      'users', 'projects', 'saasideas', 'ideavlidations', 'features',
      'techstackrecommendations', 'tasks', 'diagrams', 'projectboards',
      'blueprints', 'mcpagents', 'externalintegrations'
    ];

    if (mongoose.connection.db) {
      // Try to drop the entire database first
      try {
        await mongoose.connection.db!.dropDatabase();
        logger.info('Dropped entire database');
      } catch (error) {
        logger.info('Could not drop database, falling back to individual collections');
        
        for (const collection of collections) {
          try {
            await mongoose.connection.db!.collection(collection).drop();
            logger.info(`Dropped collection: ${collection}`);
          } catch (error) {
            // Collection might not exist, which is fine
            logger.info(`Collection ${collection} doesn't exist or already dropped`);
          }
        }
      }
      
      // Add a small delay to ensure everything is cleaned up
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.info('Cleared existing data');

    // Create users
    const users = await User.create([
      {
        email: 'john.doe@example.com',
        password: 'SecurePassword123!',
        name: 'John Doe',
        role: 'admin'
      },
      {
        email: 'jane.smith@example.com',
        password: 'SecurePassword123!',
        name: 'Jane Smith',
        role: 'user'
      }
    ]);

    logger.info(`Created ${users.length} users`);

    // Create project
    const project = await Project.create({
      name: 'AI-Powered Task Manager',
      description: 'An intelligent task management SaaS with AI-powered insights and automation',
      ownerId: users[0]!._id,
      status: 'planning'
    });

    logger.info(`Created project: ${project.name}`);

    // Create SaaS idea
    const saasIdea = await SaasIdea.create({
      projectId: project._id,
      description: 'An AI-powered task management platform that learns from user behavior, provides intelligent suggestions, automates routine tasks, and offers deep insights into team productivity.',
      problemStatement: 'Traditional task managers lack intelligence and fail to provide insights into productivity patterns and team collaboration effectiveness.',
      targetAudience: 'Small to medium teams, freelancers, and project managers who need intelligent task management',
      desiredFeatures: [
        'AI-powered task prioritization',
        'Smart scheduling and deadline prediction',
        'Team collaboration analytics',
        'Automated workflow creation',
        'Integration with popular tools',
        'Predictive project timeline estimation'
      ],
      technicalPreferences: [
        'React with TypeScript',
        'Node.js with Express',
        'MongoDB',
        'AWS'
      ]
    });

    // Create idea validation
    const ideaValidation = await IdeaValidation.create({
      ideaId: saasIdea._id,
      marketPotential: 85,
      similarProducts: [
        {
          name: 'Asana',
          description: 'Comprehensive project management with task tracking and team collaboration features',
          url: 'https://asana.com',
          similarityScore: 75
        },
        {
          name: 'Trello',
          description: 'Visual project management based on Kanban boards with simple task organization',
          url: 'https://trello.com',
          similarityScore: 60
        }
      ],
      differentiationOpportunities: [
        'AI-powered task prioritization and intelligent suggestions',
        'Advanced analytics and productivity insights',
        'Predictive project timeline estimation',
        'Automated workflow optimization'
      ],
      risks: [
        {
          type: 'competitive',
          description: 'High competition in task management space with established players',
          severity: 'medium',
          mitigation: 'Focus on AI differentiation and superior user experience'
        },
        {
          type: 'market',
          description: 'AI feature adoption may be slow among traditional teams',
          severity: 'medium',
          mitigation: 'Gradual AI introduction with clear value demonstration'
        },
        {
          type: 'financial',
          description: 'Need for significant initial investment in AI development',
          severity: 'high',
          mitigation: 'Phased development approach and early customer validation'
        }
      ],
      confidenceScore: 78,
      improvementSuggestions: [
        'Conduct user interviews with target market',
        'Build MVP with core AI features first',
        'Establish partnerships with complementary tools',
        'Focus on specific industry verticals initially'
      ]
    });

    // Create features
    const features = await Feature.create([
      {
        projectId: project._id,
        name: 'AI Task Prioritization',
        description: 'Machine learning algorithm that analyzes task complexity, deadlines, and user behavior to automatically prioritize tasks',
        priority: 'high',
        complexity: 8,
        category: 'mvp',
        userPersona: 'project-manager'
      },
      {
        projectId: project._id,
        name: 'Smart Scheduling',
        description: 'AI-powered scheduling that considers team availability, task dependencies, and optimal productivity hours',
        priority: 'high',
        complexity: 9,
        category: 'mvp',
        userPersona: 'team-member'
      }
    ]);

    // Create tech stack recommendation
    const techStackRecommendation = await TechStackRecommendation.create({
      projectId: project._id,
      frontend: [
        {
          name: 'React',
          description: 'Popular JavaScript library for building user interfaces with component-based architecture',
          pros: ['Large ecosystem', 'Strong community', 'TypeScript support', 'Component reusability'],
          cons: ['Learning curve', 'Frequent updates', 'Complex state management'],
          difficulty: 'intermediate',
          cost: 'free',
          popularity: 95
        }
      ],
      backend: [
        {
          name: 'Node.js',
          description: 'JavaScript runtime for server-side development with excellent real-time capabilities',
          pros: ['Single language stack', 'NPM ecosystem', 'Real-time capabilities', 'Fast development'],
          cons: ['Single-threaded limitations', 'Callback complexity', 'CPU-intensive tasks'],
          difficulty: 'intermediate',
          cost: 'free',
          popularity: 85
        }
      ],
      database: [
        {
          name: 'MongoDB',
          description: 'NoSQL document database with flexible schema and horizontal scaling capabilities',
          pros: ['Schema flexibility', 'Horizontal scaling', 'JSON support', 'Easy to learn'],
          cons: ['Consistency trade-offs', 'Memory usage', 'No ACID transactions'],
          difficulty: 'beginner',
          cost: 'low',
          popularity: 75
        }
      ],
      infrastructure: [
        {
          name: 'AWS',
          description: 'Comprehensive cloud platform with extensive AI/ML services and global infrastructure',
          pros: ['ML services', 'Global infrastructure', 'Mature ecosystem', 'Scalability'],
          cons: ['Cost complexity', 'Vendor lock-in', 'Learning curve'],
          difficulty: 'advanced',
          cost: 'medium',
          popularity: 90
        }
      ],
      rationale: {
        reasoning: 'This tech stack is recommended for an AI-powered task management SaaS because it provides excellent scalability, modern development practices, and strong AI/ML integration capabilities while maintaining development velocity.',
        factors: ['Team expertise', 'Scalability requirements', 'AI/ML integration', 'Development speed', 'Community support'],
        alternatives: ['Vue.js for frontend', 'Python for backend', 'PostgreSQL for database', 'Google Cloud for infrastructure']
      }
    });

    // Create tasks
    const tasks = await Task.create([
      {
        projectId: project._id,
        title: 'Set up project repository and CI/CD pipeline',
        description: 'Initialize Git repository, configure GitHub Actions, set up development and production environments',
        status: 'done',
        priority: 'high',
        effortEstimate: 8,
        assigneeId: users[0]!._id
      },
      {
        projectId: project._id,
        title: 'Design and implement user authentication system',
        description: 'Create JWT-based authentication with registration, login, password reset, and email verification',
        status: 'in-progress',
        priority: 'high',
        effortEstimate: 16,
        assigneeId: users[1]!._id
      }
    ]);

    // Create system diagram
    const diagram = await Diagram.create({
      projectId: project._id,
      type: 'system-architecture',
      content: `graph TB
    A[Client App React] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[Task Service]
    B --> E[AI Service]
    
    C --> F[User Database]
    D --> G[Task Database]
    E --> H[ML Models]`,
      metadata: {
        version: '1.0.0',
        theme: 'default',
        direction: 'TB',
        nodeCount: 8,
        edgeCount: 7,
        complexity: 'simple'
      },
      format: 'mermaid'
    });

    // Create project board
    const projectBoard = await ProjectBoard.create({
      projectId: project._id,
      name: 'Main Development Board',
      description: 'Primary Kanban board for tracking development progress',
      columns: [
        { id: 'backlog', name: 'Backlog', position: 0 },
        { id: 'todo', name: 'To Do', position: 1 },
        { id: 'in-progress', name: 'In Progress', position: 2, taskLimit: 3 },
        { id: 'done', name: 'Done', position: 3 }
      ]
    });

    // Create blueprint
    const blueprint = await Blueprint.create({
      projectId: project._id,
      name: 'AI Task Manager Blueprint v1.0',
      description: 'Complete implementation blueprint for the AI-powered task management SaaS',
      status: 'completed',
      type: 'full',
      metadata: {
        version: '1.0.0',
        generatedAt: new Date(),
        aiConfidenceScore: 85,
        estimatedTimeline: '3-6 months',
        estimatedBudget: {
          min: 25000,
          max: 45000,
          currency: 'USD'
        }
      },
      summary: {
        projectName: project.name,
        description: project.description || '',
        targetMarket: 'Small to medium teams and project managers',
        keyFeatures: [
          'AI Task Prioritization',
          'Smart Scheduling',
          'Team Collaboration'
        ],
        techStack: {
          frontend: 'React with TypeScript',
          backend: 'Node.js with Express',
          database: 'MongoDB',
          hosting: 'AWS'
        },
        mvpFeatures: 2,
        totalTasks: tasks.length
      },
      components: {
        ideaValidation: true,
        techStackRecommendation: true,
        featureList: true,
        taskBreakdown: true,
        systemDiagrams: true,
        projectBoard: true
      },
      tags: ['ai', 'productivity', 'saas']
    });

    // Create MCP Agent
    const mcpAgent = await MCPAgent.create({
      projectId: project._id,
      name: 'Task Priority AI Agent',
      description: 'AI agent responsible for analyzing and prioritizing tasks based on multiple factors',
      type: 'task-generator',
      capabilities: [
        {
          name: 'Task Analysis',
          description: 'Analyzes task complexity, dependencies, and deadlines',
          enabled: true
        }
      ],
      config: {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 2000,
        systemPrompt: 'You are an AI assistant specialized in task management and prioritization.',
        tools: ['task_analyzer'],
        rateLimitPerMinute: 30
      },
      performance: {
        totalExecutions: 0,
        successRate: 100,
        averageExecutionTime: 0,
        averageTokensUsed: 0
      },
      metadata: {
        createdBy: users[0]!._id,
        lastModifiedBy: users[0]!._id,
        tags: ['ai', 'prioritization'],
        isPublic: false
      }
    });

    // Create external integration
    const externalIntegration = await ExternalIntegration.create({
      projectId: project._id,
      name: 'GitHub Integration',
      description: 'Sync tasks with GitHub issues and pull requests',
      provider: 'github',
      category: 'version_control',
      status: 'active',
      authConfig: {
        type: 'oauth2',
        credentials: { token: 'encrypted_token_placeholder' }
      },
      syncConfig: {
        enabled: true,
        frequency: 'hourly',
        syncDirection: 'bidirectional',
        fieldsMapping: {
          'task.title': 'issue.title',
          'task.description': 'issue.body'
        }
      },
      endpoints: {
        baseUrl: 'https://api.github.com'
      },
      features: {
        supportsWebhooks: true,
        supportsRealTimeSync: true,
        supportsBulkOperations: true,
        supportsFileUpload: false
      },
      metadata: {
        configuredBy: users[0]!._id,
        lastModifiedBy: users[0]!._id,
        tags: ['github', 'sync'],
        isCustom: false
      },
      statistics: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageSyncTime: 0,
        dataTransferred: 0
      }
    });

    logger.info('✅ Database seeding completed successfully!');
    logger.info(`Created:
      - ${users.length} users
      - 1 project: ${project.name}
      - 1 SaaS idea with validation (ID: ${ideaValidation._id})
      - ${features.length} features
      - 1 tech stack recommendation (ID: ${techStackRecommendation._id})
      - ${tasks.length} tasks
      - 1 system diagram: ${diagram.type}
      - 1 project board: ${projectBoard.name}
      - 1 blueprint: ${blueprint.name}
      - 1 MCP agent: ${mcpAgent.name}
      - 1 external integration: ${externalIntegration.name}`);

  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Run the seeding
seedDatabase(); 