const express = require('express');
const router = express.Router();
const { exportData, importData } = require('../controllers/backupController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

/**
 * @route   GET /api/backup/export
 * @desc    Export all data
 * @access  Private (admin only)
 */
router.get('/export', exportData);

/**
 * @route   POST /api/backup/import
 * @desc    Import data
 * @access  Private (admin only)
 */
router.post('/import', importData);

module.exports = router;
