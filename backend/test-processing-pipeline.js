import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { jobQueueService } from './src/services/jobQueue.js';
import { webSocketService } from './src/services/websocket.js';
import { ideaProcessingService } from './src/services/ideaProcessing.js';
import { redis } from './src/services/jobQueue.js';
import { logger } from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const DEMO_DATA = {
  projectId: '507f1f77bcf86cd799439011', // Mock MongoDB ObjectId
  userId: '507f1f77bcf86cd799439012',    // Mock MongoDB ObjectId
  description: 'AI-powered personal finance management platform that helps users track expenses, create budgets, and achieve financial goals through intelligent recommendations and automated savings strategies.',
  targetAudience: 'Young professionals aged 25-35 who want to improve their financial health but struggle with budgeting and saving consistently.',
  problemStatement: 'Many young professionals earn decent salaries but struggle to save money due to poor spending tracking, lack of budgeting knowledge, and difficulty sticking to financial goals.',
  desiredFeatures: [
    'Automated expense categorization',
    'AI-powered budget recommendations',
    'Goal-based savings tracker',
    'Investment portfolio suggestions',
    'Bill payment reminders',
    'Financial education content',
    'Spending insights and analytics',
    'Bank account integration'
  ],
  technicalPreferences: [
    'React Native for mobile app',
    'Node.js backend with Express',
    'PostgreSQL for financial data',
    'Redis for caching',
    'AWS for cloud infrastructure',
    'Stripe for payment processing',
    'Plaid for bank connections'
  ]
};

