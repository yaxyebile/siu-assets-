const Asset = require('../models/Asset');

/**
 * @route   GET /api/reports/financial
 * @desc    Get financial reports
 * @access  Private (admin/adminOfficer only)
 */
const getFinancialReport = async (req, res) => {
    try {
        // Total purchase cost and current value
        const financialSummary = await Asset.aggregate([
            {
                $group: {
                    _id: null,
                    totalPurchaseCost: { $sum: '$purchaseCost' },
                    totalCurrentValue: { $sum: '$currentValue' },
                    assetCount: { $sum: 1 }
                }
            }
        ]);

        const summary = financialSummary[0] || {
            totalPurchaseCost: 0,
            totalCurrentValue: 0,
            assetCount: 0
        };

        // Calculate total depreciation
        const totalDepreciation = summary.totalPurchaseCost - summary.totalCurrentValue;

        // Damage costs
        const damagedAssets = await Asset.find({
            'damageReports.0': { $exists: true }
        });

        let totalDamageCost = 0;
        let damageReportsCount = 0;

        const damageBreakdown = {
            saaid: { count: 0, cost: 0 },
            'dhex-dhexaad': { count: 0, cost: 0 },
            'iska-roon': { count: 0, cost: 0 }
        };

        damagedAssets.forEach(asset => {
            asset.damageReports.forEach(report => {
                const damageCost = (asset.purchaseCost * (report.damagePercentage || 0)) / 100;
                if (!isNaN(damageCost)) {
                    totalDamageCost += damageCost;
                } else {
                    return; // Skip invalid reports
                }
                damageReportsCount++;

                damageBreakdown[report.damageLevel].count++;
                damageBreakdown[report.damageLevel].cost += damageCost;
            });
        });

        // Assets by status with values
        const assetsByStatus = await Asset.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$currentValue' }
                }
            }
        ]);

        // Assets by condition with values
        const assetsByCondition = await Asset.aggregate([
            {
                $group: {
                    _id: '$condition',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$currentValue' }
                }
            }
        ]);

        // Department-wise financial breakdown
        const departmentFinancials = await Asset.aggregate([
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
                    assetCount: { $sum: 1 },
                    totalPurchaseCost: { $sum: '$purchaseCost' },
                    totalCurrentValue: { $sum: '$currentValue' }
                }
            },
            {
                $project: {
                    _id: 1,
                    assetCount: 1,
                    totalPurchaseCost: 1,
                    totalCurrentValue: 1,
                    depreciation: { $subtract: ['$totalPurchaseCost', '$totalCurrentValue'] }
                }
            },
            {
                $sort: { totalCurrentValue: -1 }
            }
        ]);

        // Category-wise financial breakdown
        const categoryFinancials = await Asset.aggregate([
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
                    assetCount: { $sum: 1 },
                    totalPurchaseCost: { $sum: '$purchaseCost' },
                    totalCurrentValue: { $sum: '$currentValue' }
                }
            },
            {
                $project: {
                    _id: 1,
                    assetCount: 1,
                    totalPurchaseCost: 1,
                    totalCurrentValue: 1,
                    depreciation: { $subtract: ['$totalPurchaseCost', '$totalCurrentValue'] }
                }
            },
            {
                $sort: { totalCurrentValue: -1 }
            }
        ]);

        // Monthly purchase trends (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyPurchases = await Asset.aggregate([
            {
                $match: {
                    purchaseDate: { $gte: twelveMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$purchaseDate' },
                        month: { $month: '$purchaseDate' }
                    },
                    count: { $sum: 1 },
                    totalCost: { $sum: '$purchaseCost' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                summary: {
                    totalAssets: summary.assetCount,
                    totalPurchaseCost: summary.totalPurchaseCost,
                    totalCurrentValue: summary.totalCurrentValue,
                    totalDepreciation,
                    depreciationPercentage: summary.totalPurchaseCost > 0
                        ? ((totalDepreciation / summary.totalPurchaseCost) * 100).toFixed(2)
                        : 0,
                    totalDamageCost,
                    totalDamageReports: damageReportsCount
                },
                damageBreakdown,
                assetsByStatus,
                assetsByCondition,
                departmentFinancials,
                categoryFinancials,
                monthlyPurchases
            }
        });
    } catch (error) {
        console.error('Get financial report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getFinancialReport
};
