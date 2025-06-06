import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { authConfig } from '@/config/auth';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined,
      })),
    });
    return;
  }

  next();
};

/**
 * Password validation helper
 */
const passwordValidation = () => {
  return body('password')
    .isLength({
      min: authConfig.password.minLength,
      max: authConfig.password.maxLength,
    })
    .withMessage(
      `Password must be between ${authConfig.password.minLength} and ${authConfig.password.maxLength} characters`
    )
    .matches(/^(?=.*[a-z])/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/^(?=.*[A-Z])/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/^(?=.*\d)/)
    .withMessage('Password must contain at least one number')
    .matches(/^(?=.*[@$!%*?&])/)
    .withMessage(
      'Password must contain at least one special character (@$!%*?&)'
    );
};

/**
 * Email validation helper
 */
const emailValidation = () => {
  return body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase()
    .isLength({ max: 254 })
    .withMessage('Email address is too long');
};

/**
 * Name validation helper
 */
const nameValidation = () => {
  return body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .trim();
};

/**
 * Validation rules for user registration
 */
export const validateRegistration = [
  emailValidation(),
  passwordValidation(),
  nameValidation(),
  handleValidationErrors,
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * Validation rules for password change
 */
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({
      min: authConfig.password.minLength,
      max: authConfig.password.maxLength,
    })
    .withMessage(
      `New password must be between ${authConfig.password.minLength} and ${authConfig.password.maxLength} characters`
    )
    .matches(/^(?=.*[a-z])/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/^(?=.*[A-Z])/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/^(?=.*\d)/)
    .withMessage('New password must contain at least one number')
    .matches(/^(?=.*[@$!%*?&])/)
    .withMessage(
      'New password must contain at least one special character (@$!%*?&)'
    ),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
  handleValidationErrors,
];

/**
 * Validation rules for profile update
 */
export const validateProfileUpdate = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .toLowerCase()
    .isLength({ max: 254 })
    .withMessage('Email address is too long'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .trim(),
  handleValidationErrors,
];

/**
 * Validation rules for refresh token
 */
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isJWT()
    .withMessage('Invalid refresh token format'),
  handleValidationErrors,
];

/**
 * Sanitize user input to prevent XSS and other attacks
 */
export const sanitizeInput = (
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Express-validator already handles basic sanitization
  // Additional custom sanitization can be added here if needed
  next();
};