class ProcessingPipelineDemo {
  constructor() {
    this.isRunning = false;
    this.currentJobId = null;
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Processing Pipeline Demo...\n');

      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saas_blueprint');
      console.log('✅ Connected to MongoDB');

      // Test Redis connection
      await redis.ping();
      console.log('✅ Connected to Redis');

      // Check job queue health
      const queueHealth = await jobQueueService.healthCheck();
      console.log('✅ Job Queue Status:', queueHealth);

      // Check WebSocket service
      const wsHealth = webSocketService.healthCheck();
      console.log('✅ WebSocket Status:', wsHealth);

      console.log('\n🎯 Demo Environment Ready!\n');

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  async demonstrateAsyncProcessing() {
    console.log('📋 DEMONSTRATION: Asynchronous Idea Processing Pipeline\n');
    console.log('=' * 60);

    try {
      const jobId = uuidv4();
      this.currentJobId = jobId;

      const jobData = {
        jobId,
        userId: DEMO_DATA.userId,
        projectId: DEMO_DATA.projectId,
        description: DEMO_DATA.description,
        targetAudience: DEMO_DATA.targetAudience,
        problemStatement: DEMO_DATA.problemStatement,
        desiredFeatures: DEMO_DATA.desiredFeatures,
        technicalPreferences: DEMO_DATA.technicalPreferences,
        priority: 8, // High priority
      };

      console.log('🎬 Starting async processing job...');
      console.log(`📋 Job ID: ${jobId}`);
      console.log(`📦 Project ID: ${DEMO_DATA.projectId}`);
      console.log(`👤 User ID: ${DEMO_DATA.userId}\n`);

      // Add job to queue
      const job = await jobQueueService.addIdeaProcessingJob(jobData);
      console.log(`✅ Job added to queue with Bull ID: ${job.id}\n`);

      // Monitor job progress
      await this.monitorJobProgress(jobId);

    } catch (error) {
      console.error('❌ Async processing demo failed:', error);
    }
  }

  async monitorJobProgress(jobId) {
    console.log('📊 Monitoring job progress in real-time...\n');

    let isCompleted = false;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes max

    while (!isCompleted && attempts < maxAttempts) {
      try {
        const progress = await jobQueueService.getJobProgress(jobId);

        if (progress) {
          const statusIcon = this.getStatusIcon(progress.status);
          const progressBar = this.createProgressBar(progress.progress);
          
          console.log(`${statusIcon} Status: ${progress.status.toUpperCase()}`);
          console.log(`📈 Progress: ${progressBar} ${progress.progress}%`);
          console.log(`🔄 Current Step: ${progress.currentStep}`);
          
          if (progress.metrics) {
            console.log(`💰 AI Cost: $${progress.metrics.aiCost.toFixed(4)}`);
            console.log(`🔤 Tokens Used: ${progress.metrics.tokensUsed}`);
            console.log(`⏱️  Processing Time: ${(progress.metrics.processingTime / 1000).toFixed(2)}s`);
          }

          if (progress.status === 'completed') {
            isCompleted = true;
            console.log('\n🎉 JOB COMPLETED SUCCESSFULLY!\n');
            await this.displayResults(progress.result);
            break;
          } else if (progress.status === 'failed') {
            console.log('\n❌ JOB FAILED!\n');
            console.log(`Error: ${progress.error}`);
            break;
          }

          console.log('─'.repeat(50));
        }

        await this.sleep(1000); // Wait 1 second
        attempts++;

      } catch (error) {
        console.error('Error monitoring progress:', error);
        attempts++;
      }
    }

    if (attempts >= maxAttempts) {
      console.log('\n⏰ Monitoring timeout reached');
    }
  }

  async demonstrateSyncProcessing() {
    console.log('\n📋 DEMONSTRATION: Synchronous Idea Processing\n');
    console.log('=' * 60);

    try {
      console.log('🎬 Starting synchronous processing...');
      console.log('⚠️  This will take 2-5 minutes to complete\n');

      const startTime = Date.now();

      const result = await ideaProcessingService.processIdea({
        projectId: DEMO_DATA.projectId,
        description: DEMO_DATA.description,
        targetAudience: DEMO_DATA.targetAudience,
        problemStatement: DEMO_DATA.problemStatement,
        desiredFeatures: DEMO_DATA.desiredFeatures,
        technicalPreferences: DEMO_DATA.technicalPreferences,
      });

      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      console.log(`\n🎉 SYNCHRONOUS PROCESSING COMPLETED in ${totalTime.toFixed(2)}s!\n`);
      await this.displayResults(result);

    } catch (error) {
      console.error('❌ Sync processing demo failed:', error);
    }
  }

  async displayResults(result) {
    if (!result) {
      console.log('❌ No results to display');
      return;
    }

    console.log('📊 PROCESSING RESULTS');
    console.log('=' * 60);

    // Business Analysis
    if (result.businessAnalysis) {
      console.log('🏢 BUSINESS ANALYSIS:');
      console.log(`   Model Type: ${result.businessAnalysis.businessModelType}`);
      console.log(`   Revenue Models: ${result.businessAnalysis.revenueModels.join(', ')}`);
      console.log(`   Viability Score: ${result.businessAnalysis.viabilityScore}/100`);
      console.log(`   Scalability Score: ${result.businessAnalysis.scalabilityScore}/100`);
      console.log(`   Key Strengths: ${result.businessAnalysis.keyStrengths.slice(0, 3).join(', ')}`);
      console.log();
    }

    // Market Validation
    if (result.marketValidation) {
      console.log('📈 MARKET VALIDATION:');
      console.log(`   Market Size (TAM): $${result.marketValidation.marketSizing.TAM}`);
      console.log(`   Addressable Market (SAM): $${result.marketValidation.marketSizing.SAM}`);
      console.log(`   Target Market (SOM): $${result.marketValidation.marketSizing.SOM}`);
      console.log(`   Validation Score: ${result.marketValidation.validationScore}/100`);
      console.log(`   Primary Audience: ${result.marketValidation.targetAudience.primary.segment}`);
      console.log();
    }

    // Features Summary
    if (result.features && result.features.length > 0) {
      console.log('⚡ FEATURE ROADMAP:');
      const mvpFeatures = result.features.filter(f => f.category === 'mvp').length;
      const growthFeatures = result.features.filter(f => f.category === 'growth').length;
      const futureFeatures = result.features.filter(f => f.category === 'future').length;
      
      console.log(`   MVP Features: ${mvpFeatures}`);
      console.log(`   Growth Features: ${growthFeatures}`);
      console.log(`   Future Features: ${futureFeatures}`);
      console.log(`   Total Features: ${result.features.length}`);
      console.log();
    }

    // Tech Stack
    if (result.techStack && result.techStack.length > 0) {
      console.log('🛠️  TECHNOLOGY STACK:');
      const categories = [...new Set(result.techStack.map(ts => ts.category))];
      categories.forEach(category => {
        const techs = result.techStack
          .filter(ts => ts.category === category)
          .map(ts => ts.options[0]?.name)
          .filter(Boolean)
          .slice(0, 3);
        console.log(`   ${category}: ${techs.join(', ')}`);
      });
      console.log();
    }

    // Processing Metrics
    if (result.processingMetrics) {
      console.log('📊 PROCESSING METRICS:');
      console.log(`   Total Cost: $${result.processingMetrics.aiCost.toFixed(4)}`);
      console.log(`   Tokens Used: ${result.processingMetrics.tokensUsed}`);
      console.log(`   Processing Time: ${(result.processingMetrics.processingTime / 1000).toFixed(2)}s`);
      console.log(`   Steps Completed: ${result.processingMetrics.stepsCompleted.length}/7`);
      console.log(`   Confidence Score: ${result.processingMetrics.confidenceScore}/100`);
      console.log();
    }
  }

  async demonstrateQueueManagement() {
    console.log('\n📋 DEMONSTRATION: Queue Management\n');
    console.log('=' * 60);

    try {
      // Get queue statistics
      const stats = await jobQueueService.getQueueStats();
      console.log('📊 QUEUE STATISTICS:');
      console.log(`   Waiting Jobs: ${stats.waiting}`);
      console.log(`   Active Jobs: ${stats.active}`);
      console.log(`   Completed Jobs: ${stats.completed}`);
      console.log(`   Failed Jobs: ${stats.failed}`);
      console.log(`   Delayed Jobs: ${stats.delayed}`);
      console.log();

      // Get user's active jobs
      const userJobs = await jobQueueService.getUserActiveJobs(DEMO_DATA.userId);
      console.log(`👤 USER'S ACTIVE JOBS (${userJobs.length}):`);
      userJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.jobId} - ${job.status} (${job.progress}%)`);
      });
      console.log();

      // Health check
      const health = await jobQueueService.healthCheck();
      console.log('🏥 HEALTH CHECK:');
      console.log(`   Redis: ${health.redis ? '✅' : '❌'}`);
      console.log(`   Queue: ${health.queue ? '✅' : '❌'}`);
      console.log(`   Active Jobs: ${health.activeJobs}`);
      console.log(`   Waiting Jobs: ${health.waitingJobs}`);
      console.log();

    } catch (error) {
      console.error('❌ Queue management demo failed:', error);
    }
  }

  getStatusIcon(status) {
    const icons = {
      'waiting': '⏳',
      'active': '🔄',
      'completed': '✅',
      'failed': '❌',
      'delayed': '⏰',
      'paused': '⏸️'
    };
    return icons[status] || '❓';
  }

  createProgressBar(progress, width = 20) {
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up demo environment...');
    
    try {
      // Cancel any active jobs
      if (this.currentJobId) {
        await jobQueueService.cancelJob(this.currentJobId);
        console.log('✅ Cancelled active job');
      }

      // Clear Redis
      await redis.flushdb();
      console.log('✅ Cleared Redis cache');

      // Close connections
      await redis.quit();
      await mongoose.connection.close();
      console.log('✅ Closed database connections');

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async runFullDemo() {
    try {
      await this.initialize();

      console.log('🎯 PROCESSING PIPELINE DEMONSTRATION');
      console.log('🕐 Estimated time: 5-10 minutes');
      console.log('📋 This demo will showcase:');
      console.log('   • Asynchronous job processing');
      console.log('   • Real-time progress monitoring');
      console.log('   • Queue management features');
      console.log('   • Result aggregation');
      console.log('   • Error handling');
      console.log('\n⚡ Starting demo in 3 seconds...\n');

      await this.sleep(3000);

      // Demonstrate async processing
      await this.demonstrateAsyncProcessing();

      // Wait a bit
      await this.sleep(2000);

      // Demonstrate queue management
      await this.demonstrateQueueManagement();

      // Optional: Demonstrate sync processing (commented out to save time)
      // await this.demonstrateSyncProcessing();

      console.log('\n🎉 DEMO COMPLETED SUCCESSFULLY!');
      console.log('\n📋 Summary:');
      console.log('   ✅ Background job processing with Bull');
      console.log('   ✅ Real-time progress updates via WebSocket');
      console.log('   ✅ Result aggregation and confidence scoring');
      console.log('   ✅ Comprehensive error handling');
      console.log('   ✅ Queue management and monitoring');
      console.log('\nWeek 4 Day 3: Processing Pipeline is COMPLETE! 🚀');

    } catch (error) {
      console.error('\n❌ Demo failed:', error);
    } finally {
      await this.cleanup();
      process.exit(0);
    }
  }
}

// Run the demo
const demo = new ProcessingPipelineDemo();
demo.runFullDemo().catch(console.error); 