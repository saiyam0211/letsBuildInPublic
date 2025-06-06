import { Router } from 'express';
import {
  createProject,
  getUserProjects,
  getProjectDetails,
  updateProject,
  deleteProject,
  getProjectOverview,
} from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation rules for project creation
const createProjectValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Project description must be between 10 and 1000 characters'),
];

// Validation rules for project updates
const updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Project description must be between 10 and 1000 characters'),
  body('status')
    .optional()
    .isIn(['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'])
    .withMessage(
      'Status must be one of: planning, in-progress, completed, on-hold, cancelled'
    ),
];

// Validation rules for MongoDB ObjectId parameters
const objectIdValidation = [
  param('id').isMongoId().withMessage('Invalid project ID format'),
];

// Validation rules for query parameters
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'])
    .withMessage(
      'Status must be one of: planning, in-progress, completed, on-hold, cancelled'
    ),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (authenticated users)
 */
router.post(
  '/',
  authenticateToken,
  createProjectValidation,
  handleValidationErrors,
  createProject
);

/**
 * @route   GET /api/projects
 * @desc    Get user's projects with pagination and filtering
 * @access  Private (authenticated users)
 * @query   page - Page number for pagination (default: 1)
 * @query   limit - Number of projects per page (default: 10, max: 100)
 * @query   status - Filter by project status
 * @query   search - Search in project name and description
 */
router.get(
  '/',
  authenticateToken,
  queryValidation,
  handleValidationErrors,
  getUserProjects
);

/**
 * @route   GET /api/projects/:id
 * @desc    Get project details by ID
 * @access  Private (project owner only)
 */
router.get(
  '/:id',
  authenticateToken,
  objectIdValidation,
  handleValidationErrors,
  getProjectDetails
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private (project owner only)
 */
router.put(
  '/:id',
  authenticateToken,
  objectIdValidation,
  updateProjectValidation,
  handleValidationErrors,
  updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project and all associated data
 * @access  Private (project owner only)
 */
router.delete(
  '/:id',
  authenticateToken,
  objectIdValidation,
  handleValidationErrors,
  deleteProject
);

/**
 * @route   GET /api/projects/:id/overview
 * @desc    Get comprehensive project overview with analytics
 * @access  Private (project owner only)
 */
router.get(
  '/:id/overview',
  authenticateToken,
  objectIdValidation,
  handleValidationErrors,
  getProjectOverview
);

export default router;
