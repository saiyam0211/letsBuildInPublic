/* eslint-disable no-undef */
import Redis from 'ioredis';

console.log('🔍 Testing Upstash Redis Connection...\n');

// Reconstruct the URL properly (without line breaks)
const upstashUrl = 'redis://default:ATN-AAIjcDE0MTIzOTMzNWQ3YjA0NTdkODRiYjYzZGMzNzA2ODU1NXAxMA@vast-basilisk-13182.upstash.io:6379';
const upstashUrlTLS = 'rediss://default:ATN-AAIjcDE0MTIzOTMzNWQ3YjA0NTdkODRiYjYzZGMzNzA2ODU1NXAxMA@vast-basilisk-13182.upstash.io:6380';

console.log('Testing URLs:');
console.log('Non-TLS:', upstashUrl);
console.log('TLS:', upstashUrlTLS);

async function testConnection(url, label) {
  console.log(`\n🔗 Testing ${label}...`);
  
  try {
    const redis = new Redis(url, {
      connectTimeout: 10000,
      maxRetriesPerRequest: 2,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    // Add event listeners for debugging
    redis.on('connect', () => console.log(`✅ ${label} - Connected`));
    redis.on('ready', () => console.log(`✅ ${label} - Ready`));
    redis.on('error', (err) => console.log(`❌ ${label} - Error:`, err.message));
    redis.on('close', () => console.log(`🔌 ${label} - Connection closed`));

    await redis.ping();
    console.log(`✅ ${label} - Ping successful!`);

    // Test basic operations
    await redis.set('test:upstash', 'connection-test');
    const result = await redis.get('test:upstash');
    console.log(`✅ ${label} - Set/Get test:`, result);

    await redis.del('test:upstash');
    await redis.quit();
    console.log(`✅ ${label} - Test completed successfully!`);
    
    return true;
  } catch (error) {
    console.log(`❌ ${label} - Failed:`, error.message);
    return false;
  }
}

async function runTests() {
  const results = await Promise.allSettled([
    testConnection(upstashUrl, 'Non-TLS (port 6379)'),
    testConnection(upstashUrlTLS, 'TLS (port 6380)')
  ]);

  console.log('\n📊 Test Results:');
  results.forEach((result, index) => {
    const label = index === 0 ? 'Non-TLS' : 'TLS';
    const success = result.status === 'fulfilled' && result.value;
    console.log(`${success ? '✅' : '❌'} ${label}: ${success ? 'SUCCESS' : 'FAILED'}`);
  });

  const successfulTest = results.find(r => r.status === 'fulfilled' && r.value);
  if (successfulTest) {
    const workingUrl = results[0].status === 'fulfilled' && results[0].value ? upstashUrl : upstashUrlTLS;
    console.log('\n🎯 Recommended REDIS_URL:');
    console.log(workingUrl);
  } else {
    console.log('\n❌ No working connection found. Check your Upstash credentials.');
  }
}

runTests().catch(console.error); 