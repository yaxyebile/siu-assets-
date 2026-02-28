const Asset = require('../models/Asset');
const Request = require('../models/Request');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Private
 */
const getDashboardAnalytics = async (req, res) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments();
        const usersByRole = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Asset statistics
        const totalAssets = await Asset.countDocuments();
        const assetsByStatus = await Asset.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const assetsByCondition = await Asset.aggregate([
            {
                $group: {
                    _id: '$condition',
                    count: { $sum: 1 }
                }
            }
        ]);

        const damagedAssetsCount = await Asset.countDocuments({
            $or: [
                { condition: 'Damaged' },
                { 'damageReports.0': { $exists: true } }
            ]
        });

        // Request statistics
        const totalRequests = await Request.countDocuments();
        const requestsByStatus = await Request.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const requestsByType = await Request.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const pendingRequests = await Request.countDocuments({ status: 'pending' });

        // Financial statistics
        const financialStats = await Asset.aggregate([
            {
                $group: {
                    _id: null,
                    totalPurchaseCost: { $sum: '$purchaseCost' },
                    totalCurrentValue: { $sum: '$currentValue' }
                }
            }
        ]);

        const totalDepreciation = financialStats[0]
            ? financialStats[0].totalPurchaseCost - financialStats[0].totalCurrentValue
            : 0;

        // Damage cost calculation
        const damagedAssets = await Asset.find({
            'damageReports.0': { $exists: true }
        });

        let totalDamageCost = 0;
        damagedAssets.forEach(asset => {
            asset.damageReports.forEach(report => {
                const cost = (asset.purchaseCost * (report.damagePercentage || 0)) / 100;
                if (!isNaN(cost)) {
                    totalDamageCost += cost;
                }
            });
        });

        // Department and Category counts
        const totalDepartments = await Department.countDocuments();
        const totalCategories = await Category.countDocuments();

        // Assets by department
        const assetsByDepartment = await Asset.aggregate([
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'departmentInfo'
                }
            },
            {
                $unwind: '$departmentInfo'
            },
            {
                $group: {
                    _id: '$departmentInfo.name',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Assets by category
        const assetsByCategory = await Asset.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: '$categoryInfo'
            },
            {
                $group: {
                    _id: '$categoryInfo.name',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Recent activities (last 10)
        const ActivityLog = require('../models/ActivityLog');
        const recentActivities = await ActivityLog.find()
            .populate('performedBy', 'name role')
            .sort({ timestamp: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    byRole: usersByRole
                },
                assets: {
                    total: totalAssets,
                    byStatus: assetsByStatus,
                    byCondition: assetsByCondition,
                    damaged: damagedAssetsCount,
                    byDepartment: assetsByDepartment,
                    byCategory: assetsByCategory
                },
                requests: {
                    total: totalRequests,
                    pending: pendingRequests,
                    byStatus: requestsByStatus,
                    byType: requestsByType
                },
                financials: {
                    totalPurchaseCost: financialStats[0]?.totalPurchaseCost || 0,
                    totalCurrentValue: financialStats[0]?.totalCurrentValue || 0,
                    totalDepreciation,
                    totalDamageCost
                },
                departments: totalDepartments,
                categories: totalCategories,
                recentActivities
            }
        });
    } catch (error) {
        console.error('Get dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardAnalytics
};
