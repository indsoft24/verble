// src/controllers/mobileAuthController.js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import crypto, { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import redisClient from '../config/redisClient.js';
import { formatMobileNumber, validateMobileNumber } from '../utils/smsService.js';
import sendEmail from '../utils/email.js';

/**
 * @desc    Send OTP to mobile number for login/registration
 * @route   POST /api/auth/mobile/send-otp
 * @access  Public
 */
export const sendMobileOTP = asyncHandler(async (req, res) => {
    const { mobile } = req.body;

    if (!mobile) {
        return res.status(400).json({
            status: 'fail',
            message: 'Mobile number is required.',
        });
    }

    // Format mobile number with country code
    const formattedMobile = formatMobileNumber(mobile, process.env.DEFAULT_COUNTRY_CODE || '+91');

    // Validate mobile number
    if (!validateMobileNumber(formattedMobile)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid mobile number format. Please include country code (e.g., +919876543210).',
        });
    }

    // Check for cooldown (30 seconds)
    let user = await User.findOne({ mobile: formattedMobile });
    if (user) {
        const now = Date.now();
        const lastOtpSent = user.lastMobileOtpSentAt ? new Date(user.lastMobileOtpSentAt).getTime() : 0;
        const cooldownPeriod = 30 * 1000; // 30 seconds
        const cooldownRemaining = Math.ceil((cooldownPeriod - (now - lastOtpSent)) / 1000);

        if (cooldownRemaining > 0) {
            return res.status(429).json({
                status: 'fail',
                message: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`,
                cooldownRemaining,
            });
        }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create or update user
    if (!user) {
        // New user - create with mobile number
        user = new User({
            mobile: formattedMobile,
            isMobileVerified: false,
            mobileOtpToken: hashedOTP,
            mobileOtpExpires: new Date(otpExpires),
            lastMobileOtpSentAt: new Date(),
            authProvider: 'local',
            role: 'user',
        });
    } else {
        // Existing user - update OTP
        user.mobileOtpToken = hashedOTP;
        user.mobileOtpExpires = new Date(otpExpires);
        user.lastMobileOtpSentAt = new Date();
        user.isMobileVerified = false; // Reset verification status
    }

    await user.save();

    // Send OTP via Email (temporary solution until SMS/DLT verification is ready)
    // Mobile number is collected and stored for future SMS implementation
    try {
        // Use email if available, otherwise use placeholder email
        const emailToUse = user.email || `${formattedMobile.replace('+', '')}@mobile.verble.app`;
        
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Mobile OTP Verification</h2>
                <p>Your One-Time Password (OTP) for mobile number <strong>${formattedMobile.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3')}</strong> is:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0D47A1;">${otp}</p>
                <p>This OTP is valid for the next 10 minutes.</p>
                <p><em>Note: Currently, OTPs are sent via email. SMS delivery will be enabled once DLT verification is complete.</em></p>
                <p>If you did not request this, please ignore this email.</p>
                <hr>
                <p>Thank you,<br>The Support Team</p>
            </div>
        `;

        await sendEmail({
            email: emailToUse,
            subject: 'Your Mobile OTP Code',
            html: htmlMessage,
        });
        
        res.status(200).json({
            status: 'success',
            message: 'OTP has been sent to your registered email address.',
            data: {
                mobile: formattedMobile.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3'), // Mask middle digits
                email: emailToUse.replace(/(.{2})(.*)(@.*)/, '$1****$3'), // Mask email
                expiresIn: 600, // 10 minutes in seconds
                deliveryMethod: 'email', // Indicate delivery method
            },
        });
    } catch (error) {
        console.error('[MobileAuth] Error sending OTP email:', error);
        
        // Clear OTP on email failure
        user.mobileOtpToken = undefined;
        user.mobileOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
            status: 'error',
            message: 'Failed to send OTP. Please try again later.',
        });
    }
});

/**
 * @desc    Verify mobile OTP and login/register user
 * @route   POST /api/auth/mobile/verify-otp
 * @access  Public
 */
