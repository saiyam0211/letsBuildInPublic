import rateLimit from 'express-rate-limit';
import { authConfig } from '@/config/auth';
import { logger } from '@/utils/logger';

/**
 * Rate limiting for authentication endpoints (login)
 * More restrictive to prevent brute force attacks
 */
export const authRateLimit = rateLimit({
  windowMs: authConfig.rateLimit.auth.windowMs,
  max: authConfig.rateLimit.auth.maxAttempts,
  message: {
    error: 'Too many login attempts',
    message: `Please try again after ${authConfig.rateLimit.auth.windowMs / 60000} minutes`,
    retryAfter: Math.ceil(authConfig.rateLimit.auth.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for auth endpoint from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts',
      message: `Please try again after ${authConfig.rateLimit.auth.windowMs / 60000} minutes`,
      retryAfter: Math.ceil(authConfig.rateLimit.auth.windowMs / 1000),
    });
  },
  skip: (_req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
});

/**
 * Rate limiting for registration endpoint
 * Prevents spam registrations
 */
export const registrationRateLimit = rateLimit({
  windowMs: authConfig.rateLimit.register.windowMs,
  max: authConfig.rateLimit.register.maxAttempts,
  message: {
    error: 'Too many registration attempts',
    message: `Please try again after ${authConfig.rateLimit.register.windowMs / 60000} minutes`,
    retryAfter: Math.ceil(authConfig.rateLimit.register.windowMs / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for registration endpoint from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many registration attempts',
      message: `Please try again after ${authConfig.rateLimit.register.windowMs / 60000} minutes`,
      retryAfter: Math.ceil(authConfig.rateLimit.register.windowMs / 1000),
    });
  },
  skip: (_req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
});

/**
 * General rate limiting for auth-related endpoints
 * Less restrictive for password changes, profile updates, etc.
 */
export const generalAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: 900, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`General auth rate limit exceeded from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: 900,
    });
  },
  skip: (_req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
}); 