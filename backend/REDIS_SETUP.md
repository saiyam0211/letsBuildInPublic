# Redis Cloud Integration Guide

## 🚀 Quick Setup for Redis Cloud

### Step 1: Get Your Redis Cloud Connection Details

1. **Login to Redis Cloud**: Go to your [Redis Cloud Console](https://app.redislabs.com)
2. **Find Your Database**: Navigate to your database dashboard
3. **Get Connection Details**: Click "Connect" button on your database

You'll see connection details like:
```
Host: redis-12345.c1.cloud.redislabs.com
Port: 12345
Username: default
Password: your_password_here
```

### Step 2: Configure Environment Variables

Create a `.env` file in your `backend/` directory with one of these options:

#### Option 1: Redis Connection String (RECOMMENDED)
```env
# Complete Redis Cloud connection string
REDIS_URL=rediss://default:your_password@redis-12345.c1.cloud.redislabs.com:12345

# Your other environment variables
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
```

#### Option 2: Individual Redis Configuration
```env
# Redis Cloud connection details
REDIS_HOST=redis-12345.c1.cloud.redislabs.com
REDIS_PORT=12345
REDIS_USERNAME=default
REDIS_PASSWORD=your_password_here
REDIS_TLS=true
REDIS_DB=0

# Your other environment variables
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
```

### Step 3: Test the Connection

Run the connection test:

```bash
# From the backend directory
npm run test:redis
```

Or test manually:
```bash
node -e "
import { createRedisClient, testRedisConnection } from './src/config/redis.js';
const client = createRedisClient();
testRedisConnection(client).then(success => {
  console.log('Redis connection:', success ? '✅ Connected' : '❌ Failed');
  process.exit(success ? 0 : 1);
});
"
```

### Step 4: Verify Integration

Start your backend server:
```bash
npm run dev
```

Check the health endpoint:
```bash
curl http://localhost:5001/api/health
```

Look for Redis status in the response:
```json
{
  "success": true,
  "services": {
    "database": "Connected",
    "redis": "Connected",
    "websocket": "Connected",
    "queue": "Connected"
  }
}
```

## 🔧 Redis Cloud Connection String Format

### Standard Format
```
rediss://[username]:[password]@[host]:[port][/database]
```

### Examples
```bash
# Basic connection with password only
rediss://:mypassword@redis-12345.c1.cloud.redislabs.com:12345

# With username and password
rediss://default:mypassword@redis-12345.c1.cloud.redislabs.com:12345

# With specific database number
rediss://default:mypassword@redis-12345.c1.cloud.redislabs.com:12345/0
```

## 🔐 Security Best Practices

1. **Use TLS**: Always use `rediss://` (with 's') for Redis Cloud
2. **Strong Passwords**: Use the generated password from Redis Cloud
3. **Environment Variables**: Never commit `.env` files to git
4. **Access Control**: Configure IP allowlists in Redis Cloud if needed

## 🏗️ Current Implementation Features

Our Redis integration supports:

✅ **Background Job Processing** - Bull queue with Redis
✅ **Real-time Progress Tracking** - Job status stored in Redis  
✅ **WebSocket Session Management** - User sessions in Redis
✅ **Automatic Reconnection** - Built-in retry logic
✅ **Health Monitoring** - Connection status checks
✅ **TLS Support** - Secure connections to Redis Cloud

## 🚨 Troubleshooting

### Common Issues

**Connection Timeout**
```
Error: connect ETIMEDOUT
```
- Check your IP allowlist in Redis Cloud
- Verify the host and port are correct
- Ensure TLS is enabled (`rediss://`)

**Authentication Failed**
```
Error: WRONGPASS invalid username-password pair
```
- Double-check your username and password
- Make sure you're using the correct database user

**TLS Certificate Issues**
```
Error: unable to verify the first certificate
```
- Use `rediss://` (not `redis://`) for Redis Cloud
- Redis Cloud requires TLS connections

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
```

Then check the logs for detailed Redis connection information.

## 📊 Monitoring & Performance

### Queue Statistics
```bash
# Get queue stats
curl http://localhost:5001/api/queue/stats
```

### Health Checks
```bash
# Check all services
curl http://localhost:5001/api/health

# Check queue health specifically  
curl http://localhost:5001/api/queue/health
```

### Redis Memory Usage
Monitor your Redis Cloud dashboard for:
- Memory usage
- Connection count
- Operations per second
- Hit ratio

## 🎯 Next Steps

After Redis Cloud is connected, you can:

1. **Test Job Processing**: Run `npm run demo:processing-pipeline`
2. **Monitor WebSockets**: Check real-time updates in browser dev tools
3. **Scale Queue Workers**: Add more Bull queue processors
4. **Enable Caching**: Add Redis caching for API responses

Your application now has enterprise-grade Redis caching and job processing! 🎉 