// Integration test setup for backend - Local Testing Configuration
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { logger } from '@/utils/logger';

let mongoServer: MongoMemoryServer;

// Test environment setup
const setupTestEnvironment = () => {
  // Ensure we're in test mode
  process.env.NODE_ENV = 'test';

  // Set mock OpenAI API key for tests
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY.includes('your_')
  ) {
    process.env.OPENAI_API_KEY =
      'sk-test-mock-api-key-for-testing-12345678901234567890';
  }

  // Set default JWT secrets for tests if not provided
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests-12345';
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET =
      'test-refresh-secret-for-integration-tests-67890';
  }

  // Mock Redis URL for tests (redis client will handle gracefully if not available)
  if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://localhost:6379';
  }

  // Set other test environment variables
  process.env.EMAIL_FROM = 'test@example.com';
  process.env.SMTP_HOST = 'localhost';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'test';
  process.env.SMTP_PASS = 'test';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.PORT = '3001';

  logger.info('🧪 Integration test environment configured');
};

// Database connection setup
const connectToDatabase = async () => {
  try {
    // Use MongoDB Memory Server for local testing
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
    logger.info('✅ Integration test database connected');
  } catch (error) {
    logger.error('❌ Integration test database connection failed:', error);
    throw error;
  }
};

// Database cleanup
const cleanupDatabase = async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();

    // Clear all test collections
    for (const collection of collections) {
      try {
        await collection.deleteMany({});
        logger.debug(
          `Cleared integration test collection: ${collection.collectionName}`
        );
      } catch (clearError) {
        logger.warn(
          `Failed to clear collection ${collection.collectionName}:`,
          clearError
        );
      }
    }
  }
};

// Database disconnection
const disconnectFromDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.debug('🔌 Integration test database disconnected');
    }

    if (mongoServer) {
      await mongoServer.stop();
      logger.debug('🛑 MongoDB Memory Server stopped (integration)');
    }
  } catch (error) {
    logger.error(
      '❌ Error disconnecting from integration test database:',
      error
    );
  }
};

// Test lifecycle setup for integration tests
beforeAll(async () => {
  logger.info('🚀 Setting up integration test environment...');
  setupTestEnvironment();
  await connectToDatabase();
}, 60000); // Longer timeout for integration tests

afterAll(async () => {
  logger.info('🧹 Cleaning up integration test environment...');
  await disconnectFromDatabase();
  logger.info('✅ Integration test environment cleanup completed');
}, 15000); // Longer timeout for cleanup

beforeEach(async () => {
  // Clean up test data before each integration test
  await cleanupDatabase();
});

afterEach(async () => {
  // Optional: Additional cleanup after each integration test
  // This ensures no test data leaks between tests
});
