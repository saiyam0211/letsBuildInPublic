import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '@/models/User';
import { authConfig } from '@/config/auth';
import { logger } from '@/utils/logger';
import { EmailService } from './emailService';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export class AuthService {
  /**
   * Generate JWT access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn as string,
      issuer: 'saas-blueprint-generator',
      audience: 'saas-blueprint-users',
    } as SignOptions);
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, authConfig.jwt.refreshSecret, {
      expiresIn: authConfig.jwt.refreshExpiresIn as string,
      issuer: 'saas-blueprint-generator',
      audience: 'saas-blueprint-users',
    } as SignOptions);
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokens(user: IUser): AuthTokens {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Token is required and must be a string');
      }

      return jwt.verify(token, authConfig.jwt.secret, {
        issuer: 'saas-blueprint-generator',
        audience: 'saas-blueprint-users',
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.error('Access token has expired:', error);
        throw new Error('Access token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Malformed access token:', error);
        throw new Error('Malformed access token');
      } else if (error instanceof jwt.NotBeforeError) {
        logger.error('Access token not active yet:', error);
        throw new Error('Access token not active yet');
      } else {
        logger.error('Access token verification failed:', error);
        throw new Error('Invalid access token');
      }
    }
  }

  /**
   * Validate if a string is a properly formatted JWT token
   */
  private static isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    const parts = token.split('.');
    return parts.length === 3; // JWT consists of three parts separated by dots
  }

  /**
   * Verify refresh token and return payload
   */
  static verifyRefreshToken(refreshToken: string): TokenPayload {
    try {
      // Validate JWT format before attempting to verify
      if (!this.isValidJWT(refreshToken)) {
        throw new Error('Malformed refresh token');
      }

      return jwt.verify(refreshToken, authConfig.jwt.refreshSecret, {
        issuer: 'saas-blueprint-generator',
        audience: 'saas-blueprint-users',
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.error('Refresh token has expired:', error);
        throw new Error('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.error('Malformed refresh token:', error);
        throw new Error('Malformed refresh token');
      } else if (error instanceof jwt.NotBeforeError) {
        logger.error('Refresh token not active yet:', error);
        throw new Error('Refresh token not active yet');
      } else {
        logger.error('Refresh token verification failed:', error);
        throw new Error('Invalid refresh token');
      }
    }
  }

  /**
   * Register a new user
   */
  static async register(userData: RegisterData): Promise<{
    user: IUser;
    tokens: AuthTokens;
  }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user (password hashing is handled by pre-save middleware)
      const user = new User({
        email: userData.email,
        password: userData.password,
        name: userData.name,
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();

      await user.save();

      // Send verification email
      try {
        await EmailService.sendVerificationEmail(
          user.email,
          user.name,
          verificationToken
        );
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // Don't throw error - user is still registered, just email failed
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      logger.info(`New user registered: ${userData.email}`);

      return { user, tokens };
    } catch (error) {
      logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<{
    user: IUser;
    tokens: AuthTokens;
  }> {
    try {
      // Find user with password (using select +password)
      const user = await User.findOne({ email: credentials.email }).select(
        '+password'
      );

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = this.generateTokens(user);

      logger.info(`User logged in: ${credentials.email}`);

      return { user, tokens };
    } catch (error) {
      logger.error('User login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken);

      // Find user to ensure they still exist
      const user = await User.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID (for protected routes)
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      logger.error('Get user by ID failed:', error);
      throw new Error('User not found');
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updateData: Partial<Pick<IUser, 'name' | 'email'>>
  ): Promise<IUser> {
    try {
      // If email is being updated, check if it's already taken
      if (updateData.email) {
        const existingUser = await User.findOne({
          email: updateData.email,
          _id: { $ne: userId },
        });
        if (existingUser) {
          throw new Error('Email is already taken');
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      logger.info(`Profile updated for user: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid =
        await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password (hashing is handled by pre-save middleware)
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<IUser> {
    try {
      // Hash the received token to compare with stored hash
      const crypto = await import('crypto');
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with matching token that hasn't expired
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
      }).select('+emailVerificationToken +emailVerificationExpires');

      if (!user) {
        throw new Error('Invalid or expired verification token');
      }

      // Mark email as verified and clear verification fields
      await User.findByIdAndUpdate(user._id, {
        $set: { isEmailVerified: true },
        $unset: {
          emailVerificationToken: 1,
          emailVerificationExpires: 1,
        },
      });

      logger.info(`Email verified for user: ${user.email}`);

      // Refresh user object to reflect changes
      const updatedUser = await User.findById(user._id);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      return updatedUser;
    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  static async resendEmailVerification(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isEmailVerified) {
        throw new Error('Email is already verified');
      }

      // Generate new verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      await EmailService.sendVerificationEmail(
        user.email,
        user.name,
        verificationToken
      );

      logger.info(`Verification email resent to: ${user.email}`);
    } catch (error) {
      logger.error('Failed to resend verification email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async forgotPassword(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        // Don't reveal that the user doesn't exist for security reasons
        // Still return success but don't send email
        logger.info(
          `Password reset requested for non-existent email: ${email}`
        );
        return;
      }

      // Generate password reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // Send password reset email
      await EmailService.sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken
      );

      logger.info(`Password reset email sent to: ${user.email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Hash the received token to compare with stored hash
      const crypto = await import('crypto');
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with matching token that hasn't expired
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      }).select('+passwordResetToken +passwordResetExpires');

      if (!user) {
        throw new Error('Invalid or expired password reset token');
      }

      // Update password and clear reset fields
      user.password = newPassword;
      await User.findByIdAndUpdate(user._id, {
        $unset: {
          passwordResetToken: 1,
          passwordResetExpires: 1,
        },
      });

      // Save the password (hashing is handled by pre-save middleware)
      await user.save();

      logger.info(`Password reset successful for user: ${user.email}`);
    } catch (error) {
      logger.error('Password reset failed:', error);
      throw error;
    }
  }
}
