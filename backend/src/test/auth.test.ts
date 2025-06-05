import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AuthService } from '../services/authService';

describe('AuthService', () => {
  beforeEach(async () => {
    // Clear all collections before each test - using the global MongoDB setup
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      const result = await AuthService.register(userData);

      expect(result).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      };

      await AuthService.register(userData);

      await expect(AuthService.register(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await AuthService.register({
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

      const result = await AuthService.login(credentials);

      expect(result.user.email).toBe(credentials.email);
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw error with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      await expect(AuthService.login(credentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });
});
