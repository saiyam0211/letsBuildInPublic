// CI-specific setup for GitHub Actions and other CI environments
import { logger } from '@/utils/logger';

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

    // GitHub Actions specific settings
    if (process.env.GITHUB_ACTIONS) {
      process.env.GITHUB_RUN_ID =
        process.env.GITHUB_RUN_ID || Date.now().toString();
      logger.info(
        `GitHub Actions detected - Run ID: ${process.env.GITHUB_RUN_ID}`
      );
    }

    // Disable problematic features in CI
    process.env.MONGOMS_DISABLE_POSTINSTALL = '1';

    logger.info('CI environment configured for MongoDB Memory Server');
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
