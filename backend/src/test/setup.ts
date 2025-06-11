// Unit test setup for backend
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';
import { setupCIEnvironment, cleanupLockFiles } from './ci-setup';
import path from 'path';
import fs from 'fs';

let mongoServer: MongoMemoryServer;

// Mock OpenAI API for test environment
if (process.env.NODE_ENV === 'test') {
  // Set test environment variables
  process.env.OPENAI_API_KEY =
    'sk-test-mock-api-key-for-testing-12345678901234567890';
  process.env.REDIS_URL = 'redis://localhost:6379'; // Mock Redis URL
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET =
    'test-jwt-refresh-secret-key-for-testing-only';
}

beforeAll(async () => {
  // Setup CI environment if running in CI
  setupCIEnvironment();

  // Setup in-memory MongoDB for unit testing
  try {
    // Create unique cache directory for CI environments to avoid lockfile conflicts
    const cacheDir = process.env.CI
      ? `/tmp/mongo-binaries-unit-${process.env.GITHUB_RUN_ID || Date.now()}`
      : path.join(process.cwd(), '.mongodb-binaries-unit');

    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Configure MongoDB Memory Server with CI-safe options
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.4', // Use a specific version to avoid download delays
        downloadDir: cacheDir, // Use unique directory to avoid conflicts
      },
      instance: {
        dbName: 'test_saas_blueprint_generator_unit',
        port: 0, // Let MongoDB choose an available port
        storageEngine: 'wiredTiger',
      },
    });

    const mongoUri = mongoServer.getUri();

    // Set the test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;

    // Connect to the in-memory database with optimized settings for testing
    await mongoose.connect(mongoUri, {
      maxPoolSize: 3, // Smaller pool for unit tests
      serverSelectionTimeoutMS: 15000, // Increased for CI environments
      socketTimeoutMS: 45000,
      bufferCommands: false,
      connectTimeoutMS: 30000, // Increased timeout for CI
    });

    logger.info('Unit test database connected successfully');
  } catch (error) {
    logger.error('Failed to setup unit test database:', error);
    throw error;
  }
}, 120000); // 120 second timeout for setup (increased for CI)

afterAll(async () => {
  // Cleanup test database connection with proper error handling
  try {
    // Close mongoose connection first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed');
    }

    // Stop MongoDB Memory Server with timeout
    if (mongoServer) {
      await Promise.race([
        mongoServer.stop(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB stop timeout')), 30000)
        ),
      ]);
      logger.info('MongoDB Memory Server stopped');
    }

    // Clean up lock files and cache directory in CI environment
    if (process.env.CI) {
      cleanupLockFiles();

      const cacheDir = `/tmp/mongo-binaries-unit-${process.env.GITHUB_RUN_ID || Date.now()}`;
      try {
        if (fs.existsSync(cacheDir)) {
          fs.rmSync(cacheDir, { recursive: true, force: true });
          logger.info('Cleaned up MongoDB cache directory');
        }
      } catch (cleanupError) {
        logger.warn('Failed to cleanup cache directory:', cleanupError);
        // Don't throw - this is not critical
      }
    }

    logger.info('Unit test database disconnected successfully');
  } catch (error) {
    logger.error('Error during unit test cleanup:', error);
    // Don't throw in cleanup to avoid masking test failures
  }
}, 60000); // 60 second timeout for cleanup

beforeEach(() => {
  // Reset any global state before each test
});

afterEach(() => {
  // Clean up after each test
});
