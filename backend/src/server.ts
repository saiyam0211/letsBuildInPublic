import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase, checkDatabaseHealth } from '@/config/database';
import { validateAuthConfig } from '@/config/auth';
import { logger } from '@/utils/logger';
import mongoose from 'mongoose';

// Import routes
import authRoutes from '@/routes/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection
async function initializeDatabase() {
  try {
    // Skip database initialization in test environment if already connected
    if (
      process.env.NODE_ENV === 'test' &&
      mongoose.connection.readyState === 1
    ) {
      logger.info('Database already connected in test environment');
      return;
    }

    await connectDatabase();
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Validate authentication configuration
try {
  validateAuthConfig();
  logger.info('Authentication configuration validated');
} catch (error) {
  logger.error('Authentication configuration validation failed:', error);
  process.exit(1);
}

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with database status
app.get('/health', async (_req, res) => {
  const dbHealthy = await checkDatabaseHealth();

  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'OK' : 'Service Unavailable',
    message: 'SaaS Blueprint Generator API is running',
    database: dbHealthy ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.get('/api', (_req, res) => {
  res.json({
    message: '🚀 Welcome to SaaS Blueprint Generator API',
    version: '1.0.0',
    status: 'Phase 2.1 Complete - Authentication & User Management Ready',
    nextPhase: 'Phase 2.2 - Project CRUD Operations',
    features: {
      completed: [
        'Express server setup',
        'Security middleware',
        'CORS configuration',
        'Rate limiting',
        'Environment configuration',
        'MongoDB connection',
        'Database models and schemas',
        'Data validation and indexing',
        'Database seed scripts',
        'JWT authentication system',
        'User registration and login',
        'Token refresh mechanism',
        'Password hashing and security',
        'Role-based access control foundation',
        'Input validation and sanitization',
        'Authentication rate limiting',
      ],
      upcoming: [
        'Project CRUD operations',
        'AI integration',
        'Blueprint generation engine',
        'Real-time collaboration',
      ],
    },
    database: {
      models: [
        'User',
        'Project',
        'SaasIdea',
        'IdeaValidation',
        'Feature',
        'TechStackRecommendation',
        'Task',
        'Diagram',
        'ProjectBoard',
        'Blueprint',
        'MCPAgent',
        'ExternalIntegration',
      ],
    },
    endpoints: {
      health: '/health',
      api: '/api',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/password',
      },
    },
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`,
  });
});

// Error interface for proper typing
interface HttpError extends Error {
  status?: number;
}

// Error handling middleware
app.use((err: HttpError, _req: express.Request, res: express.Response) => {
  logger.error('Error:', err);

  const status = err.status || 500;

  res.status(status).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  // Initialize database and start server
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      logger.info(`
🚀 SaaS Blueprint Generator API Server Started
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server running on: http://localhost:${PORT}
🔗 API endpoint: http://localhost:${PORT}/api
💊 Health check: http://localhost:${PORT}/health
🔐 Authentication: http://localhost:${PORT}/api/auth
🗄️  Database: MongoDB connected
⏰ Started at: ${new Date().toISOString()}
    `);
    });
  });
}

export default app;
