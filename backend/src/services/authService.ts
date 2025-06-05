import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '@/models/User';
import { authConfig } from '@/config/auth';
import { logger } from '@/utils/logger';

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
      return jwt.verify(token, authConfig.jwt.secret, {
        issuer: 'saas-blueprint-generator',
        audience: 'saas-blueprint-users',
      }) as TokenPayload;
    } catch (error) {
      logger.error('Access token verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, authConfig.jwt.refreshSecret, {
        issuer: 'saas-blueprint-generator',
        audience: 'saas-blueprint-users',
      }) as TokenPayload;
    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      throw new Error('Invalid or expired refresh token');
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

      await user.save();

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
      const isCurrentPasswordValid = await user.comparePassword(
        currentPassword
      );
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
} 