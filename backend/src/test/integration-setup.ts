// Integration test setup for backend
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';
import { setupCIEnvironment, cleanupLockFiles } from './ci-setup';
import path from 'path';
import fs from 'fs';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Setup CI environment if running in CI
  setupCIEnvironment();

  // Setup in-memory MongoDB for integration testing
  try {
    // Ensure any existing connection is closed first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Create unique cache directory for CI environments to avoid lockfile conflicts
    const cacheDir = process.env.CI
      ? `/tmp/mongo-binaries-integration-${process.env.GITHUB_RUN_ID || Date.now()}`
      : path.join(process.cwd(), '.mongodb-binaries-integration');

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
        dbName: 'test_saas_blueprint_generator_integration',
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
      maxPoolSize: 5, // Reasonable pool for integration tests
      serverSelectionTimeoutMS: 20000, // Increased timeout for integration environment
      socketTimeoutMS: 45000,
      bufferCommands: false,
      connectTimeoutMS: 30000, // Increased timeout for CI
    });

    logger.info('Integration test database connected successfully');
  } catch (error) {
    logger.error('Failed to setup integration test database:', error);
    throw error;
  }
}, 150000); // 150 second timeout for setup (increased for CI integration tests)

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
          setTimeout(() => reject(new Error('MongoDB stop timeout')), 45000)
        ),
      ]);
      logger.info('MongoDB Memory Server stopped');
    }

    // Clean up lock files and cache directory in CI environment
    if (process.env.CI) {
      cleanupLockFiles();

      const cacheDir = `/tmp/mongo-binaries-integration-${process.env.GITHUB_RUN_ID || Date.now()}`;
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

    logger.info('Integration test database disconnected successfully');
  } catch (error) {
    logger.error('Error during integration test cleanup:', error);
    // Don't throw in cleanup to avoid masking test failures
  }
}, 90000); // 90 second timeout for cleanup

beforeEach(async () => {
  // Clear all collections before each test
  try {
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.collections();

      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    logger.error('Error clearing integration test data:', error);
    throw error;
  }
});

afterEach(() => {
  // Clean up after each test if needed
  // This is useful for any test-specific cleanup
});
