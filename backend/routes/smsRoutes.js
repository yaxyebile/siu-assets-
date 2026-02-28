const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { sendSMS } = require('../utils/smsService');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/sms/send
 * @desc    Send SMS
 * @access  Private (admin/adminOfficer only)
 */
router.post(
    '/send',
    authorize('admin', 'adminOfficer'),
    [
        body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
        body('message').trim().notEmpty().withMessage('Message is required'),
        validate
    ],
    async (req, res) => {
        try {
            const { phoneNumber, message } = req.body;

            const result = await sendSMS(phoneNumber, message);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'SMS sent successfully',
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to send SMS',
                    error: result.error
                });
            }
        } catch (error) {
            console.error('Send SMS error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    }
);

module.exports = router;
