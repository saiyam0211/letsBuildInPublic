// Script to predownload MongoDB binaries for CI environments
import { MongoMemoryServer } from 'mongodb-memory-server';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';

async function downloadMongoBinary() {
  try {
    logger.info('Starting MongoDB binary download for CI...');

    // Create cache directories
    const unitCacheDir = process.env.CI
      ? `/tmp/mongo-binaries-unit-${process.env.GITHUB_RUN_ID || Date.now()}`
      : path.join(process.cwd(), '.mongodb-binaries-unit');

    const integrationCacheDir = process.env.CI
      ? `/tmp/mongo-binaries-integration-${process.env.GITHUB_RUN_ID || Date.now()}`
      : path.join(process.cwd(), '.mongodb-binaries-integration');

    // Ensure directories exist
    [unitCacheDir, integrationCacheDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created cache directory: ${dir}`);
      }
    });

    // Download binary for unit tests
    logger.info('Downloading MongoDB binary for unit tests...');
    const unitServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.4',
        downloadDir: unitCacheDir,
      },
      instance: {
        dbName: 'predownload_unit_test',
        port: 0,
        storageEngine: 'wiredTiger',
      },
    });

    logger.info('Unit test MongoDB binary downloaded successfully');
    await unitServer.stop();

    // Download binary for integration tests (using same binary but different cache)
    logger.info('Downloading MongoDB binary for integration tests...');
    const integrationServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.4',
        downloadDir: integrationCacheDir,
      },
      instance: {
        dbName: 'predownload_integration_test',
        port: 0,
        storageEngine: 'wiredTiger',
      },
    });

    logger.info('Integration test MongoDB binary downloaded successfully');
    await integrationServer.stop();

    logger.info('✅ MongoDB binaries downloaded successfully for CI');
    logger.info(`Unit cache: ${unitCacheDir}`);
    logger.info(`Integration cache: ${integrationCacheDir}`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to download MongoDB binaries:', error);
    process.exit(1);
  }
}

// Run the download if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadMongoBinary();
}

export { downloadMongoBinary };
