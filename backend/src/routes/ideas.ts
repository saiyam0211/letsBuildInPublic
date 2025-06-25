import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  submitIdea,
  getIdeaDetails,
  getProjectIdeas,
  updateIdea,
  deleteIdea,
  processIdeaById,
  getIdeaProcessingStatus,
} from '../controllers/ideaController.js';
import { authenticateToken } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = Router({ mergeParams: true });

// Validation schemas
const ideaValidation = [
  body('description')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  body('targetAudience')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Target audience must be between 10 and 500 characters'),
  body('problemStatement')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Problem statement must be between 20 and 1000 characters'),
  body('desiredFeatures')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Desired features must be an array with maximum 20 items'),
  body('desiredFeatures.*')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Each feature must be between 5 and 200 characters'),
  body('technicalPreferences')
    .optional()
    .isArray({ max: 15 })
    .withMessage(
      'Technical preferences must be an array with maximum 15 items'
    ),
  body('technicalPreferences.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      'Each technical preference must be between 2 and 50 characters'
    ),
];

const updateIdeaValidation = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  body('targetAudience')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Target audience must be between 10 and 500 characters'),
  body('problemStatement')
    .optional()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Problem statement must be between 20 and 1000 characters'),
  body('desiredFeatures')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Desired features must be an array with maximum 20 items'),
  body('desiredFeatures.*')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Each feature must be between 5 and 200 characters'),
  body('technicalPreferences')
    .optional()
    .isArray({ max: 15 })
    .withMessage(
      'Technical preferences must be an array with maximum 15 items'
    ),
  body('technicalPreferences.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(
      'Each technical preference must be between 2 and 50 characters'
    ),
];

const projectIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Project ID must be a valid MongoDB ObjectId'),
];

const ideaIdValidation = [
  param('ideaId')
    .isMongoId()
    .withMessage('Idea ID must be a valid MongoDB ObjectId'),
];

/**
 * @route   POST /api/projects/:id/ideas
 * @desc    Submit a new SaaS idea for a project
 * @access  Private (project members only)
 */
router.post(
  '/',
  authenticateToken,
  [...projectIdValidation, ...ideaValidation],
  handleValidationErrors,
  submitIdea
);

/**
 * @route   GET /api/projects/:id/ideas
 * @desc    Get all SaaS ideas for a project
 * @access  Private (project members only)
 */
router.get(
  '/',
  authenticateToken,
  projectIdValidation,
  handleValidationErrors,
  getProjectIdeas
);

/**
 * @route   GET /api/projects/:id/ideas/:ideaId
 * @desc    Get SaaS idea details by ID
 * @access  Private (project members only)
 */
router.get(
  '/:ideaId',
  authenticateToken,
  [...projectIdValidation, ...ideaIdValidation],
  handleValidationErrors,
  getIdeaDetails
);

/**
 * @route   PUT /api/projects/:id/ideas/:ideaId
 * @desc    Update a SaaS idea
 * @access  Private (project members only)
 */
router.put(
  '/:ideaId',
  authenticateToken,
  [...projectIdValidation, ...ideaIdValidation, ...updateIdeaValidation],
  handleValidationErrors,
  updateIdea
);

/**
 * @route   DELETE /api/projects/:id/ideas/:ideaId
 * @desc    Delete a SaaS idea
 * @access  Private (project members only)
 */
router.delete(
  '/:ideaId',
  authenticateToken,
  [...projectIdValidation, ...ideaIdValidation],
  handleValidationErrors,
  deleteIdea
);

/**
 * @route   POST /api/projects/:id/ideas/:ideaId/process
 * @desc    Trigger AI processing for a specific SaaS idea
 * @access  Private (project members only)
 */
router.post(
  '/:ideaId/process',
  authenticateToken,
  [...projectIdValidation, ...ideaIdValidation],
  handleValidationErrors,
  processIdeaById
);

/**
 * @route   GET /api/projects/:id/ideas/:ideaId/status
 * @desc    Get AI processing status for a specific SaaS idea
 * @access  Private (project members only)
 */
router.get(
  '/:ideaId/status',
  authenticateToken,
  [...projectIdValidation, ...ideaIdValidation],
  handleValidationErrors,
  getIdeaProcessingStatus
);

export default router;
