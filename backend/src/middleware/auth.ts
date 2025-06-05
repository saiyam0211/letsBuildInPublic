import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '@/services/authService';
import { logger } from '@/utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Protects routes by validating JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
      return;
    }

    // Verify token
    const decoded = AuthService.verifyAccessToken(token);
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.error('Token authentication failed:', error);
    res.status(403).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired',
    });
  }
};

/**
 * Optional Authentication Middleware
 * Adds user info to request if token is present and valid, but doesn't block the request
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = AuthService.verifyAccessToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid but we don't block the request
        logger.warn('Optional auth failed:', error);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 * Note: Currently all users have the same role, but prepared for future RBAC
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      _res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
      return;
    }

    // For now, all authenticated users are considered 'user' role
    // This can be extended when we add role field to User model
    const userRole = 'user';
    
    if (!roles.includes(userRole)) {
      _res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource',
      });
      return;
    }

    next();
  };
};

/**
 * Check if user owns the resource
 * Compares the authenticated user's ID with a resource's userId field
 */
export const requireResourceOwnership = (userIdPath: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource',
      });
      return;
    }

    const resourceUserId = req.params[userIdPath] || req.body[userIdPath];
    
    if (req.user.userId !== resourceUserId) {
      res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources',
      });
      return;
    }

    next();
  };
}; 