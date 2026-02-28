const express = require('express');
const router = express.Router();
const { getFinancialReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/reports/financial
 * @desc    Get financial reports
 * @access  Private (admin/adminOfficer only)
 */
router.get('/financial', authorize('admin', 'adminOfficer'), getFinancialReport);

module.exports = router;
