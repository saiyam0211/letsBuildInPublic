// CI-specific setup for GitHub Actions and other CI environments
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';

export function setupCIEnvironment(): void {
  // Set CI-specific environment variables
  if (process.env.CI) {
    // Increase timeouts for CI environment
    process.env.MONGO_TIMEOUT = '180000'; // 3 minutes
    process.env.TEST_TIMEOUT = '60000'; // 1 minute

    // Set MongoDB Memory Server specific options for CI
    process.env.MONGOMS_DOWNLOAD_MIRROR = 'https://fastdl.mongodb.org';
    process.env.MONGOMS_VERSION = '6.0.4';
    process.env.MONGOMS_PREFER_GLOBAL_PATH = '1';
    process.env.MONGOMS_DISABLE_POSTINSTALL = '1';

    // Prevent lockfile conflicts
    process.env.MONGOMS_SYSTEM_BINARY = '';

    // GitHub Actions specific settings
    if (process.env.GITHUB_ACTIONS) {
      process.env.GITHUB_RUN_ID =
        process.env.GITHUB_RUN_ID || Date.now().toString();
      logger.info(
        `GitHub Actions detected - Run ID: ${process.env.GITHUB_RUN_ID}`
      );

      // Set GitHub Actions specific MongoDB settings
      process.env.MONGOMS_DOWNLOAD_DIR = `/tmp/mongo-binaries-${process.env.GITHUB_RUN_ID}`;
    }

    // Clean up any existing lock files
    cleanupLockFiles();

    logger.info('CI environment configured for MongoDB Memory Server');
  }
}

export function cleanupLockFiles(): void {
  try {
    // Clean up potential lock files from previous runs
    const possibleLockDirs = [
      '/tmp',
      '/home/runner/.cache/mongodb-binaries',
      process.env.HOME
        ? path.join(process.env.HOME, '.cache/mongodb-binaries')
        : null,
    ].filter(Boolean);

    possibleLockDirs.forEach(dir => {
      if (dir && fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            if (file.endsWith('.lock') && file.includes('mongodb')) {
              const lockFile = path.join(dir, file);
              fs.unlinkSync(lockFile);
              logger.info(`Cleaned up lock file: ${lockFile}`);
            }
          });
        } catch (cleanupError) {
          logger.warn(`Failed to cleanup locks in ${dir}:`, cleanupError);
        }
      }
    });
  } catch (error) {
    logger.warn('Lock file cleanup failed:', error);
    // Don't throw - this is not critical
  }
}

export function getCacheDirectory(type: 'unit' | 'integration'): string {
  if (process.env.CI) {
    const runId =
      process.env.GITHUB_RUN_ID || process.env.CI_JOB_ID || Date.now();
    return `/tmp/mongo-binaries-${type}-${runId}`;
  }

  return `./node_modules/.cache/mongodb-memory-server-${type}`;
}

export function getTestTimeouts(): {
  testTimeout: number;
  hookTimeout: number;
  setupTimeout: number;
} {
  if (process.env.CI) {
    return {
      testTimeout: 60000, // 1 minute
      hookTimeout: 300000, // 5 minutes
      setupTimeout: 300000, // 5 minutes
    };
  }

  return {
    testTimeout: 30000, // 30 seconds
    hookTimeout: 120000, // 2 minutes
    setupTimeout: 120000, // 2 minutes
  };
}