export const verifyMobileOTP = asyncHandler(async (req, res) => {
    const { mobile, otp, name } = req.body;

    if (!mobile || !otp) {
        return res.status(400).json({
            status: 'fail',
            message: 'Mobile number and OTP are required.',
        });
    }

    if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
            status: 'fail',
            message: 'OTP must be a 6-digit number.',
        });
    }

    // Format mobile number
    const formattedMobile = formatMobileNumber(mobile, process.env.DEFAULT_COUNTRY_CODE || '+91');

    // Validate mobile number
    if (!validateMobileNumber(formattedMobile)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid mobile number format.',
        });
    }

    // Hash OTP for comparison
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with matching mobile and valid OTP
    const user = await User.findOne({
        mobile: formattedMobile,
        mobileOtpToken: hashedOTP,
        mobileOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid or expired OTP.',
        });
    }

    // Update user
    user.isMobileVerified = true;
    user.mobileOtpToken = undefined;
    user.mobileOtpExpires = undefined;

    // If name is provided and user doesn't have a name, set it (for new registrations)
    if (name && !user.name) {
        user.name = name;
    }

    // If user doesn't have email, set a placeholder (mobile is primary identifier)
    // This allows the system to work with email OTP delivery until SMS is ready
    if (!user.email) {
        user.email = `${formattedMobile.replace('+', '')}@mobile.verble.app`; // Placeholder email for OTP delivery
    }

    await user.save();

    // Log user in by sending token response
    const SESSION_PREFIX = 'session:user:';
    const SESSION_EXPIRY_SECONDS = process.env.JWT_EXPIRES_IN_SECONDS 
        ? parseInt(process.env.JWT_EXPIRES_IN_SECONDS, 10) 
        : (60 * 60 * 24 * 7); // Default 7 days

    const sessionId = randomUUID();
    const token = jwt.sign(
        { id: user._id.toString(), role: user.role, sessionId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const redisKey = `${SESSION_PREFIX}${user._id.toString()}`;
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect().catch(() => {});
        }
        if (redisClient.isOpen) {
            await redisClient.set(redisKey, sessionId, { EX: SESSION_EXPIRY_SECONDS });
        }
    } catch (redisError) {
        console.error('[MobileAuth] Error setting session in Redis:', redisError);
    }

    const userForResponse = user.toObject();
    delete userForResponse.password;
    delete userForResponse.activeSessions;
    delete userForResponse.mobileOtpToken;
    delete userForResponse.mobileOtpExpires;
    delete userForResponse.emailVerificationToken;
    delete userForResponse.emailVerificationExpires;

    if (!Array.isArray(userForResponse.subscriptions)) {
        userForResponse.subscriptions = [];
    }

    res.status(200).json({
        status: 'success',
        message: 'Mobile verified successfully. You are now logged in.',
        token,
        data: {
            user: userForResponse,
        },
    });
});

/**
 * @desc    Login with mobile number (sends OTP)
 * @route   POST /api/auth/mobile/login
 * @access  Public
 */
export const loginWithMobile = asyncHandler(async (req, res) => {
    const { mobile } = req.body;

    if (!mobile) {
        return res.status(400).json({
            status: 'fail',
            message: 'Mobile number is required.',
        });
    }

    // Format mobile number
    const formattedMobile = formatMobileNumber(mobile, process.env.DEFAULT_COUNTRY_CODE || '+91');

    // Validate mobile number
    if (!validateMobileNumber(formattedMobile)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid mobile number format. Please include country code (e.g., +919876543210).',
        });
    }

    // Check if user exists
    const user = await User.findOne({ mobile: formattedMobile });

    if (!user) {
        return res.status(404).json({
            status: 'fail',
            message: 'No account found with this mobile number. Please register first.',
            code: 'USER_NOT_FOUND',
        });
    }

    // Check for cooldown
    const now = Date.now();
    const lastOtpSent = user.lastMobileOtpSentAt ? new Date(user.lastMobileOtpSentAt).getTime() : 0;
    const cooldownPeriod = 30 * 1000; // 30 seconds
    const cooldownRemaining = Math.ceil((cooldownPeriod - (now - lastOtpSent)) / 1000);

    if (cooldownRemaining > 0) {
        return res.status(429).json({
            status: 'fail',
            message: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`,
            cooldownRemaining,
        });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Update user
    user.mobileOtpToken = hashedOTP;
    user.mobileOtpExpires = new Date(otpExpires);
    user.lastMobileOtpSentAt = new Date();
    await user.save();

    // Send OTP via Email (temporary solution until SMS/DLT verification is ready)
    try {
        const emailToUse = user.email || `${formattedMobile.replace('+', '')}@mobile.verble.app`;
        
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Mobile Login OTP</h2>
                <p>Your One-Time Password (OTP) for mobile number <strong>${formattedMobile.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3')}</strong> is:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0D47A1;">${otp}</p>
                <p>This OTP is valid for the next 10 minutes.</p>
                <p><em>Note: Currently, OTPs are sent via email. SMS delivery will be enabled once DLT verification is complete.</em></p>
                <p>If you did not request this, please ignore this email.</p>
                <hr>
                <p>Thank you,<br>The Support Team</p>
            </div>
        `;

        await sendEmail({
            email: emailToUse,
            subject: 'Your Mobile Login OTP',
            html: htmlMessage,
        });

        res.status(200).json({
            status: 'success',
            message: 'OTP has been sent to your registered email address.',
            data: {
                mobile: formattedMobile.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3'), // Mask middle digits
                email: emailToUse.replace(/(.{2})(.*)(@.*)/, '$1****$3'), // Mask email
                expiresIn: 600, // 10 minutes
                deliveryMethod: 'email',
            },
        });
    } catch (error) {
        console.error('[MobileAuth] Error sending OTP email:', error);

        // Clear OTP on email failure
        user.mobileOtpToken = undefined;
        user.mobileOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
            status: 'error',
            message: 'Failed to send OTP. Please try again later.',
        });
    }
});

