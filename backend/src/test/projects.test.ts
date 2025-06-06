import request from 'supertest';
import app from '../server';
import {
  connectTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
} from './helpers/db';
import { createTestUser } from './helpers/auth';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

describe('Project Management API', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Create test user and get auth token
    const { user, token } = await createTestUser();
    authToken = token;
    userId = user._id.toString();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        name: 'Test SaaS Project',
        description:
          'A comprehensive test project for SaaS blueprint generation',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project created successfully');
      expect(response.body.data.project.name).toBe(projectData.name);
      expect(response.body.data.project.description).toBe(
        projectData.description
      );
      expect(response.body.data.project.status).toBe('planning');
      expect(response.body.data.project.projectId).toBeDefined();

      projectId = response.body.data.project.projectId;
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return validation error for invalid field lengths', async () => {
      const projectData = {
        name: 'Ab', // Too short
        description: 'Short', // Too short
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should require authentication', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test project description for authentication test',
      };

      await request(app).post('/api/projects').send(projectData).expect(401);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create test projects
      const projects = [
        {
          name: 'Project Alpha',
          description: 'First test project for comprehensive testing',
          ownerId: new mongoose.Types.ObjectId(userId),
          status: 'planning',
        },
        {
          name: 'Project Beta',
          description: 'Second test project for pagination testing',
          ownerId: new mongoose.Types.ObjectId(userId),
          status: 'in-progress',
        },
        {
          name: 'Project Gamma',
          description: 'Third test project for filtering and search testing',
          ownerId: new mongoose.Types.ObjectId(userId),
          status: 'completed',
        },
      ];

      await Project.insertMany(projects);
    });

    it('should return user projects with pagination', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalProjects).toBe(3);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/projects?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].status).toBe('completed');
    });

    it('should search projects by name and description', async () => {
      const response = await request(app)
        .get('/api/projects?search=Alpha')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.projects[0].name).toContain('Alpha');
    });

    it('should require authentication', async () => {
      await request(app).get('/api/projects').expect(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    beforeEach(async () => {
      const project = new Project({
        name: 'Test Project Details',
        description: 'Project for testing detailed retrieval functionality',
        ownerId: new mongoose.Types.ObjectId(userId),
        status: 'planning',
      });

      const savedProject = await project.save();
      projectId = savedProject._id.toString();
    });

    it('should return project details', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.projectId).toBe(projectId);
      expect(response.body.data.project.name).toBe('Test Project Details');
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 for invalid project ID format', async () => {
      await request(app)
        .get('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PUT /api/projects/:id', () => {
    beforeEach(async () => {
      const project = new Project({
        name: 'Test Project Update',
        description: 'Project for testing update functionality',
        ownerId: new mongoose.Types.ObjectId(userId),
        status: 'planning',
      });

      const savedProject = await project.save();
      projectId = savedProject._id.toString();
    });

    it('should update project successfully', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated project description with new content',
        status: 'in-progress',
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.name).toBe(updateData.name);
      expect(response.body.data.project.description).toBe(
        updateData.description
      );
      expect(response.body.data.project.status).toBe(updateData.status);
    });

    it('should update project partially', async () => {
      const updateData = {
        status: 'completed',
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project.status).toBe(updateData.status);
      expect(response.body.data.project.name).toBe('Test Project Update');
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .put(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('should return 400 for invalid project ID format', async () => {
      await request(app)
        .put('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(400);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    beforeEach(async () => {
      const project = new Project({
        name: 'Test Project Delete',
        description: 'Project for testing deletion functionality',
        ownerId: new mongoose.Types.ObjectId(userId),
        status: 'planning',
      });

      const savedProject = await project.save();
      projectId = savedProject._id.toString();
    });

    it('should delete project successfully', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Project and all associated data deleted successfully'
      );

      // Verify project is actually deleted
      const deletedProject = await Project.findById(projectId);
      expect(deletedProject).toBeNull();
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .delete(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 for invalid project ID format', async () => {
      await request(app)
        .delete('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/projects/:id/overview', () => {
    beforeEach(async () => {
      const project = new Project({
        name: 'Test Project Overview',
        description:
          'Project for testing overview functionality with analytics',
        ownerId: new mongoose.Types.ObjectId(userId),
        status: 'in-progress',
      });

      const savedProject = await project.save();
      projectId = savedProject._id.toString();

      // Create associated data for testing analytics (simplified for now)
      // Note: These will create minimal test data since the actual models may have required fields
    });

    it('should return comprehensive project overview', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/overview`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.project.projectId).toBe(projectId);
      expect(response.body.data.overview.totalFeatures).toBeDefined();
      expect(response.body.data.overview.totalTasks).toBeDefined();
      expect(response.body.data.overview.completedTasks).toBeDefined();
      expect(response.body.data.overview.techStackStatus).toBeDefined();
      expect(response.body.data.overview.diagramsCount).toBeDefined();
      expect(response.body.data.overview.blueprintStatus).toBeDefined();
      expect(response.body.data.overview.ideaValidated).toBeDefined();
      expect(
        response.body.data.overview.progressPercentage
      ).toBeGreaterThanOrEqual(0);
      expect(
        response.body.data.overview.progressPercentage
      ).toBeLessThanOrEqual(100);
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/projects/${fakeId}/overview`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 400 for invalid project ID format', async () => {
      await request(app)
        .get('/api/projects/invalid-id/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
