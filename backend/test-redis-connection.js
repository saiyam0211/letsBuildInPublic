#!/usr/bin/env node

/**
 * Redis Cloud Connection Test
 * Tests the Redis connection configuration
 */

import dotenv from 'dotenv';
import { createRedisClient, testRedisConnection } from './src/config/redis.js';
import { logger } from './src/utils/logger.js';

// Load environment variables
dotenv.config();

async function testRedis() {
  console.log('🔧 Testing Redis Cloud Connection...\n');

  let client;
  
  try {
    // Create Redis client
    console.log('📡 Creating Redis client...');
    client = createRedisClient();

    // Test basic connection
    console.log('🔍 Testing connection...');
    const isConnected = await testRedisConnection(client);

    if (!isConnected) {
      throw new Error('Redis connection test failed');
    }

    // Test basic operations
    console.log('✅ Connection successful! Testing basic operations...\n');

    // Test SET/GET
    console.log('📝 Testing SET/GET operations...');
    await client.set('test:connection', 'Redis Cloud is working!');
    const value = await client.get('test:connection');
    console.log(`   SET: test:connection = "Redis Cloud is working!"`);
    console.log(`   GET: test:connection = "${value}"`);

    if (value !== 'Redis Cloud is working!') {
      throw new Error('SET/GET operation failed');
    }

    // Test expiration
    console.log('⏰ Testing expiration...');
    await client.setex('test:expire', 2, 'This will expire in 2 seconds');
    const expireValue = await client.get('test:expire');
    console.log(`   SETEX: test:expire = "${expireValue}" (expires in 2s)`);

    // Test hash operations
    console.log('🗂️  Testing hash operations...');
    await client.hset('test:hash', 'field1', 'value1', 'field2', 'value2');
    const hashValue = await client.hgetall('test:hash');
    console.log(`   HSET: test:hash = ${JSON.stringify(hashValue)}`);

    // Test list operations
    console.log('📋 Testing list operations...');
    await client.del('test:list'); // Clear any existing list
    await client.lpush('test:list', 'item1', 'item2', 'item3');
    const listLength = await client.llen('test:list');
    const listItems = await client.lrange('test:list', 0, -1);
    console.log(`   LPUSH: test:list length = ${listLength}`);
    console.log(`   LRANGE: test:list = [${listItems.join(', ')}]`);

    // Test Redis info
    console.log('📊 Testing Redis info...');
    const info = await client.info('server');
    const lines = info.split('\r\n').filter(line => line && !line.startsWith('#'));
    const serverInfo = {};
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) serverInfo[key] = value;
    });

    console.log(`   Redis Version: ${serverInfo.redis_version || 'Unknown'}`);
    console.log(`   Redis Mode: ${serverInfo.redis_mode || 'Unknown'}`);
    console.log(`   Architecture: ${serverInfo.arch_bits || 'Unknown'} bit`);

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await client.del('test:connection', 'test:expire', 'test:hash', 'test:list');

    console.log('\n🎉 All Redis tests passed successfully!');
    console.log('✅ Redis Cloud is properly configured and working');

    // Show connection details (without sensitive info)
    const options = client.options;
    console.log('\n📋 Connection Details:');
    console.log(`   Host: ${options.host}`);
    console.log(`   Port: ${options.port}`);
    console.log(`   Database: ${options.db || 0}`);
    console.log(`   TLS: ${!!options.tls}`);
    console.log(`   Username: ${options.username || '(none)'}`);
    console.log(`   Password: ${options.password ? '[CONFIGURED]' : '[NOT SET]'}`);

  } catch (error) {
    console.error('\n❌ Redis connection test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check your REDIS_URL or Redis host configuration');
      console.error('   2. Verify your internet connection');
      console.error('   3. Make sure Redis Cloud database is active');
    } else if (error.message.includes('WRONGPASS')) {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Verify your Redis password is correct');
      console.error('   2. Check if username is required (use "default" for Redis Cloud)');
      console.error('   3. Ensure your Redis Cloud user has the right permissions');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check if Redis Cloud database is running');
      console.error('   2. Verify the port number is correct');
      console.error('   3. Check your IP allowlist in Redis Cloud settings');
    }

    console.error('\n📖 For setup help, see: backend/REDIS_SETUP.md');
    process.exit(1);

  } finally {
    if (client) {
      console.log('\n🔌 Disconnecting...');
      await client.quit();
      console.log('👋 Disconnected from Redis');
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  process.exit(0);
});

// Run the test
testRedis().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 