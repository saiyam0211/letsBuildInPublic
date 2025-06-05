// Unit test setup for backend
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Setup in-memory MongoDB for unit testing
  try {
    // Configure MongoDB Memory Server with specific options for faster startup
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.4', // Use a specific version to avoid download delays
      },
      instance: {
        dbName: 'test_saas_blueprint_generator_unit',
      },
    });

    const mongoUri = mongoServer.getUri();

    // Set the test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = mongoUri;

    // Connect to the in-memory database with optimized settings for testing
    await mongoose.connect(mongoUri, {
      maxPoolSize: 3, // Smaller pool for unit tests
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    logger.info('Unit test database connected successfully');
  } catch (error) {
    logger.error('Failed to setup unit test database:', error);
    throw error;
  }
}, 60000); // 60 second timeout for setup

afterAll(async () => {
  // Cleanup test database connection
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    if (mongoServer) {
      await mongoServer.stop();
    }

    logger.info('Unit test database disconnected successfully');
  } catch (error) {
    logger.error('Error during unit test cleanup:', error);
    // Don't throw in cleanup to avoid masking test failures
  }
}, 30000); // 30 second timeout for cleanup

beforeEach(() => {
  // Reset any global state before each test
});

afterEach(() => {
  // Clean up after each test
});
