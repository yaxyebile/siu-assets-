const ActivityLog = require('../models/ActivityLog');

/**
 * @route   GET /api/activity-logs
 * @desc    Get all activity logs with pagination
 * @access  Private (admin/adminOfficer only)
 */
const getActivityLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const { action, performedBy } = req.query;

        // Build query
        let query = {};

        if (action) {
            query.action = { $regex: action, $options: 'i' };
        }

        if (performedBy) {
            query.performedBy = performedBy;
        }

        const logs = await ActivityLog.find(query)
            .populate('performedBy', 'name email role')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await ActivityLog.countDocuments(query);

        res.json({
            success: true,
            count: logs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: logs
        });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/activity-logs
 * @desc    Create activity log (manual)
 * @access  Private
 */
const createActivityLog = async (req, res) => {
    try {
        const { action, details } = req.body;

        const log = await ActivityLog.create({
            action,
            performedBy: req.user._id,
            performedByName: req.user.name,
            details
        });

        res.status(201).json({
            success: true,
            message: 'Activity log created',
            data: log
        });
    } catch (error) {
        console.error('Create activity log error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getActivityLogs,
    createActivityLog
};
