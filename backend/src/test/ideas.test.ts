import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../server.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { SaasIdea } from '../models/SaasIdea.js';
import { AuthService } from '../services/authService.js';

describe('Ideas API Endpoints', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;
  let ideaId: string;

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Project.deleteMany({});
    await SaasIdea.deleteMany({});

    // Create test user
    const user = new User({
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      isEmailVerified: true,
    });
    await user.save();
    userId = user._id.toString();

    // Generate auth token
    const tokens = AuthService.generateTokens(user);
    authToken = tokens.accessToken;

    // Create test project
    const project = new Project({
      name: 'Test Project',
      description: 'A test project for ideas',
      ownerId: userId,
      status: 'planning',
    });
    await project.save();
    projectId = project._id.toString();
  });

  describe('POST /api/projects/:id/ideas', () => {
    const validIdeaData = {
      description:
        'A revolutionary SaaS platform that helps small businesses manage their inventory, track sales, and analyze customer behavior through an intuitive dashboard.',
      targetAudience:
        'Small to medium-sized retail businesses looking for affordable inventory management solutions',
      problemStatement:
        'Small businesses struggle with manual inventory tracking, leading to stockouts and overstocking, which impacts their profitability and customer satisfaction.',
      desiredFeatures: [
        'Real-time inventory tracking',
        'Sales analytics dashboard',
        'Customer behavior insights',
        'Mobile app support',
      ],
      technicalPreferences: [
        'React',
        'Node.js',
        'MongoDB',
        'Mobile-responsive',
      ],
    };

    it('should create a new idea successfully', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/ideas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validIdeaData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SaaS idea submitted successfully');
      expect(response.body.data).toHaveProperty('ideaId');
      expect(response.body.data.description).toBe(validIdeaData.description);
      expect(response.body.data.targetAudience).toBe(
        validIdeaData.targetAudience
      );

      ideaId = response.body.data.ideaId;
    });

    it('should reject idea with short description', async () => {
      const invalidData = {
        ...validIdeaData,
        description: 'Too short',
      };

      const response = await request(app)
        .post(`/api/projects/${projectId}/ideas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject duplicate idea for same project', async () => {
      // Create first idea
      await request(app)
        .post(`/api/projects/${projectId}/ideas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validIdeaData)
        .expect(201);

      // Try to create second idea for same project
      const response = await request(app)
        .post(`/api/projects/${projectId}/ideas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validIdeaData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already has a SaaS idea');
    });

    it('should reject unauthorized access', async () => {
      await request(app)
        .post(`/api/projects/${projectId}/ideas`)
        .send(validIdeaData)
        .expect(401);
    });

    it('should reject access to non-existent project', async () => {
      const fakeProjectId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/projects/${fakeProjectId}/ideas`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validIdeaData)
        .expect(404);

      expect(response.body.message).toBe('Project not found or access denied');
    });
  });

  describe('GET /api/projects/:id/ideas', () => {
    beforeEach(async () => {
      // Create a test idea
      const idea = new SaasIdea({
        projectId,
        description:
          'Test idea description that is long enough to pass validation requirements',
        targetAudience: 'Test target audience',
        problemStatement: 'Test problem statement that is detailed enough',
        desiredFeatures: ['Feature 1', 'Feature 2'],
        technicalPreferences: ['React', 'Node.js'],
      });
      await idea.save();
      ideaId = idea._id.toString();
    });

    it('should get all ideas for a project', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/ideas`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    it('should return empty array for project with no ideas', async () => {
      // Delete the test idea
      await SaasIdea.deleteMany({});

      const response = await request(app)
        .get(`/api/projects/${projectId}/ideas`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/projects/:id/ideas/:ideaId', () => {
    beforeEach(async () => {
      // Create a test idea
      const idea = new SaasIdea({
        projectId,
        description:
          'Test idea description that is long enough to pass validation requirements',
        targetAudience: 'Test target audience',
        problemStatement: 'Test problem statement that is detailed enough',
        desiredFeatures: ['Feature 1', 'Feature 2'],
        technicalPreferences: ['React', 'Node.js'],
      });
      await idea.save();
      ideaId = idea._id.toString();
    });

    it('should get idea details successfully', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ideaId).toBe(ideaId);
      expect(response.body.data.description).toContain('Test idea description');
    });

    it('should return 404 for non-existent idea', async () => {
      const fakeIdeaId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/projects/${projectId}/ideas/${fakeIdeaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('SaaS idea not found');
    });
  });

  describe('PUT /api/projects/:id/ideas/:ideaId', () => {
    beforeEach(async () => {
      // Create a test idea
      const idea = new SaasIdea({
        projectId,
        description:
          'Original idea description that is long enough to pass validation requirements',
        targetAudience: 'Original target audience',
        problemStatement: 'Original problem statement that is detailed enough',
        desiredFeatures: ['Feature 1', 'Feature 2'],
        technicalPreferences: ['React', 'Node.js'],
      });
      await idea.save();
      ideaId = idea._id.toString();
    });

    it('should update idea successfully', async () => {
      const updateData = {
        description:
          'Updated idea description that is long enough to pass validation requirements',
        targetAudience: 'Updated target audience',
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SaaS idea updated successfully');
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.targetAudience).toBe(updateData.targetAudience);
    });

    it('should reject invalid update data', async () => {
      const invalidData = {
        description: 'Too short',
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /api/projects/:id/ideas/:ideaId', () => {
    beforeEach(async () => {
      // Create a test idea
      const idea = new SaasIdea({
        projectId,
        description:
          'Test idea description that is long enough to pass validation requirements',
        targetAudience: 'Test target audience',
        problemStatement: 'Test problem statement that is detailed enough',
        desiredFeatures: ['Feature 1', 'Feature 2'],
        technicalPreferences: ['React', 'Node.js'],
      });
      await idea.save();
      ideaId = idea._id.toString();
    });

    it('should delete idea successfully', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SaaS idea deleted successfully');

      // Verify idea is actually deleted
      const deletedIdea = await SaasIdea.findById(ideaId);
      expect(deletedIdea).toBeNull();
    });

    it('should return 404 for non-existent idea', async () => {
      const fakeIdeaId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/projects/${projectId}/ideas/${fakeIdeaId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('SaaS idea not found');
    });
  });
});
