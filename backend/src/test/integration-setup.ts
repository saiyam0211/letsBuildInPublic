// Integration test setup for backend
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Setup in-memory MongoDB for integration testing
  try {
    // Ensure any existing connection is closed first
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Configure MongoDB Memory Server with specific options for faster startup
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.4', // Use a specific version to avoid download delays
      },
      instance: {
        dbName: 'test_saas_blueprint_generator_integration',
        port: 0, // Let MongoDB choose an available port
      },
    });

    const mongoUri = mongoServer.getUri();

    // Set the test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;

    // Connect to the in-memory database with optimized settings for testing
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5, // Reasonable pool for integration tests
      serverSelectionTimeoutMS: 15000, // Longer timeout for integration environment
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    logger.info('Integration test database connected successfully');
  } catch (error) {
    logger.error('Failed to setup integration test database:', error);
    throw error;
  }
}, 90000); // 90 second timeout for setup (integration tests need more time)

afterAll(async () => {
  // Cleanup test database connection
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }

    logger.info('Integration test database disconnected successfully');
  } catch (error) {
    logger.error('Error during integration test cleanup:', error);
    // Don't throw in cleanup to avoid masking test failures
  }
}, 45000); // 45 second timeout for cleanup

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
