const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getRequests,
    getRequest,
    createRequest,
    approveRequest,
    rejectRequest,
    getMyRequests
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/requests/my
 * @desc    Get my requests
 * @access  Private
 */
router.get('/my', getMyRequests);

/**
 * @route   GET /api/requests
 * @desc    Get all requests
 * @access  Private
 */
router.get('/', getRequests);

/**
 * @route   GET /api/requests/:id
 * @desc    Get single request
 * @access  Private
 */
router.get('/:id', getRequest);

/**
 * @route   POST /api/requests
 * @desc    Create new request
 * @access  Private
 */
router.post(
    '/',
    [
        body('assetName').trim().notEmpty().withMessage('Asset name is required'),
        body('type').isIn(['asset-registration', 'asset-damage', 'asset-transfer', 'usage', 'status-change', 'maintenance', 'transfer']).withMessage('Invalid request type'),
        body('details').trim().notEmpty().withMessage('Details are required'),
        validate
    ],
    createRequest
);

/**
 * @route   PUT /api/requests/:id/approve
 * @desc    Approve request
 * @access  Private (admin/adminOfficer only)
 */
router.put('/:id/approve', authorize('admin', 'adminOfficer'), approveRequest);

/**
 * @route   PUT /api/requests/:id/reject
 * @desc    Reject request
 * @access  Private (admin/adminOfficer only)
 */
router.put(
    '/:id/reject',
    authorize('admin', 'adminOfficer'),
    [
        body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
        validate
    ],
    rejectRequest
);

module.exports = router;
