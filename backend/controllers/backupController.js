const User = require('../models/User');
const Asset = require('../models/Asset');
const Request = require('../models/Request');
const Department = require('../models/Department');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');
const SMSHistory = require('../models/SMSHistory');

/**
 * @route   GET /api/backup/export
 * @desc    Export all data as JSON
 * @access  Private (admin only)
 */
const exportData = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        const assets = await Asset.find();
        const requests = await Request.find();
        const departments = await Department.find();
        const categories = await Category.find();
        const activityLogs = await ActivityLog.find();
        const smsHistory = await SMSHistory.find();

        const backupData = {
            exportDate: new Date(),
            version: '1.0',
            data: {
                users,
                assets,
                requests,
                departments,
                categories,
                activityLogs,
                smsHistory
            }
        };

        res.json({
            success: true,
            message: 'Data exported successfully',
            data: backupData
        });
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/backup/import
 * @desc    Import data from JSON
 * @access  Private (admin only)
 */
const importData = async (req, res) => {
    try {
        const { data, clearExisting } = req.body;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'No data provided for import'
            });
        }

        // Clear existing data if requested
        if (clearExisting) {
            await User.deleteMany({ role: { $ne: 'admin' } }); // Keep admin users
            await Asset.deleteMany({});
            await Request.deleteMany({});
            await Department.deleteMany({});
            await Category.deleteMany({});
            await ActivityLog.deleteMany({});
            await SMSHistory.deleteMany({});
        }

        let imported = {
            users: 0,
            assets: 0,
            requests: 0,
            departments: 0,
            categories: 0,
            activityLogs: 0,
            smsHistory: 0
        };

        // Import departments first (referenced by assets)
        if (data.departments && data.departments.length > 0) {
            await Department.insertMany(data.departments);
            imported.departments = data.departments.length;
        }

        // Import categories (referenced by assets)
        if (data.categories && data.categories.length > 0) {
            await Category.insertMany(data.categories);
            imported.categories = data.categories.length;
        }

        // Import users (referenced by assets and requests)
        if (data.users && data.users.length > 0) {
            // Filter out admin users if not clearing existing
            const usersToImport = clearExisting
                ? data.users
                : data.users.filter(u => u.role !== 'admin');

            if (usersToImport.length > 0) {
                await User.insertMany(usersToImport);
                imported.users = usersToImport.length;
            }
        }

        // Import assets
        if (data.assets && data.assets.length > 0) {
            await Asset.insertMany(data.assets);
            imported.assets = data.assets.length;
        }

        // Import requests
        if (data.requests && data.requests.length > 0) {
            await Request.insertMany(data.requests);
            imported.requests = data.requests.length;
        }

        // Import activity logs
        if (data.activityLogs && data.activityLogs.length > 0) {
            await ActivityLog.insertMany(data.activityLogs);
            imported.activityLogs = data.activityLogs.length;
        }

        // Import SMS history
        if (data.smsHistory && data.smsHistory.length > 0) {
            await SMSHistory.insertMany(data.smsHistory);
            imported.smsHistory = data.smsHistory.length;
        }

        // Log activity
        const { createLog } = require('../utils/activityLogger');
        await createLog('Data Import', req.user, `Imported data: ${JSON.stringify(imported)}`);

        res.json({
            success: true,
            message: 'Data imported successfully',
            imported
        });
    } catch (error) {
        console.error('Import data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    exportData,
    importData
};
