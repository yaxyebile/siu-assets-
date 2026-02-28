const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getUsers,
    getUser,
    getUsersByRole,
    createUser,
    updateUser,
    deleteUser,
    changePassword
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (admin only)
 */
router.get('/', authorize('admin'), getUsers);

/**
 * @route   GET /api/users/role/:role
 * @desc    Get users by role
 * @access  Private
 */
router.get('/role/:role', getUsersByRole);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 * @access  Private
 */
router.get('/:id', getUser);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (admin/adminOfficer only)
 */
router.post(
    '/',
    authorize('admin', 'adminOfficer'),
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['admin', 'adminOfficer', 'adminOperation']).withMessage('Invalid role'),
        validate
    ],
    createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (admin/adminOfficer only)
 */
router.put('/:id', authorize('admin', 'adminOfficer'), updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (admin only)
 */
router.delete('/:id', authorize('admin', 'adminOfficer'), deleteUser);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Change user password
 * @access  Private
 */
router.put(
    '/:id/password',
    [
        body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
        validate
    ],
    changePassword
);

module.exports = router;
