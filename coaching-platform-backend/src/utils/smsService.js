// src/utils/smsService.js
/**
 * SMS Service for sending OTP via SMS gateway
 * Supports multiple SMS providers (Twilio, AWS SNS, MessageBird, etc.)
 * 
 * To use, set SMS_PROVIDER and provider-specific credentials in .env
 */

/**
 * Send OTP via SMS
 * @param {string} mobileNumber - Mobile number with country code (e.g., +919876543210)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendSMS = async (mobileNumber, otp) => {
    const provider = process.env.SMS_PROVIDER || 'twilio'; // Default to Twilio

    try {
        // Validate mobile number format (basic check)
        if (!mobileNumber || !mobileNumber.startsWith('+')) {
            throw new Error('Mobile number must include country code (e.g., +919876543210)');
        }

        // Validate OTP format
        if (!otp || !/^\d{6}$/.test(otp)) {
            throw new Error('OTP must be a 6-digit number');
        }

        switch (provider.toLowerCase()) {
            case 'twilio':
                return await sendViaTwilio(mobileNumber, otp);
            case 'aws-sns':
                return await sendViaAWSSNS(mobileNumber, otp);
            case 'messagebird':
                return await sendViaMessageBird(mobileNumber, otp);
            case 'msg91':
                return await sendViaMSG91(mobileNumber, otp);
            case 'mock':
                // Mock provider for development/testing
                return await sendViaMock(mobileNumber, otp);
            default:
                throw new Error(`Unsupported SMS provider: ${provider}`);
        }
    } catch (error) {
        console.error('[SMSService] Error sending SMS:', error);
        throw error;
    }
};

/**
 * Send SMS via Twilio
 */
const sendViaTwilio = async (mobileNumber, otp) => {
    try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env');
        }

        // Dynamic import to avoid requiring twilio in package.json if not used
        const twilio = await import('twilio');
        const client = twilio.default(accountSid, authToken);

        const message = await client.messages.create({
            body: `Your OTP code is: ${otp}. Valid for 10 minutes.`,
            from: fromNumber,
            to: mobileNumber,
        });

        return {
            success: true,
            messageId: message.sid,
        };
    } catch (error) {
        console.error('[SMSService] Twilio error:', error);
        throw new Error(`Failed to send SMS via Twilio: ${error.message}`);
    }
};

/**
 * Send SMS via AWS SNS
 */
const sendViaAWSSNS = async (mobileNumber, otp) => {
    try {
        const AWS = await import('aws-sdk');
        const sns = new AWS.SNS({
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });

        const params = {
            Message: `Your OTP code is: ${otp}. Valid for 10 minutes.`,
            PhoneNumber: mobileNumber,
        };

        const result = await sns.publish(params).promise();

        return {
            success: true,
            messageId: result.MessageId,
        };
    } catch (error) {
        console.error('[SMSService] AWS SNS error:', error);
        throw new Error(`Failed to send SMS via AWS SNS: ${error.message}`);
    }
};

/**
 * Send SMS via MessageBird
 */
const sendViaMessageBird = async (mobileNumber, otp) => {
    try {
        const messagebird = await import('messagebird');
        const mb = messagebird.default(process.env.MESSAGEBIRD_API_KEY);

        const params = {
            originator: process.env.MESSAGEBIRD_ORIGINATOR || 'Verble',
            recipients: [mobileNumber],
            body: `Your OTP code is: ${otp}. Valid for 10 minutes.`,
        };

        const result = await new Promise((resolve, reject) => {
            mb.messages.create(params, (err, response) => {
                if (err) reject(err);
                else resolve(response);
            });
        });

        return {
            success: true,
            messageId: result.id,
        };
    } catch (error) {
        console.error('[SMSService] MessageBird error:', error);
        throw new Error(`Failed to send SMS via MessageBird: ${error.message}`);
    }
};

/**
 * Send SMS via MSG91 (Popular in India)
 */
const sendViaMSG91 = async (mobileNumber, otp) => {
    try {
        const apiKey = process.env.MSG91_API_KEY;
        const senderId = process.env.MSG91_SENDER_ID || 'VERBLE';

        if (!apiKey) {
            throw new Error('MSG91 API key not configured. Set MSG91_API_KEY in .env');
        }

        // Remove + from mobile number for MSG91
        const cleanMobile = mobileNumber.replace(/^\+/, '');

        const url = `https://control.msg91.com/api/v5/flow/`;
        const axios = await import('axios');

        const response = await axios.default.post(url, {
            template_id: process.env.MSG91_OTP_TEMPLATE_ID,
            short_url: '0',
            mobiles: cleanMobile,
            otp: otp,
        }, {
            headers: {
                'authkey': apiKey,
                'Content-Type': 'application/json',
            },
        });

        return {
            success: true,
            messageId: response.data.request_id || 'msg91_sent',
        };
    } catch (error) {
        console.error('[SMSService] MSG91 error:', error);
        throw new Error(`Failed to send SMS via MSG91: ${error.message}`);
    }
};

/**
 * Mock SMS provider for development/testing
 * Logs OTP to console instead of sending actual SMS
 */
const sendViaMock = async (mobileNumber, otp) => {
    console.log(`[MOCK SMS] Sending OTP to ${mobileNumber}: ${otp}`);
    console.log(`[MOCK SMS] OTP Message: "Your OTP code is: ${otp}. Valid for 10 minutes."`);
    
    return {
        success: true,
        messageId: `mock_${Date.now()}`,
    };
};

/**
 * Format mobile number to include country code
 * @param {string} mobileNumber - Mobile number (with or without country code)
 * @param {string} defaultCountryCode - Default country code (e.g., '+91' for India)
 * @returns {string} - Formatted mobile number with country code
 */
export const formatMobileNumber = (mobileNumber, defaultCountryCode = '+91') => {
    if (!mobileNumber) return null;
    
    // Remove all spaces, dashes, and parentheses
    let cleaned = mobileNumber.replace(/[\s\-\(\)]/g, '');
    
    // If already starts with +, return as is
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    
    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Add default country code if not present
    if (!cleaned.startsWith('+')) {
        cleaned = defaultCountryCode + cleaned;
    }
    
    return cleaned;
};

/**
 * Validate mobile number format
 * @param {string} mobileNumber - Mobile number to validate
 * @returns {boolean} - True if valid
 */
export const validateMobileNumber = (mobileNumber) => {
    if (!mobileNumber) return false;
    
    // Basic validation: should start with + and have 10-15 digits after country code
    const mobileRegex = /^\+[1-9]\d{9,14}$/;
    return mobileRegex.test(mobileNumber);
};
