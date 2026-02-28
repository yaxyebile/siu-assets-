const axios = require('axios');
const SMSHistory = require('../models/SMSHistory');

/**
 * Send SMS via SMS Gateway 24
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} Response from SMS API
 */
const sendSMS = async (phoneNumber, message) => {
    try {
        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        // Prepare SMS data
        const smsData = {
            device_id: process.env.SMS_DEVICE_ID,
            sim: process.env.SMS_SIM,
            token: process.env.SMS_TOKEN,
            number: cleanPhone,
            message: message
        };

        // Send SMS request
        const response = await axios.post(process.env.SMS_API_URL, smsData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Log SMS in database
        await SMSHistory.create({
            recipient: cleanPhone,
            message: message,
            status: 'sent',
            response: response.data
        });

        console.log(`✅ SMS sent to ${cleanPhone}`);
        return {
            success: true,
            data: response.data
        };

    } catch (error) {
        console.error('❌ SMS sending failed:', error.message);

        // Log failed SMS
        await SMSHistory.create({
            recipient: phoneNumber,
            message: message,
            status: 'failed',
            response: error.message
        });

        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Send notification to Admin Officers
 * @param {string} message - Notification message
 */
const notifyAdminOfficers = async (message) => {
    try {
        const User = require('../models/User');

        // Get all Admin Officers with phone numbers
        const officers = await User.find({
            role: { $in: ['admin', 'adminOfficer'] },
            phone: { $exists: true, $ne: '' }
        });

        // Send SMS to each officer
        const promises = officers.map(officer => sendSMS(officer.phone, message));
        await Promise.all(promises);

        console.log(`📢 Notified ${officers.length} admin officers`);
    } catch (error) {
        console.error('Error notifying admin officers:', error);
    }
};

/**
 * Send notification to specific user
 * @param {string} userId - User ID
 * @param {string} message - Notification message
 */
const notifyUser = async (userId, message) => {
    try {
        const User = require('../models/User');

        const user = await User.findById(userId);

        if (user && user.phone) {
            await sendSMS(user.phone, message);
            console.log(`📱 Notified user: ${user.name}`);
        }
    } catch (error) {
        console.error('Error notifying user:', error);
    }
};

module.exports = {
    sendSMS,
    notifyAdminOfficers,
    notifyUser
};
