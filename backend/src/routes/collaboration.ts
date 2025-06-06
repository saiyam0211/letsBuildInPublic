import { Router } from 'express';
import {
  getProjectMembers,
  inviteToProject,
  acceptInvitation,
  declineInvitation,
  updateMemberRole,
  removeMember,
  getProjectInvitations,
  getProjectActivity,
  getActivityAnalytics,
} from '../controllers/collaborationController';
import { authenticateToken } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation rules for project ID parameters
const projectIdValidation = [
  param('id').isMongoId().withMessage('Invalid project ID format'),
];

// Validation rules for member ID parameters
const memberIdValidation = [
  param('memberId').isMongoId().withMessage('Invalid member ID format'),
];

// Validation rules for invitation token parameters
const tokenValidation = [
  param('token')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid invitation token format'),
];

// Validation rules for invitation creation
const inviteValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('role')
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Role must be one of: admin, editor, viewer'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
];

// Validation rules for role updates
const roleUpdateValidation = [
  body('role')
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Role must be one of: admin, editor, viewer'),
];

// Validation rules for query parameters
const memberQueryValidation = [
  query('status')
    .optional()
    .isIn(['active', 'pending', 'suspended'])
    .withMessage('Status must be one of: active, pending, suspended'),
  query('role')
    .optional()
    .isIn(['owner', 'admin', 'editor', 'viewer'])
    .withMessage('Role must be one of: owner, admin, editor, viewer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const invitationQueryValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'declined', 'expired', 'cancelled'])
    .withMessage(
      'Status must be one of: pending, accepted, declined, expired, cancelled'
    ),
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const activityQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('actions')
    .optional()
    .isString()
    .withMessage('Actions must be a comma-separated string'),
  query('severity')
    .optional()
    .isString()
    .withMessage('Severity must be a comma-separated string'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];

const analyticsQueryValidation = [
  query('period')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Period must be one of: day, week, month'),
];

/**
 * @route   GET /api/projects/:id/members
 * @desc    Get project members with filtering and pagination
 * @access  Private (project members only)
 * @query   status - Filter by member status
 * @query   role - Filter by member role
 * @query   page - Page number for pagination
 * @query   limit - Number of members per page
 */
router.get(
  '/projects/:id/members',
  authenticateToken,
  projectIdValidation,
  memberQueryValidation,
  handleValidationErrors,
  getProjectMembers
);

/**
 * @route   POST /api/projects/:id/invite
 * @desc    Invite a user to join the project
 * @access  Private (admins and owners only)
 * @body    email - Email address of the user to invite
 * @body    role - Role to assign to the invited user
 * @body    message - Optional invitation message
 */
router.post(
  '/projects/:id/invite',
  authenticateToken,
  projectIdValidation,
  inviteValidation,
  handleValidationErrors,
  inviteToProject
);

/**
 * @route   GET /api/projects/:id/invitations
 * @desc    Get project invitations with filtering and pagination
 * @access  Private (users with invite permission only)
 * @query   status - Filter by invitation status
 * @query   search - Search by email address
 * @query   page - Page number for pagination
 * @query   limit - Number of invitations per page
 */
router.get(
  '/projects/:id/invitations',
  authenticateToken,
  projectIdValidation,
  invitationQueryValidation,
  handleValidationErrors,
  getProjectInvitations
);

/**
 * @route   PUT /api/projects/:id/members/:memberId
 * @desc    Update a project member's role
 * @access  Private (admins and owners only)
 * @body    role - New role for the member
 */
router.put(
  '/projects/:id/members/:memberId',
  authenticateToken,
  projectIdValidation,
  memberIdValidation,
  roleUpdateValidation,
  handleValidationErrors,
  updateMemberRole
);

/**
 * @route   DELETE /api/projects/:id/members/:memberId
 * @desc    Remove a member from the project
 * @access  Private (admins and owners only)
 */
router.delete(
  '/projects/:id/members/:memberId',
  authenticateToken,
  projectIdValidation,
  memberIdValidation,
  handleValidationErrors,
  removeMember
);

/**
 * @route   POST /api/invitations/:token/accept
 * @desc    Accept a project invitation
 * @access  Private (authenticated user matching invitation email)
 */
router.post(
  '/invitations/:token/accept',
  authenticateToken,
  tokenValidation,
  handleValidationErrors,
  acceptInvitation
);

/**
 * @route   POST /api/invitations/:token/decline
 * @desc    Decline a project invitation
 * @access  Public (no authentication required)
 */
router.post(
  '/invitations/:token/decline',
  tokenValidation,
  handleValidationErrors,
  declineInvitation
);

/**
 * @route   GET /api/projects/:id/activity
 * @desc    Get project activity feed with filtering and pagination
 * @access  Private (project members only)
 * @query   page - Page number for pagination
 * @query   limit - Number of activity logs per page
 * @query   actions - Comma-separated list of actions to filter by
 * @query   severity - Comma-separated list of severity levels to filter by
 * @query   userId - Filter by specific user ID
 * @query   startDate - Filter by activity start date (ISO 8601)
 * @query   endDate - Filter by activity end date (ISO 8601)
 */
router.get(
  '/projects/:id/activity',
  authenticateToken,
  projectIdValidation,
  activityQueryValidation,
  handleValidationErrors,
  getProjectActivity
);

/**
 * @route   GET /api/projects/:id/activity/analytics
 * @desc    Get project activity analytics
 * @access  Private (users with analytics permission only)
 * @query   period - Time period for analytics (day, week, month)
 */
router.get(
  '/projects/:id/activity/analytics',
  authenticateToken,
  projectIdValidation,
  analyticsQueryValidation,
  handleValidationErrors,
  getActivityAnalytics
);

export default router;
