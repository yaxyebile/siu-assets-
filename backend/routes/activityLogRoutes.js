const express = require('express');
const router = express.Router();
const {
    getActivityLogs,
    createActivityLog
} = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/activity-logs
 * @desc    Get all activity logs
 * @access  Private (admin/adminOfficer only)
 */
router.get('/', authorize('admin', 'adminOfficer'), getActivityLogs);

/**
 * @route   POST /api/activity-logs
 * @desc    Create activity log
 * @access  Private
 */
router.post('/', createActivityLog);

module.exports = router;
