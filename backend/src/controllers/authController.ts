import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import { logger } from '@/utils/logger';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    const result = await AuthService.register({ email, password, name });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });

    logger.info(`User registered successfully: ${email}`);
  } catch (error) {
    logger.error('Registration failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({
          error: 'Registration failed',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('validation')) {
        res.status(400).json({
          error: 'Validation error',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Registration failed',
      message: 'An unexpected error occurred during registration',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await AuthService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });

    logger.info(`User logged in successfully: ${email}`);
  } catch (error) {
    logger.error('Login failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid email or password')) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Login failed',
      message: 'An unexpected error occurred during login',
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const tokens = await AuthService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens,
      },
    });

    logger.info('Token refreshed successfully');
  } catch (error) {
    logger.error('Token refresh failed:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Invalid') ||
        error.message.includes('expired')
      ) {
        res.status(401).json({
          error: 'Token refresh failed',
          message: 'Invalid or expired refresh token',
        });
        return;
      }

      if (error.message.includes('User not found')) {
        res.status(404).json({
          error: 'Token refresh failed',
          message: 'User associated with token not found',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An unexpected error occurred during token refresh',
    });
  }
};

/**
 * Logout user (client-side token removal)
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a JWT stateless system, logout is primarily handled client-side
    // Server-side logout would require token blacklisting (Redis, etc.)
    // For now, we'll just return a success response

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });

    logger.info(`User logged out: ${req.user?.email || 'unknown'}`);
  } catch (error) {
    logger.error('Logout failed:', error);

    res.status(500).json({
      error: 'Logout failed',
      message: 'An unexpected error occurred during logout',
    });
  }
};

/**
 * Get user profile
 * GET /api/auth/profile
 */
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
      return;
    }

    const user = await AuthService.getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({
        error: 'User not found',
        message: 'User profile not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user,
      },
    });

    logger.info(`Profile retrieved for user: ${user.email}`);
  } catch (error) {
    logger.error('Get profile failed:', error);

    res.status(500).json({
      error: 'Profile retrieval failed',
      message: 'An unexpected error occurred while retrieving profile',
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
      return;
    }

    const { name, email } = req.body;
    const updateData: { name?: string; email?: string } = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        error: 'No data to update',
        message: 'Please provide name or email to update',
      });
      return;
    }

    const user = await AuthService.updateProfile(req.user.userId, updateData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
      },
    });

    logger.info(`Profile updated for user: ${user.email}`);
  } catch (error) {
    logger.error('Profile update failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('already taken')) {
        res.status(409).json({
          error: 'Profile update failed',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Profile update failed',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Profile update failed',
      message: 'An unexpected error occurred while updating profile',
    });
  }
};

/**
 * Change user password
 * PUT /api/auth/password
 */
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });

    logger.info(`Password changed for user: ${req.user.email}`);
  } catch (error) {
    logger.error('Password change failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('incorrect')) {
        res.status(400).json({
          error: 'Password change failed',
          message: 'Current password is incorrect',
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          error: 'Password change failed',
          message: 'User not found',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Password change failed',
      message: 'An unexpected error occurred while changing password',
    });
  }
};

/**
 * Verify email with token
 * GET /api/auth/verify-email/:token
 */
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        error: 'Verification failed',
        message: 'Verification token is required',
      });
      return;
    }

    const user = await AuthService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user,
      },
    });

    logger.info(`Email verified for user: ${user.email}`);
  } catch (error) {
    logger.error('Email verification failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired')) {
        res.status(400).json({
          error: 'Verification failed',
          message: 'Invalid or expired verification token',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Verification failed',
      message: 'An unexpected error occurred during email verification',
    });
  }
};

/**
 * Resend email verification
 * POST /api/auth/resend-verification
 */
export const resendEmailVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: 'Resend verification failed',
        message: 'Email is required',
      });
      return;
    }

    await AuthService.resendEmailVerification(email);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });

    logger.info(`Verification email resent to: ${email}`);
  } catch (error) {
    logger.error('Resend verification failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        res.status(404).json({
          error: 'Resend verification failed',
          message: 'User not found',
        });
        return;
      }

      if (error.message.includes('already verified')) {
        res.status(400).json({
          error: 'Resend verification failed',
          message: 'Email is already verified',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Resend verification failed',
      message:
        'An unexpected error occurred while resending verification email',
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: 'Password reset failed',
        message: 'Email is required',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Password reset failed',
        message: 'Please provide a valid email address',
      });
      return;
    }

    await AuthService.forgotPassword(email);

    // Always return success for security reasons (don't reveal if email exists)
    res.status(200).json({
      success: true,
      message:
        'If your email address exists in our system, you will receive a password reset link shortly',
    });

    logger.info(`Password reset requested for: ${email}`);
  } catch (error) {
    logger.error('Password reset request failed:', error);

    res.status(500).json({
      error: 'Password reset failed',
      message:
        'An unexpected error occurred while processing password reset request',
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token) {
      res.status(400).json({
        error: 'Password reset failed',
        message: 'Reset token is required',
      });
      return;
    }

    if (!newPassword) {
      res.status(400).json({
        error: 'Password reset failed',
        message: 'New password is required',
      });
      return;
    }

    if (!confirmPassword) {
      res.status(400).json({
        error: 'Password reset failed',
        message: 'Password confirmation is required',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        error: 'Password reset failed',
        message: 'Passwords do not match',
      });
      return;
    }

    // Password strength validation
    if (newPassword.length < 8) {
      res.status(400).json({
        error: 'Password reset failed',
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    await AuthService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message:
        'Password reset successfully. You can now login with your new password',
    });

    logger.info(
      `Password reset completed for token: ${token.substring(0, 10)}...`
    );
  } catch (error) {
    logger.error('Password reset failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('Invalid or expired')) {
        res.status(400).json({
          error: 'Password reset failed',
          message:
            'Invalid or expired password reset token. Please request a new password reset',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Password reset failed',
      message: 'An unexpected error occurred while resetting password',
    });
  }
};
