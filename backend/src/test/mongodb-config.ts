// MongoDB Memory Server configuration for tests
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';
import path from 'path';
import fs from 'fs';

export interface MongoTestConfig {
  type: 'unit' | 'integration';
  dbName: string;
  cacheDir: string;
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  connectTimeoutMS: number;
}

export function createMongoTestConfig(
  type: 'unit' | 'integration'
): MongoTestConfig {
  const runId =
    process.env.GITHUB_RUN_ID || process.env.CI_JOB_ID || Date.now();

  return {
    type,
    dbName: `test_saas_blueprint_generator_${type}`,
    cacheDir: process.env.CI
      ? `/tmp/mongo-binaries-${type}-${runId}`
      : path.join(process.cwd(), `.mongodb-binaries-${type}`),
    maxPoolSize: type === 'unit' ? 3 : 5,
    serverSelectionTimeoutMS: type === 'unit' ? 15000 : 20000,
    connectTimeoutMS: 30000,
  };
}

export async function createMongoMemoryServer(
  config: MongoTestConfig
): Promise<MongoMemoryServer> {
  // Ensure cache directory exists
  if (!fs.existsSync(config.cacheDir)) {
    fs.mkdirSync(config.cacheDir, { recursive: true });
  }

  // Create MongoDB Memory Server with CI-safe configuration
  const mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '6.0.4',
      downloadDir: config.cacheDir,
    },
    instance: {
      dbName: config.dbName,
      port: 0, // Let MongoDB choose an available port
      storageEngine: 'wiredTiger',
    },
  });

  return mongoServer;
}

export async function connectToMongo(
  mongoServer: MongoMemoryServer,
  config: MongoTestConfig
): Promise<void> {
  const mongoUri = mongoServer.getUri();

  // Set environment variables
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongoUri;

  // Connect with optimized settings
  await mongoose.connect(mongoUri, {
    maxPoolSize: config.maxPoolSize,
    serverSelectionTimeoutMS: config.serverSelectionTimeoutMS,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    connectTimeoutMS: config.connectTimeoutMS,
  });

  logger.info(`${config.type} test database connected successfully`);
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info('Mongoose connection closed');
  }
}

export async function stopMongoMemoryServer(
  mongoServer: MongoMemoryServer,
  timeoutMs = 30000
): Promise<void> {
  if (mongoServer) {
    await Promise.race([
      mongoServer.stop(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB stop timeout')), timeoutMs)
      ),
    ]);
    logger.info('MongoDB Memory Server stopped');
  }
}

export function cleanupCacheDirectory(config: MongoTestConfig): void {
  if (process.env.CI) {
    try {
      if (fs.existsSync(config.cacheDir)) {
        fs.rmSync(config.cacheDir, { recursive: true, force: true });
        logger.info('Cleaned up MongoDB cache directory');
      }
    } catch (cleanupError) {
      logger.warn('Failed to cleanup cache directory:', cleanupError);
      // Don't throw - this is not critical
    }
  }
}
