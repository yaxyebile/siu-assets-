const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
    },
    assetName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['asset-registration', 'asset-damage', 'asset-transfer', 'usage', 'status-change', 'maintenance', 'transfer', 'repair-complete'],
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestedByName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    newStatus: {
        type: String,
        // Optional: validate enum against Asset status values, but simple string is easier for now to avoid circular dependency or strict coupling
    },
    details: {
        type: String,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedByName: {
        type: String
    },
    rejectionReason: {
        type: String
    },
    // Asset Damage specific data
    assetDamageData: {
        damageLevel: {
            type: String,
            enum: ['saaid', 'dhex-dhexaad', 'iska-roon']
        },
        damagePercentage: Number,
        location: String,
        description: String
    },
    // Asset Transfer specific data
    assetTransferData: {
        fromDepartment: String,
        toDepartment: String,
        fromDepartmentName: String,
        toDepartmentName: String,
        reason: String
    },
    // Asset Registration specific data
    assetRegistrationData: {
        serialNumber: String,
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        categoryName: String,
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department'
        },
        departmentName: String,
        purchaseDate: Date,
        purchaseCost: Number,
        supplier: String,
        location: String
    }
}, {
    timestamps: true
});

// Index for faster queries
requestSchema.index({ status: 1 });
requestSchema.index({ type: 1 });
requestSchema.index({ requestedBy: 1 });

module.exports = mongoose.model('Request', requestSchema);
