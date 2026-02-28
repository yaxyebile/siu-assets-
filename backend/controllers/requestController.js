const Request = require('../models/Request');
const Asset = require('../models/Asset');
const Department = require('../models/Department');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { createLog } = require('../utils/activityLogger');
const { notifyAdminOfficers, notifyUser } = require('../utils/smsService');

// Helper to resolve ID from Name if string provided
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
 * @route   GET /api/requests
 * @desc    Get all requests with filters
 * @access  Private
 */
const getRequests = async (req, res) => {
    try {
        const { status, type, user, assetId } = req.query;

        // Build query
        let query = {};

        if (status) {
            query.status = status;
        }

        if (type) {
            query.type = type;
        }

        if (user) {
            query.requestedBy = user;
        }

        if (assetId) {
            query.assetId = assetId;
        }

        const requests = await Request.find(query)
            .populate('assetId', 'name serialNumber')
            .populate('requestedBy', 'name email phone')
            .populate('reviewedBy', 'name email')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/requests/:id
 * @desc    Get single request
 * @access  Private
 */
const getRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('assetId')
            .populate('requestedBy', 'name email phone')
            .populate('reviewedBy', 'name email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Get request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   POST /api/requests
 * @desc    Create new request
 * @access  Private
 */
const createRequest = async (req, res) => {
    try {
        const requestData = {
            ...req.body,
            requestedBy: req.user._id,
            requestedByName: req.user.name
        };

        // Fix invalid assetId (sanitize) - remove if empty or not a valid ObjectId
        if (!requestData.assetId || !mongoose.Types.ObjectId.isValid(requestData.assetId)) {
            delete requestData.assetId;
        }

        // Resolve references in assetRegistrationData
        if (requestData.assetRegistrationData) {
            if (requestData.assetRegistrationData.category) {
                requestData.assetRegistrationData.category = await resolveId(Category, requestData.assetRegistrationData.category);
            }
            if (requestData.assetRegistrationData.department) {
                requestData.assetRegistrationData.department = await resolveId(Department, requestData.assetRegistrationData.department);
            }
        }

        // Resolve references in assetTransferData
        if (requestData.assetTransferData) {
            // fromDepartment and toDepartment are stored as strings (names) in the model
            // No resolveId needed here
        }

        const request = await Request.create(requestData);

        // Log activity
        await createLog('Request Created', req.user, `Created ${request.type} request for: ${request.assetName}`);

        // Send SMS notification to Admin Officers
        const message = `New ${request.type} request from ${req.user.name} for asset: ${request.assetName}. Please review.`;
        await notifyAdminOfficers(message);

        res.status(201).json({
            success: true,
            message: 'Request submitted successfully',
            data: request
        });
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/requests/:id/approve
 * @desc    Approve request
 * @access  Private (admin/adminOfficer only)
 */
const approveRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been reviewed'
            });
        }

        // Update request status
        request.status = 'approved';
        request.reviewedAt = new Date();
        request.reviewedBy = req.user._id;
        request.reviewedByName = req.user.name;

        await request.save();

        // Handle different request types
        if (request.type === 'asset-registration' && request.assetRegistrationData) {

            // Resolve IDs safely
            const categoryId = await resolveId(Category, request.assetRegistrationData.category);
            const departmentId = await resolveId(Department, request.assetRegistrationData.department);

            // Generate Serial Number if missing
            let serialNumber = request.assetRegistrationData.serialNumber;
            if (!serialNumber) {
                let prefix = 'AST';
                if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
                    const cat = await Category.findById(categoryId);
                    if (cat) prefix = cat.name.substring(0, 2).toUpperCase();
                }
                const random = Math.floor(1000 + Math.random() * 9000);
                serialNumber = `${prefix}${random}`;
            }

            // Create new asset
            const newAsset = await Asset.create({
                name: request.assetName,
                serialNumber: serialNumber,
                category: categoryId,
                department: departmentId,
                purchaseDate: request.assetRegistrationData.purchaseDate,
                purchaseCost: request.assetRegistrationData.purchaseCost,
                currentValue: request.assetRegistrationData.purchaseCost,
                supplier: request.assetRegistrationData.supplier,
                location: request.assetRegistrationData.location,
                status: 'available',
                condition: 'Excellent'
            });

            // Update request with asset ID
            request.assetId = newAsset._id;
            await request.save();

            // Log activity
            await createLog('Asset Registered via Request', req.user, `Approved registration for: ${newAsset.name}`);

            // Send SMS to Admin Officers about new asset
            await notifyAdminOfficers(`New asset registered: ${newAsset.name} (${newAsset.serialNumber})`);
        }

        if (request.type === 'asset-damage' && request.assetId && request.assetDamageData) {
            // Update asset with damage report
            const asset = await Asset.findById(request.assetId);

            if (asset) {
                asset.damageReports.push({
                    reportedBy: request.requestedBy,
                    reportedByName: request.requestedByName,
                    damageLevel: request.assetDamageData.damageLevel,
                    damagePercentage: request.assetDamageData.damagePercentage,
                    location: request.assetDamageData.location,
                    description: request.assetDamageData.description
                });

                // Update condition based on damage level
                if (request.assetDamageData.damageLevel === 'saaid') {
                    asset.condition = 'Damaged';
                } else if (request.assetDamageData.damageLevel === 'dhex-dhexaad') {
                    asset.condition = 'Poor';
                } else {
                    asset.condition = 'Fair';
                }

                // Automatically set status to maintenance when damage is approved
                asset.status = 'maintenance';

                // Update current value
                const percentage = Number(request.assetDamageData.damagePercentage) || 0;
                const currentVal = Number(asset.currentValue);
                // If currentValue is invalid, fallback to purchaseCost - previous depreciation logic? 
                // Or just fallback to purchaseCost implies resetting depreciation? 
                // Better: fallback to purchaseCost.
                const baseValue = !isNaN(currentVal) ? currentVal : (Number(asset.purchaseCost) || 0);

                const depreciationAmount = (Number(asset.purchaseCost) * percentage) / 100;
                asset.currentValue = Math.max(0, baseValue - depreciationAmount);

                await asset.save();

                // Log activity
                await createLog('Damage Report Approved', req.user, `Approved damage report for: ${asset.name}`);
            }
        }

        if (request.type === 'asset-transfer' && request.assetId && request.assetTransferData) {
            // Update asset department
            const asset = await Asset.findById(request.assetId);
            const newDeptId = await resolveId(Department, request.assetTransferData.toDepartment);

            if (asset) {
                asset.department = newDeptId;
                asset.status = 'transferred';
                await asset.save();

                // Log activity
                await createLog('Asset Transfer Approved', req.user, `Approved transfer of ${asset.name} to ${request.assetTransferData.toDepartmentName}`);
            }
        }

        if ((request.type === 'status-change' || request.type === 'repair-complete') && request.assetId && request.newStatus) {
            const asset = await Asset.findById(request.assetId);
            if (asset) {
                asset.status = request.newStatus;

                // Handle specific status logic
                if (request.newStatus === 'disposed') {
                    asset.currentValue = 0;
                    // We keep purchaseCost for historical record (Lost Value)
                    asset.condition = 'Damaged';
                } else if (request.newStatus === 'available') {
                    asset.condition = 'Good';
                    asset.maintenanceRequired = false;
                }

                await asset.save();

                // Log activity
                await createLog('Asset Status Change Approved', req.user, `Changed status of ${asset.name} to ${request.newStatus}`);
            }
        }

        // Send SMS notification to requester
        const message = `Your ${request.type} request for "${request.assetName}" has been APPROVED by ${req.user.name}.`;
        await notifyUser(request.requestedBy, message);

        // Log activity
        await createLog('Request Approved', req.user, `Approved ${request.type} request for: ${request.assetName}`);

        res.json({
            success: true,
            message: 'Request approved successfully',
            data: request
        });
    } catch (error) {
        console.error('Approve request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   PUT /api/requests/:id/reject
 * @desc    Reject request
 * @access  Private (admin/adminOfficer only)
 */
const rejectRequest = async (req, res) => {
    try {
        const { reason } = req.body;

        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been reviewed'
            });
        }

        // Update request status
        request.status = 'rejected';
        request.reviewedAt = new Date();
        request.reviewedBy = req.user._id;
        request.reviewedByName = req.user.name;
        request.rejectionReason = reason;

        await request.save();

        // Send SMS notification to requester
        const message = `Your ${request.type} request for "${request.assetName}" has been REJECTED by ${req.user.name}. Reason: ${reason}`;
        await notifyUser(request.requestedBy, message);

        // Log activity
        await createLog('Request Rejected', req.user, `Rejected ${request.type} request for: ${request.assetName}`);

        res.json({
            success: true,
            message: 'Request rejected successfully',
            data: request
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @route   GET /api/requests/my
 * @desc    Get my requests
 * @access  Private
 */
const getMyRequests = async (req, res) => {
    try {
        const requests = await Request.find({ requestedBy: req.user._id })
            .populate('assetId', 'name serialNumber')
            .populate('reviewedBy', 'name')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getRequests,
    getRequest,
    createRequest,
    approveRequest,
    rejectRequest,
    getMyRequests
};