/**
 * @desc    Register with mobile number (sends OTP)
 * @route   POST /api/auth/mobile/register
 * @access  Public
 */
export const registerWithMobile = asyncHandler(async (req, res) => {
    const { mobile, name } = req.body;

    if (!mobile) {
        return res.status(400).json({
            status: 'fail',
            message: 'Mobile number is required.',
        });
    }

    if (!name || name.trim().length < 2) {
        return res.status(400).json({
            status: 'fail',
            message: 'Name is required and must be at least 2 characters.',
        });
    }

    // Format mobile number
    const formattedMobile = formatMobileNumber(mobile, process.env.DEFAULT_COUNTRY_CODE || '+91');

    // Validate mobile number
    if (!validateMobileNumber(formattedMobile)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid mobile number format. Please include country code (e.g., +919876543210).',
        });
    }

    // Check if mobile number is already registered and verified
    const existingUser = await User.findOne({ 
        mobile: formattedMobile,
        isMobileVerified: true 
    });

    if (existingUser) {
        return res.status(400).json({
            status: 'fail',
            message: 'An account with this mobile number already exists.',
        });
    }

    // Check for cooldown (if unverified user exists)
    let user = await User.findOne({ mobile: formattedMobile });
    if (user) {
        const now = Date.now();
        const lastOtpSent = user.lastMobileOtpSentAt ? new Date(user.lastMobileOtpSentAt).getTime() : 0;
        const cooldownPeriod = 30 * 1000; // 30 seconds
        const cooldownRemaining = Math.ceil((cooldownPeriod - (now - lastOtpSent)) / 1000);

        if (cooldownRemaining > 0) {
            return res.status(429).json({
                status: 'fail',
                message: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`,
                cooldownRemaining,
            });
        }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create or update user
    if (!user) {
        user = new User({
            mobile: formattedMobile,
            name: name.trim(),
            isMobileVerified: false,
            mobileOtpToken: hashedOTP,
            mobileOtpExpires: new Date(otpExpires),
            lastMobileOtpSentAt: new Date(),
            authProvider: 'local',
            role: 'user',
            email: `${formattedMobile.replace('+', '')}@mobile.verble.app`, // Placeholder email for OTP delivery
        });
    } else {
        // Update existing unverified user
        user.name = name.trim();
        user.mobileOtpToken = hashedOTP;
        user.mobileOtpExpires = new Date(otpExpires);
        user.lastMobileOtpSentAt = new Date();
        user.isMobileVerified = false;
    }

    await user.save();

    // Send OTP via Email (temporary solution until SMS/DLT verification is ready)
    try {
        // For new registrations, we'll need to collect email or use placeholder
        // In production, you might want to require email during mobile registration
        const emailToUse = user.email || `${formattedMobile.replace('+', '')}@mobile.verble.app`;
        
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Mobile Registration OTP</h2>
                <p>Your One-Time Password (OTP) for mobile number <strong>${formattedMobile.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3')}</strong> is:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0D47A1;">${otp}</p>
                <p>This OTP is valid for the next 10 minutes.</p>
                <p><em>Note: Currently, OTPs are sent via email. SMS delivery will be enabled once DLT verification is complete.</em></p>
                <p>If you did not request this, please ignore this email.</p>
                <hr>
                <p>Thank you,<br>The Support Team</p>
            </div>
        `;

        await sendEmail({
            email: emailToUse,
            subject: 'Your Mobile Registration OTP',
            html: htmlMessage,
        });

        res.status(200).json({
            status: 'success',
            message: 'OTP has been sent to your email address.',
            data: {
                mobile: formattedMobile.replace(/(\+\d{1,3})(\d{4})(\d+)/, '$1****$3'), // Mask middle digits
                email: emailToUse.replace(/(.{2})(.*)(@.*)/, '$1****$3'), // Mask email
                expiresIn: 600, // 10 minutes
                deliveryMethod: 'email',
            },
        });
    } catch (error) {
        console.error('[MobileAuth] Error sending OTP email:', error);

        // Clear OTP on email failure
        user.mobileOtpToken = undefined;
        user.mobileOtpExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({
            status: 'error',
            message: 'Failed to send OTP. Please try again later.',
        });
    }
});
