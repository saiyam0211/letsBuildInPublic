import dotenv from 'dotenv';

dotenv.config();

export const authConfig = {
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-super-secret-jwt-key-for-development-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      'your-super-secret-refresh-key-for-development-only',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireNumbers: true,
    requireSpecialChars: true,
    requireUppercase: true,
    requireLowercase: true,
  },
  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5, // Maximum 5 login attempts per IP
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3, // Maximum 3 registration attempts per IP
    },
  },
  bcrypt: {
    saltRounds: 12,
  },
} as const;

export const validateAuthConfig = () => {
  // In test environment, use defaults and don't validate
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missingVars.join(', ')}. Using default values for development.`
    );
  }

  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key') {
    console.warn(
      '⚠️  Warning: Using default JWT_SECRET. Set a secure secret in production!'
    );
  }
};
