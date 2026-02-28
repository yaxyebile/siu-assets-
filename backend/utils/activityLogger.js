const ActivityLog = require('../models/ActivityLog');

/**
 * Create activity log entry
 * @param {string} action - Action performed
 * @param {Object} user - User object with _id and name
 * @param {string} details - Details of the action
 */
const createLog = async (action, user, details) => {
    try {
        await ActivityLog.create({
            action,
            performedBy: user._id,
            performedByName: user.name,
            details
        });
    } catch (error) {
        console.error('Error creating activity log:', error);
    }
};

module.exports = { createLog };
