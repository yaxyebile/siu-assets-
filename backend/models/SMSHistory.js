const mongoose = require('mongoose');

const smsHistorySchema = new mongoose.Schema({
    recipient: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        default: 'sent'
    },
    response: {
        type: mongoose.Schema.Types.Mixed
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
smsHistorySchema.index({ sentAt: -1 });

module.exports = mongoose.model('SMSHistory', smsHistorySchema);
