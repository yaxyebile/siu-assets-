const Asset = require('../models/Asset');
const Category = require('../models/Category');
const Department = require('../models/Department');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createLog } = require('../utils/activityLogger');
// Helper to resolve ID from Name if string provided
const resolveId = async (model, value) => {
    if (value && typeof value === 'string') {
        if (mongoose.Types.ObjectId.isValid(value)) return value;

        // Try case-insensitive and trimmed match
        const doc = await model.findOne({
            name: { $regex: new RegExp(`^${value.trim()}$`, 'i') }
        });

        if (doc) return doc._id;
        return null; // Return null if not found
    }
    return value;
};

/**
 * @route   GET /api/assets
 * @desc    Get all assets with filters
 * @access  Private
 */
const getAssets = async (req, res) => {
    try {
        const { status, department, category, search } = req.query;

        // Build query
        let query = {};

        if (status) {
            query.status = status;
        }

        if (department) {
            query.department = department;
        }

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { serialNumber: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const assets = await Asset.find(query)
            .populate('category', 'name')
            .populate('department', 'name')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: assets.length,
            data: assets
        });
    } catch (error) {
        console.error('Get assets error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/assets/:id
 * @desc    Get single asset
 * @access  Private
 */
const getAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id)
            .populate('category', 'name')
            .populate('department', 'name')
            .populate('assignedTo', 'name email phone')
            .populate('damageReports.reportedBy', 'name email');

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        res.json({
            success: true,
            data: asset
        });
    } catch (error) {
        console.error('Get asset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/assets/serial/:serialNumber
 * @desc    Get asset by serial number (QR scan)
 * @access  Private
 */
const getAssetBySerial = async (req, res) => {
    try {
        const asset = await Asset.findOne({ serialNumber: req.params.serialNumber })
            .populate('category', 'name')
            .populate('department', 'name')
            .populate('assignedTo', 'name email phone');

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        res.json({
            success: true,
            data: asset
        });
    } catch (error) {
        console.error('Get asset by serial error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/assets
 * @desc    Register new asset
 * @access  Private (admin/adminOfficer only)
 */
const createAsset = async (req, res) => {
    try {
        const assetData = { ...req.body };

        // Resolve Category and Department IDs
        if (assetData.category) {
            assetData.category = await resolveId(Category, assetData.category);
        }
        if (assetData.department) {
            assetData.department = await resolveId(Department, assetData.department);
        }

        // Sanitize & Resolve assignedTo
        if (assetData.assignedTo) {
            const userId = await resolveId(User, assetData.assignedTo);
            if (userId) {
                assetData.assignedTo = userId;
            } else {
                delete assetData.assignedTo; // Remove if not found/invalid to prevent CastError
            }
        } else {
            delete assetData.assignedTo; // Remove if empty string
        }

        // Generate Serial Number if missing
        if (!assetData.serialNumber) {
            let prefix = 'AST';
            if (assetData.category && mongoose.Types.ObjectId.isValid(assetData.category)) {
                const cat = await Category.findById(assetData.category);
                if (cat) prefix = cat.name.substring(0, 2).toUpperCase();
            }
            const random = Math.floor(1000 + Math.random() * 9000);
            assetData.serialNumber = `${prefix}${random}`;
        }

        // Check if serial number exists
        const existingAsset = await Asset.findOne({ serialNumber: assetData.serialNumber });
        if (existingAsset) {
            return res.status(400).json({
                success: false,
                message: 'Asset with this serial number already exists'
            });
        }

        // Create asset
        const asset = await Asset.create(assetData);

        // Populate references
        await asset.populate('category department');

        // Log activity
        await createLog('Asset Created', req.user, `Registered new asset: ${asset.name} (${asset.serialNumber})`);

        res.status(201).json({
            success: true,
            message: 'Asset registered successfully',
            data: asset
        });
    } catch (error) {
        console.error('Create asset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/assets/:id
 * @desc    Update asset
 * @access  Private (admin/adminOfficer only)
 */
const updateAsset = async (req, res) => {
    try {
        let asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        // Sanitize assignedTo in update
        if (req.body.assignedTo !== undefined) {
            if (req.body.assignedTo) {
                const userId = await resolveId(User, req.body.assignedTo);
                if (userId) {
                    req.body.assignedTo = userId;
                } else {
                    delete req.body.assignedTo;
                }
            } else {
                req.body.assignedTo = null; // Unassign if explicitly empty
            }
        }

        // Update asset
        asset = await Asset.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate('category department assignedTo');

        // Log activity
        await createLog('Asset Updated', req.user, `Updated asset: ${asset.name} (${asset.serialNumber})`);

        res.json({
            success: true,
            message: 'Asset updated successfully',
            data: asset
        });
    } catch (error) {
        console.error('Update asset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   DELETE /api/assets/:id
 * @desc    Delete asset
 * @access  Private (admin only)
 */
const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        await asset.deleteOne();

        // Log activity
        await createLog('Asset Deleted', req.user, `Deleted asset: ${asset.name} (${asset.serialNumber})`);

        res.json({
            success: true,
            message: 'Asset deleted successfully'
        });
    } catch (error) {
        console.error('Delete asset error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/assets/:id/damage
 * @desc    Add damage report to asset
 * @access  Private
 */
const addDamageReport = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        const { damageLevel, damagePercentage, location, description } = req.body;

        // Add damage report
        asset.damageReports.push({
            reportedBy: req.user._id,
            reportedByName: req.user.name,
            damageLevel,
            damagePercentage,
            location,
            description
        });

        // Update asset condition and status
        if (damageLevel === 'saaid') {
            asset.condition = 'Damaged';
            asset.status = 'maintenance';
        } else if (damageLevel === 'dhex-dhexaad') {
            asset.condition = 'Poor';
        } else {
            asset.condition = 'Fair';
        }

        // Calculate new current value based on damage
        const depreciationAmount = (asset.purchaseCost * damagePercentage) / 100;
        asset.currentValue = Math.max(0, asset.currentValue - depreciationAmount);

        await asset.save();

        // Log activity
        await createLog('Damage Report Added', req.user, `Added damage report for asset: ${asset.name}`);

        res.json({
            success: true,
            message: 'Damage report added successfully',
            data: asset
        });
    } catch (error) {
        console.error('Add damage report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/assets/damaged
 * @desc    Get damaged assets only
 * @access  Private
 */
const getDamagedAssets = async (req, res) => {
    try {
        const assets = await Asset.find({
            $or: [
                { condition: 'Damaged' },
                { 'damageReports.0': { $exists: true } }
            ]
        })
            .populate('category', 'name')
            .populate('department', 'name')
            .sort({ 'damageReports.date': -1 });

        res.json({
            success: true,
            count: assets.length,
            data: assets
        });
    } catch (error) {
        console.error('Get damaged assets error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/assets/statistics
 * @desc    Get asset statistics
 * @access  Private
 */
const getAssetStatistics = async (req, res) => {
    try {
        const totalAssets = await Asset.countDocuments();

        const statusCounts = await Asset.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const conditionCounts = await Asset.aggregate([
            {
                $group: {
                    _id: '$condition',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalValue = await Asset.aggregate([
            {
                $group: {
                    _id: null,
                    totalPurchaseCost: { $sum: '$purchaseCost' },
                    totalCurrentValue: { $sum: '$currentValue' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalAssets,
                byStatus: statusCounts,
                byCondition: conditionCounts,
                financials: totalValue[0] || { totalPurchaseCost: 0, totalCurrentValue: 0 }
            }
        });
    } catch (error) {
        console.error('Get asset statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getAssets,
    getAsset,
    getAssetBySerial,
    createAsset,
    updateAsset,
    deleteAsset,
    addDamageReport,
    getDamagedAssets,
    getAssetStatistics
};
