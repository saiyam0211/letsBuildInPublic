import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../utils/logger.js';

/**
 * Create Redis configuration from environment variables
 * Supports both local Redis and Redis Cloud connections
 */
function createRedisConfig(): RedisOptions {
  // Check if REDIS_URL is provided (connection string format)
  if (process.env.REDIS_URL) {
    const url = process.env.REDIS_URL;
    
    // Parse Redis URL (supports both redis:// and rediss:// protocols)
    try {
      const parsedUrl = new URL(url);
      
      const config: RedisOptions = {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port) || (parsedUrl.protocol === 'rediss:' ? 6380 : 6379),
        db: parseInt(parsedUrl.pathname.slice(1)) || 0,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };

      // Add username if provided
      if (parsedUrl.username) {
        config.username = parsedUrl.username;
      }

      // Add password if provided
      if (parsedUrl.password) {
        config.password = parsedUrl.password;
      }

      // Enable TLS for rediss:// protocol
      if (parsedUrl.protocol === 'rediss:') {
        config.tls = {
          rejectUnauthorized: false,
          requestCert: false,
        };
      }

      logger.info('Redis configuration created from REDIS_URL', {
        host: config.host,
        port: config.port,
        tls: !!config.tls,
        db: config.db,
        hasUsername: !!config.username,
        hasPassword: !!config.password,
      });

      return config;
    } catch (error) {
      logger.error('Failed to parse REDIS_URL:', error);
      throw new Error(`Invalid REDIS_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fallback to individual environment variables
  const config: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '0'),
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };

  // Add username if provided
  if (process.env.REDIS_USERNAME) {
    config.username = process.env.REDIS_USERNAME;
  }

  // Add password if provided
  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }

  // Enable TLS if specified
  if (process.env.REDIS_TLS === 'true') {
    config.tls = {};
  }

  logger.info('Redis configuration created from individual env vars', {
    host: config.host,
    port: config.port,
    tls: !!config.tls,
    db: config.db,
    hasUsername: !!config.username,
    hasPassword: !!config.password,
  });

  return config;
}

/**
 * Create and configure Redis client
 */
export function createRedisClient(): Redis {
  const config = createRedisConfig();
  const redis = new Redis(config);

  // Connection event handlers
  redis.on('connect', () => {
    logger.info('Redis client connecting...', {
      host: config.host,
      port: config.port,
      tls: !!config.tls,
    });
  });

  redis.on('ready', () => {
    logger.info('Redis client ready and connected successfully');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error:', {
      error: error.message,
      host: config.host,
      port: config.port,
    });
  });

  redis.on('reconnecting', (time: number) => {
    logger.warn(`Redis client reconnecting in ${time}ms`);
  });

  redis.on('end', () => {
    logger.info('Redis connection ended');
  });

  return redis;
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(client: Redis): Promise<boolean> {
  try {
    const response = await client.ping();
    if (response === 'PONG') {
      logger.info('Redis connection test successful');
      return true;
    } else {
      logger.error('Redis connection test failed: unexpected response', { response });
      return false;
    }
  } catch (error) {
    logger.error('Redis connection test failed:', error);
    return false;
  }
} 