import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../server.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { jobQueueService } from '../services/jobQueue.js';
import { webSocketService } from '../services/websocket.js';
import { redis } from '../services/jobQueue.js';

describe('Processing Pipeline Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/saas_blueprint_test');
    }
    
    // Create test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
    });
    await user.save();
    userId = user._id.toString();

    // Generate auth token
    authToken = jwt.sign(
      { userId: userId, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Create test project
    const project = new Project({
      name: 'Test Project',
      description: 'Test project for pipeline testing',
      owner: userId,
      status: 'planning',
    });
    await project.save();
    projectId = project._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Project.deleteMany({});
    
    // Close connections
    await redis.quit();
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Clear any existing jobs
    await redis.flushdb();
  });

  describe('Job Queue Service', () => {
    it('should add a job to the queue', async () => {
      const jobData = {
        jobId: 'test-job-1',
        userId,
        projectId,
        description: 'AI-powered project management tool for small teams',
        targetAudience: 'Small business owners and team leads',
        problemStatement: 'Teams struggle with task coordination and progress tracking',
        desiredFeatures: ['Task management', 'Real-time collaboration'],
        technicalPreferences: ['React', 'Node.js'],
      };

      const job = await jobQueueService.addIdeaProcessingJob(jobData);
      
      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      
      // Check job progress was initialized
      const progress = await jobQueueService.getJobProgress('test-job-1');
      expect(progress).toBeDefined();
      expect(progress!.status).toBe('waiting');
      expect(progress!.progress).toBe(0);
    });

    it('should get user active jobs', async () => {
      const jobData = {
        jobId: 'test-job-2',
        userId,
        projectId,
        description: 'E-commerce platform for local businesses',
        targetAudience: 'Local business owners',
        problemStatement: 'Local businesses need online presence',
        desiredFeatures: ['Product catalog', 'Payment processing'],
        technicalPreferences: ['Vue.js', 'Express'],
      };

      await jobQueueService.addIdeaProcessingJob(jobData);
      
      const activeJobs = await jobQueueService.getUserActiveJobs(userId);
      expect(activeJobs).toHaveLength(1);
      expect(activeJobs[0].jobId).toBe('test-job-2');
    });

    it('should cancel a job', async () => {
      const jobData = {
        jobId: 'test-job-3',
        userId,
        projectId,
        description: 'Social media management tool',
        targetAudience: 'Content creators',
        problemStatement: 'Managing multiple social media accounts is time-consuming',
        desiredFeatures: ['Content scheduling', 'Analytics'],
        technicalPreferences: ['React', 'Python'],
      };

      await jobQueueService.addIdeaProcessingJob(jobData);
      
      const cancelled = await jobQueueService.cancelJob('test-job-3');
      expect(cancelled).toBe(true);
      
      const progress = await jobQueueService.getJobProgress('test-job-3');
      expect(progress!.status).toBe('failed');
      expect(progress!.error).toBe('Job cancelled by user');
    });

    it('should get queue statistics', async () => {
      const stats = await jobQueueService.getQueueStats();
      
      expect(stats).toHaveProperty('waiting');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('delayed');
      expect(typeof stats.waiting).toBe('number');
    });

    it('should perform health check', async () => {
      const health = await jobQueueService.healthCheck();
      
      expect(health).toHaveProperty('redis');
      expect(health).toHaveProperty('queue');
      expect(health).toHaveProperty('activeJobs');
      expect(health).toHaveProperty('waitingJobs');
      expect(health.redis).toBe(true);
      expect(health.queue).toBe(true);
    });
  });

  describe('WebSocket Service', () => {
    it('should handle health check', () => {
      const health = webSocketService.healthCheck();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('connectedUsers');
      expect(health).toHaveProperty('connectedSockets');
      expect(typeof health.connectedUsers).toBe('number');
      expect(typeof health.connectedSockets).toBe('number');
    });

    it('should track connected users', () => {
      const connectedUsers = webSocketService.getConnectedUsers();
      expect(Array.isArray(connectedUsers)).toBe(true);
      
      const userCount = webSocketService.getConnectedUserCount();
      expect(typeof userCount).toBe('number');
    });
  });

  describe('API Endpoints', () => {
    describe('POST /api/projects/:projectId/ideas/process', () => {
      it('should start asynchronous idea processing', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/ideas/process`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: 'AI-powered customer service chatbot',
            targetAudience: 'E-commerce businesses',
            problemStatement: 'Customer service is expensive and slow',
            desiredFeatures: ['Natural language processing', 'Multi-language support'],
            technicalPreferences: ['Python', 'TensorFlow'],
            priority: 5,
          });

        expect(response.status).toBe(202);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('jobId');
        expect(response.body.data).toHaveProperty('projectId', projectId);
        expect(response.body.data).toHaveProperty('status', 'queued');
      });

      it('should validate input data', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/ideas/process`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: 'Short', // Too short
            targetAudience: 'Test',
            problemStatement: 'Problem',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/ideas/process`)
          .send({
            description: 'Test description for authentication test',
            targetAudience: 'Test audience',
            problemStatement: 'Test problem statement',
          });

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/projects/:projectId/ideas/process-sync', () => {
      it('should process idea synchronously', async () => {
        const response = await request(app)
          .post(`/api/projects/${projectId}/ideas/process-sync`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: 'Task management app for remote teams',
            targetAudience: 'Remote workers and team managers',
            problemStatement: 'Remote teams struggle with coordination',
            desiredFeatures: ['Video calls', 'File sharing'],
            technicalPreferences: ['React', 'Node.js'],
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('businessAnalysis');
        expect(response.body.data).toHaveProperty('marketValidation');
        expect(response.body.data).toHaveProperty('features');
        expect(response.body.data).toHaveProperty('techStack');
      }, 30000); // Increase timeout for AI processing
    });

    describe('GET /api/jobs/:jobId/status', () => {
      it('should get job status', async () => {
        // First create a job
        const jobResponse = await request(app)
          .post(`/api/projects/${projectId}/ideas/process`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: 'Online learning platform',
            targetAudience: 'Students and educators',
            problemStatement: 'Traditional learning is not engaging',
            desiredFeatures: ['Interactive courses', 'Progress tracking'],
            technicalPreferences: ['React', 'MongoDB'],
          });

        const jobId = jobResponse.body.data.jobId;

        // Then get job status
        const statusResponse = await request(app)
          .get(`/api/jobs/${jobId}/status`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(statusResponse.status).toBe(200);
        expect(statusResponse.body.success).toBe(true);
        expect(statusResponse.body.data).toHaveProperty('jobId', jobId);
        expect(statusResponse.body.data).toHaveProperty('status');
        expect(statusResponse.body.data).toHaveProperty('progress');
      });

      it('should return 404 for non-existent job', async () => {
        const response = await request(app)
          .get('/api/jobs/non-existent-job-id/status')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400); // Invalid UUID format
      });
    });

    describe('GET /api/jobs/my-jobs', () => {
      it('should get user active jobs', async () => {
        const response = await request(app)
          .get('/api/jobs/my-jobs')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('activeJobs');
        expect(response.body.data).toHaveProperty('count');
        expect(Array.isArray(response.body.data.activeJobs)).toBe(true);
      });
    });

    describe('GET /api/queue/stats', () => {
      it('should get queue statistics', async () => {
        const response = await request(app)
          .get('/api/queue/stats')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('queue');
        expect(response.body.data).toHaveProperty('health');
      });
    });

    describe('GET /api/queue/health', () => {
      it('should perform queue health check', async () => {
        const response = await request(app)
          .get('/api/queue/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('redis');
        expect(response.body.data).toHaveProperty('queue');
      });
    });
  });

  describe('Enhanced Health Check', () => {
    it('should return comprehensive health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('redis');
      expect(response.body.services).toHaveProperty('jobQueue');
      expect(response.body.services).toHaveProperty('webSocket');
      expect(response.body.metrics).toHaveProperty('activeJobs');
      expect(response.body.metrics).toHaveProperty('waitingJobs');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project ID', async () => {
      const response = await request(app)
        .post('/api/projects/invalid-id/ideas/process')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test description',
          targetAudience: 'Test audience',
          problemStatement: 'Test problem statement',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/ideas/process`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test description',
          // Missing targetAudience and problemStatement
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Real-time Updates', () => {
    it('should emit job progress updates', (done) => {
      // This test would require a more complex setup with actual WebSocket client
      // For now, we'll test that the WebSocket service methods work
      const mockProgress = {
        jobId: 'test-job-ws',
        projectId,
        userId,
        status: 'active' as const,
        progress: 50,
        currentStep: 'Processing features',
        metrics: {
          stepsCompleted: ['business_analysis'],
          totalSteps: 7,
          aiCost: 0.05,
          tokensUsed: 500,
          processingTime: 5000,
        },
      };

      // Test that emitJobProgress doesn't throw
      expect(() => {
        webSocketService.emitJobProgress(mockProgress);
      }).not.toThrow();

      done();
    });
  });
}); 