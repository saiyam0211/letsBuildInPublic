import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../server';

describe('Authentication API Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let request: supertest.SuperTest<supertest.Test>;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    request = supertest(app);
  });

  afterEach(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should return validation error for invalid input', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        name: '',
      };

      const response = await request
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      // Register user first time
      await request.post('/api/auth/register').send(userData).expect(201);

      // Try to register same user again
      const response = await request
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('Registration failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a test user
      await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });
    });

    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const response = await request
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const response = await request
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error).toBe('Authentication failed');
    });

    it('should return validation error for missing fields', async () => {
      const credentials = {
        email: 'test@example.com',
        // password missing
      };

      const response = await request
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      const response = await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });
      accessToken = response.body.data.tokens.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.name).toBe('Test User');
    });

    it('should return error without token', async () => {
      const response = await request
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });

    it('should return error with invalid token', async () => {
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });
      accessToken = response.body.data.tokens.accessToken;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const response = await request
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.email).toBe(updateData.email);
    });

    it('should return error without authentication', async () => {
      const response = await request
        .put('/api/auth/profile')
        .send({ name: 'New Name' })
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should return error for invalid refresh token', async () => {
      const response = await request
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toBe('Token refresh failed');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request.post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      });
      accessToken = response.body.data.tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should require authentication', async () => {
      const response = await request
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.error).toBe('Access denied');
    });
  });
}); 