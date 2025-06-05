import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
} from '@/controllers/authController';
import {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateProfileUpdate,
  validatePasswordChange,
} from '@/middleware/validation';
import {
  authRateLimit,
  registrationRateLimit,
  generalAuthRateLimit,
} from '@/middleware/rateLimit';
import { authenticateToken } from '@/middleware/auth';

const router = Router();

/**
 * Authentication Routes
 * All routes are prefixed with /api/auth
 */

// Public routes (no authentication required)

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registrationRateLimit, validateRegistration, register);

/**
 * POST /api/auth/login
 * Login user with email and password
 */
router.post('/login', authRateLimit, validateLogin, login);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  generalAuthRateLimit,
  validateRefreshToken,
  refreshToken
);

// Protected routes (authentication required)

/**
 * POST /api/auth/logout
 * Logout user (primarily client-side operation)
 */
router.post('/logout', authenticateToken, logout);

/**
 * GET /api/auth/profile
 * Get user profile information
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * PUT /api/auth/profile
 * Update user profile (name, email)
 */
router.put(
  '/profile',
  authenticateToken,
  generalAuthRateLimit,
  validateProfileUpdate,
  updateProfile
);

/**
 * PUT /api/auth/password
 * Change user password
 */
router.put(
  '/password',
  authenticateToken,
  generalAuthRateLimit,
  validatePasswordChange,
  changePassword
);

export default router;
