const mongoose = require('mongoose');

const damageReportSchema = new mongoose.Schema({
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedByName: {
        type: String,
        required: true
    },
    damageLevel: {
        type: String,
        enum: ['saaid', 'dhex-dhexaad', 'iska-roon'],
        required: true
    },
    damagePercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Asset name is required'],
        trim: true
    },
    serialNumber: {
        type: String,
        required: [true, 'Serial number is required'],
        unique: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required']
    },
    status: {
        type: String,
        enum: ['available', 'in-use', 'maintenance', 'disposed', 'transferred', 'missing'],
        default: 'available'
    },
    condition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
        default: 'Good'
    },
    purchaseDate: {
        type: Date,
        required: [true, 'Purchase date is required']
    },
    purchaseCost: {
        type: Number,
        required: [true, 'Purchase cost is required'],
        min: 0
    },
    currentValue: {
        type: Number,
        required: true,
        min: 0
    },
    supplier: {
        type: String,
        trim: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    maintenanceRequired: {
        type: Boolean,
        default: false
    },
    invoiceNumber: {
        type: String,
        trim: true
    },
    invoiceFile: {
        type: String // We will store the base64 string or file URL here
    },
    warrantyExpiry: {
        type: Date
    },
    assetType: {
        type: String,
        enum: ['Fixed', 'Movable'],
        default: 'Fixed'
    },
    custodian: {
        type: String,
        trim: true
    },
    notes: {
        type: String
    },
    damageReports: [damageReportSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
assetSchema.index({ serialNumber: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ department: 1 });
assetSchema.index({ category: 1 });

module.exports = mongoose.model('Asset', assetSchema);
