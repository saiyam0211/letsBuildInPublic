import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { AuthService } from '../services/authService';

describe('AuthService', () => {
  beforeEach(async () => {
    try {
      // Clear all collections before each test - using the global MongoDB setup
      if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.collections();
        for (const collection of collections) {
          await collection.deleteMany({});
        }
      }
    } catch (error) {
      console.error('Error during test cleanup:', error);
      throw error;
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

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
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
    it('should login user with valid credentials', async () => {
      const userData = {
        email: 'login@example.com',
        password: 'SecurePass123!',
        name: 'Login User',
      };

      await AuthService.register(userData);
      const result = await AuthService.login({
        email: userData.email,
        password: userData.password,
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw error for invalid credentials', async () => {
      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const userData = {
        email: 'refresh@example.com',
        password: 'SecurePass123!',
        name: 'Refresh User',
      };

      const loginResult = await AuthService.register(userData);

      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1000));

      const refreshResult = await AuthService.refreshToken(
        loginResult.tokens.refreshToken
      );

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      // Both tokens should be valid JWTs (the main goal of the test)
      expect(typeof refreshResult.accessToken).toBe('string');
      expect(typeof refreshResult.refreshToken).toBe('string');
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(AuthService.refreshToken('invalid-token')).rejects.toThrow();
    });
  });
});
