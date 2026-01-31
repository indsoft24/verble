// src/controllers/authController.js
import User from "../models/User.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import { checkAndHandleSubscriptionExpiration } from '../services/subscriptionAccessService.js'; 
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; 
import redisClient from '../config/redisClient.js'; 
import { randomUUID} from 'crypto'; 
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import sendEmail from '../utils/email.js';
import { getGoogleAuthUrl, getGoogleTokens, getGoogleUserInfo, verifyAndroidIdToken } from '../config/googleOAuth.js';


const SESSION_PREFIX = 'session:user:';

const SESSION_EXPIRY_SECONDS = process.env.JWT_EXPIRES_IN_SECONDS ? parseInt(process.env.JWT_EXPIRES_IN_SECONDS, 10) : (60 * 60 * 24 * 7); // Default 7 days

// Helper to get frontend URL based on redirect URL or environment variable
const getFrontendUrl = (req, redirectUrl = null) => {
    // Priority 1: If redirectUrl is provided in query, use it (most explicit)
    if (redirectUrl) {
        // Remove callback path if present, keep just the base URL
        return redirectUrl.replace(/\/auth\/google\/callback.*$/, '').replace(/\/$/, '');
    }
    
    // Priority 2: Check app identifier from header (optional, for future multi-app support)
    const appIdentifier = req.headers['x-app-identifier']?.toLowerCase();
    if (appIdentifier && process.env[`FRONTEND_URL_${appIdentifier.toUpperCase().replace('-', '_')}`]) {
        return process.env[`FRONTEND_URL_${appIdentifier.toUpperCase().replace('-', '_')}`];
    }
    
    // Priority 3: Default to FRONTEND_URL from environment
    return process.env.FRONTEND_URL || 'http://localhost:3000';
};

// Helper to generate JWT token with session ID
const generateTokenWithSession = (userId, userRole, sessionId) => {
    if (!userId || !userRole || !sessionId) {
        // GenerateTokenError: Missing required parameters (details not logged for security)
        throw new Error("Cannot generate token without user ID, role, and session ID.");
    }
    try {
        return jwt.sign({ id: userId.toString(), role: userRole, sessionId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d", 
        });
    } catch (error) {
        // JWT sign error (details not logged for security)
        throw error;
    }
};

// Helper to send token response, manages Redis session
const sendTokenResponseWithSession = async (user, statusCode, res, message = 'Operation successful.') => {
    const sessionId = randomUUID(); 
    const token = generateTokenWithSession(user._id, user.role, sessionId);

    const redisKey = `${SESSION_PREFIX}${user._id.toString()}`;
    try {
        if (!redisClient.isOpen) {
            console.warn('[sendTokenResponse] Redis client not connected. Attempting to connect...');
            await redisClient.connect().catch(err => {
                console.error('[sendTokenResponse] Failed to connect to Redis:', err);
            });
        }
        if (redisClient.isOpen) {
            await redisClient.set(redisKey, sessionId, { EX: SESSION_EXPIRY_SECONDS });
            // Session stored in Redis (session ID not logged for security)
        } else {
            console.error('[sendTokenResponse] Could not store session in Redis: client not open.');
        }
    } catch (redisError) {
        console.error('[Auth] Error setting session in Redis:', redisError);
    }
    
    const userForResponse = user.toObject ? user.toObject() : { ...user };
    delete userForResponse.password; 
    delete userForResponse.activeSessions;
    // Also remove verification fields from the response
    delete userForResponse.emailVerificationToken;
    delete userForResponse.emailVerificationExpires;
    
    if (!Array.isArray(userForResponse.subscriptions)) {
        userForResponse.subscriptions = [];
    }

    res.status(statusCode).json({
        status: 'success',
        message,
        token,
        data: {
            user: userForResponse,
        },
    });
};

// --- HELPER FUNCTION TO SEND OTP ---
const sendVerificationEmail = async (user, verificationOTP) => {
    const htmlMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Welcome to Our Platform!</h2>
            <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0D47A1;">${verificationOTP}</p>
            <p>This OTP is valid for the next 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <hr>
            <p>Thank you,<br>The Support Team</p>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your Email Verification OTP',
            html: htmlMessage,
        });
        // Verification OTP sent (email not logged for security)
    } catch (error) {
        console.error("Error sending verification email:", error);
        // This throw will be caught by the calling function's catch block
        throw new Error("There was an error sending the verification email. Try again later.");
    }
};

/**
 * @desc    Register a new user and send verification OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, phoneNumber, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ status: "fail", message: "Please provide name, email, and password." });
    }
    if (password.length < 6) {
        return res.status(400).json({ status: 'fail', message: 'Password must be at least 6 characters.' });
    }

    // Check if a VERIFIED user already exists
    const existingVerifiedUser = await User.findOne({ email, isEmailVerified: true });
    if (existingVerifiedUser) {
        return res.status(400).json({ status: "fail", message: "An account with this email already exists." });
    }

    // If an unverified user exists, we'll overwrite them. Otherwise, create a new one.
    let user = await User.findOne({ email });

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash('sha256').update(verificationOTP).digest('hex');
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    if (user) {
        // Update existing unverified user
        user.name = name;
        user.password = password;
        user.phoneNumber = phoneNumber;
        user.role = role || 'user';
        user.isEmailVerified = false; // Ensure it's false
        user.emailVerificationToken = hashedOTP;
        user.emailVerificationExpires = otpExpires;
    } else {
        // Create a new user
        user = new User({
            name,
            email,
            password,
            phoneNumber,
            role: role || 'user',
            subscriptions: [],
            isEmailVerified: false,
            emailVerificationToken: hashedOTP,
            emailVerificationExpires: otpExpires,
        });
    }

    await user.save();
    
    // Send verification email
    await sendVerificationEmail(user, verificationOTP);
    
    // DO NOT send token yet. User must verify first.
    res.status(201).json({
        status: 'success',
        message: 'Registration successful. An OTP has been sent to your email for verification.',
        data: {
            email: user.email // Send back email for frontend to use in verification step
        }
    });
});

/**
 * @desc    Verify user email with OTP
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ status: 'fail', message: 'Please provide email and OTP.' });
    }
    
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
        email,
        emailVerificationToken: hashedOTP,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ status: 'fail', message: 'Invalid or expired OTP.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Now that user is verified, log them in by sending the token response
    await sendTokenResponseWithSession(user, 200, res, 'Email verified successfully. You are now logged in.');
});


/**
 * @desc    Resend verification OTP
 * @route   POST /api/auth/resend-verification-email
 * @access  Public
 */
export const resendVerificationEmail = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ status: 'fail', message: 'Please provide your email address.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        // Avoid revealing if an email is registered or not for security
        return res.status(200).json({ status: 'success', message: 'If an account with that email exists and is unverified, a new OTP has been sent.' });
    }
    
    if (user.isEmailVerified) {
        return res.status(400).json({ status: 'fail', message: 'This account is already verified.' });
    }

    // Check for 30-second cooldown
    const now = Date.now();
    const lastOtpSent = user.lastOtpSentAt ? new Date(user.lastOtpSentAt).getTime() : 0;
    const cooldownPeriod = 30 * 1000; // 30 seconds in milliseconds
    
    if (lastOtpSent && (now - lastOtpSent) < cooldownPeriod) {
        const remainingSeconds = Math.ceil((cooldownPeriod - (now - lastOtpSent)) / 1000);
        return res.status(429).json({ 
            status: 'fail', 
            message: `Please wait ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} before requesting a new OTP.`,
            cooldownRemaining: remainingSeconds
        });
    }

    const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationOTP).digest('hex');
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.lastOtpSentAt = new Date(); // Track when OTP was sent
    await user.save();
    
    // Send the new verification email
    await sendVerificationEmail(user, verificationOTP);
    
    res.status(200).json({
        status: 'success',
        message: 'A new OTP has been sent to your email address.',
    });
});


export const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: "fail", message: "Please provide email and password." });
    }

    const user = await User.findOne({ email })
        .select("+password") 
        .populate({
            path: 'subscriptions.planId',
            model: 'SubscriptionPlan',
            select: 'name price currency duration features isActive _id' 
        });

    if (!user) {
        return res.status(401).json({ status: "fail", message: "Incorrect email or password." });
    }

    if (!user.password) { 
        return res.status(401).json({
            status: "fail",
            message: "Login with password is not available for this account (e.g. social login).",
        });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ status: "fail", message: "Incorrect email or password." });
    }
    
    // --- MODIFICATION: Check if email is verified after password check ---
    // If email is not verified, send OTP on first login attempt (with 30-second cooldown)
    if (!user.isEmailVerified) {
        // Check for 30-second cooldown before sending OTP
        const now = Date.now();
        const lastOtpSent = user.lastOtpSentAt ? new Date(user.lastOtpSentAt).getTime() : 0;
        const cooldownPeriod = 30 * 1000; // 30 seconds in milliseconds
        const canSendOtp = !lastOtpSent || (now - lastOtpSent) >= cooldownPeriod;
        
        if (canSendOtp) {
            // Generate new OTP
            const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
            const hashedOTP = crypto.createHash('sha256').update(verificationOTP).digest('hex');
            const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
            
            // Update user with new OTP
            user.emailVerificationToken = hashedOTP;
            user.emailVerificationExpires = otpExpires;
            user.lastOtpSentAt = new Date();
            await user.save();
            
            // Send verification email with OTP
            try {
                await sendVerificationEmail(user, verificationOTP);
            } catch (emailError) {
                console.error("Error sending verification email on login:", emailError);
                // Continue even if email fails - user can use resend endpoint
            }
        }
        
        return res.status(403).json({ 
            status: 'fail', 
            code: 'EMAIL_NOT_VERIFIED',
            message: canSendOtp 
                ? 'Your email is not verified. An OTP has been sent to your email address. Please verify your email to continue.'
                : 'Your email is not verified. Please verify your email to continue.',
            data: {
                email: user.email,
                requiresVerification: true
            }
        });
    }
    // --- END MODIFICATION ---

    if (!user._id || !user.role) { 
        // Login error: User object incomplete (user object not logged for security)
        return res.status(500).json({ status: "error", message: "User data is incomplete."});
    }
    
    await sendTokenResponseWithSession(user, 200, res, 'Logged in successfully.');
});

// The rest of your functions (getMe, logoutUser, forgotPassword, resetPassword) remain unchanged.
// I'm including them here for completeness.

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private (Requires authentication token)
 */
export const getMe = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ status: 'fail', message: 'Not authorized, user not found in request.' });
        }

        const user = await User.findById(req.user._id)
            .select('-password -activeSessions') 
            .populate({
                path: 'subscriptions.planId', 
                model: 'SubscriptionPlan',    
                select: 'name price currency duration features isActive _id' 
            });

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        // Check and update subscription expiration and unlocked levels
        try {
            await checkAndHandleSubscriptionExpiration(req.user._id);
            // Refresh user to get updated unlocked levels
            const updatedUser = await User.findById(req.user._id)
                .select('-password -activeSessions') 
                .populate({
                    path: 'subscriptions.planId', 
                    model: 'SubscriptionPlan',    
                    select: 'name price currency duration features isActive _id' 
                });
            
            // User data prepared for response (user object not logged for security)
            const userForResponse = updatedUser.toObject();
            delete userForResponse.emailVerificationToken; // Clean up response
            delete userForResponse.emailVerificationExpires; // Clean up response
            if (!Array.isArray(userForResponse.subscriptions)) {
                userForResponse.subscriptions = [];
            }

            res.status(200).json({
                status: 'success',
                data: {
                    user: userForResponse 
                }
            });
        } catch (error) {
            console.error('Error checking subscription expiration:', error);
            // Still return user data even if subscription check fails
            const userForResponse = user.toObject();
            delete userForResponse.emailVerificationToken;
            delete userForResponse.emailVerificationExpires;
            if (!Array.isArray(userForResponse.subscriptions)) {
                userForResponse.subscriptions = [];
            }
            res.status(200).json({
                status: 'success',
                data: {
                    user: userForResponse 
                }
            });
        }
    } catch (error) {
        // Error fetching user details (details not logged for security)
        res.status(500).json({ status: 'error', message: 'Server error while fetching user details.' });
    }
};

/**
 * @desc    Log user out (by clearing their session from Redis)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = async (req, res, next) => {
    try {
        if (req.user && req.user._id) {
            const redisKey = `${SESSION_PREFIX}${req.user._id.toString()}`;
            if (redisClient.isOpen) {
                const result = await redisClient.del(redisKey);
                // Session cleared from Redis (result not logged for security)
            } else {
                console.warn('[Auth Logout] Redis client not connected. Session not cleared from Redis.');
            }
        }
        
        res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
    } catch (error) {
        console.error("LOGOUT USER ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Logout failed.' });
    }
};

/**
 * @desc    Handle forgot password request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(200).json({ status: 'success', message: 'If an account with that email exists, a reset method has been sent.' });
    }

    const appIdentifier = req.headers['x-app-identifier']; 

    // Check if app identifier is provided for OTP-based reset
    if (appIdentifier) {
        const resetOTP = Math.floor(100000 + Math.random() * 900000).toString(); 
        user.passwordResetToken = crypto.createHash('sha256').update(resetOTP).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; 
        await user.save({ validateBeforeSave: false });

        const appName = process.env.APP_NAME || 'Verble';

        try {
            const htmlMessage = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Password Reset Request for ${appName}</h2>
                    <p>Your One-Time Password (OTP) to reset your password is:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${resetOTP}</p>
                    <p>This OTP is valid for the next 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            `;
            await sendEmail({
                email: user.email,
                subject: `Your ${appName} Password Reset OTP`,
                html: htmlMessage,
            });
            res.status(200).json({ status: 'success', message: `An OTP has been sent to your email address.` });
        } catch (err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            console.error("OTP EMAIL SENDING ERROR:", err);
            return res.status(500).json({ message: "There was an error sending the email. Try again later." });
        }
    } else {
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const resetURL = `${frontendUrl}/reset-password/${resetToken}`;
            const appName = process.env.APP_NAME || 'Verble';
            const htmlMessage = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Password Reset Request</h2>
                    <p>Please click on the button below to reset your password for ${appName}:</p>
                    <a href="${resetURL}" style="background-color: #0D47A1; ...">Reset Your Password</a>
                    <p>This link is valid for 10 minutes.</p>
                </div>
            `;
            await sendEmail({
                email: user.email,
                subject: `Your ${appName} Password Reset Link`,
                html: htmlMessage,
            });
            res.status(200).json({ status: 'success', message: 'A reset link has been sent to your email address.' });
        } catch (err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            console.error("LINK EMAIL SENDING ERROR:", err);
            return res.status(500).json({ message: "There was an error sending the email. Try again later." });
        }
    }
});


/**
 * @desc    Reset password using an OTP
 * @route   POST /api/auth/reset-password-with-otp
 * @access  Public
 */
export const resetPasswordWithOtp = asyncHandler(async (req, res, next) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
        return res.status(400).json({ message: "Please provide email, OTP, and a new password." });
    }
        const hashedToken = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
        email: email,
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() } 
    });

    if (!user) {
        return res.status(400).json({ message: "OTP is invalid or has expired." });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.status(200).json({ status: 'success', message: 'Password reset successfully.' });
});

/**
 * @desc    Handle the actual password reset
 * @route   PATCH /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: "Token is invalid or has expired." });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.status(200).json({ status: 'success', message: 'Password reset successfully.' });
});

/**
 * @desc    Initiate Google OAuth login
 * @route   GET /api/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res, next) => {
    try {
        const { platform = 'web', redirectUrl } = req.query;
        
        // Get the frontend URL that should receive the callback
        const frontendUrl = getFrontendUrl(req, redirectUrl);
        
        // Encode the frontend URL in state parameter (base64 for safety)
        const state = Buffer.from(JSON.stringify({ frontendUrl })).toString('base64');
        
        const authUrl = getGoogleAuthUrl(platform, state);
        res.status(200).json({
            status: 'success',
            message: 'Google OAuth URL generated',
            data: {
                authUrl,
                platform
            }
        });
    } catch (error) {
        // Google Auth Error (details not logged for security)
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate Google OAuth URL'
        });
    }
});

/**
 * @desc    Handle Google OAuth callback
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
// Helper function to get a valid name from Google user data
const getGoogleUserName = (googleUser) => {
    // Try name first
    if (googleUser.name && googleUser.name.trim()) {
        return googleUser.name.trim();
    }
    // Fallback to given_name + family_name
    const givenName = googleUser.given_name || '';
    const familyName = googleUser.family_name || '';
    const fullName = `${givenName} ${familyName}`.trim();
    if (fullName) {
        return fullName;
    }
    // Fallback to email username (part before @)
    if (googleUser.email) {
        const emailUsername = googleUser.email.split('@')[0];
        return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }
    // Last resort: default name
    return 'Google User';
};

export const googleCallback = asyncHandler(async (req, res, next) => {
    const { code, platform = 'web' } = req.query;

    if (!code) {
        return res.status(400).json({
            status: 'fail',
            message: 'Authorization code is required'
        });
    }

    let googleUser = null; // Declare outside try block for error handling
    try {
        // Exchange code for tokens
        const tokens = await getGoogleTokens(code, platform);
        
        // Get user info from Google
        googleUser = await getGoogleUserInfo(tokens, platform);

        if (!googleUser.email || !googleUser.verified_email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Google account email is not verified'
            });
        }

        // Get a valid name (with fallback)
        const userName = getGoogleUserName(googleUser);

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { email: googleUser.email },
                { googleId: googleUser.id }
            ]
        }).populate({
            path: 'subscriptions.planId',
            model: 'SubscriptionPlan',
            select: 'name price currency duration features isActive _id'
        });

        if (user) {
            // Update existing user with Google info if needed
            if (!user.googleId) {
                user.googleId = googleUser.id;
                user.authProvider = 'google';
                user.googleProfile = {
                    id: googleUser.id,
                    email: googleUser.email,
                    name: userName,
                    picture: googleUser.picture,
                    verified_email: googleUser.verified_email,
                    locale: googleUser.locale
                };
                // For OAuth users, mark email as verified
                user.isEmailVerified = true;
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                name: userName,
                email: googleUser.email,
                googleId: googleUser.id,
                authProvider: 'google',
                googleProfile: {
                    id: googleUser.id,
                    email: googleUser.email,
                    name: userName,
                    picture: googleUser.picture,
                    verified_email: googleUser.verified_email,
                    locale: googleUser.locale
                },
                isEmailVerified: true, // Google emails are pre-verified
                subscriptions: [],
                role: 'user'
            });

            await user.save();
        }

        // Extract frontend URL from state parameter (passed during OAuth initiation)
        // Fallback to default if state is missing or invalid (backward compatibility)
        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        try {
            const { state } = req.query;
            if (state) {
                const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
                if (decodedState && decodedState.frontendUrl) {
                    frontendUrl = decodedState.frontendUrl;
                }
            }
        } catch (error) {
            // If state parsing fails, use default (backward compatible with existing flows)
            // Fallback to default frontend URL
            console.warn('[Google Callback] Failed to parse OAuth state, using default frontend URL:', error.message);
        }
        
        // Generate JWT token for the user
        const sessionId = randomUUID();
        const token = generateTokenWithSession(user._id, user.role, sessionId);
        
        // Store session in Redis
        const redisKey = `${SESSION_PREFIX}${user._id.toString()}`;
        try {
            if (!redisClient.isOpen) {
                await redisClient.connect().catch(err => {
                    console.error('[Google Callback] Failed to connect to Redis:', err);
                });
            }
            if (redisClient.isOpen) {
                await redisClient.set(redisKey, sessionId, { EX: SESSION_EXPIRY_SECONDS });
                // Session stored in Redis (session ID not logged for security)
            }
        } catch (redisError) {
            console.error('[Google Callback] Error setting session in Redis:', redisError);
        }
        
        // Redirect to frontend with token
        const redirectUrl = `${frontendUrl}/auth/google/callback?token=${token}&success=true`;
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Google Callback Error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue,
            stack: error.stack
        });
        
        // Handle duplicate key errors (email or googleId already exists)
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            console.error(`Duplicate ${duplicateField} detected:`, error.keyValue);
            // Try to find the existing user and log them in
            try {
                const existingUser = await User.findOne({
                    $or: [
                        { email: googleUser?.email },
                        { googleId: googleUser?.id }
                    ]
                }).populate({
                    path: 'subscriptions.planId',
                    model: 'SubscriptionPlan',
                    select: 'name price currency duration features isActive _id'
                });
                
                if (existingUser) {
                    // Generate token for existing user
                    const sessionId = randomUUID();
                    const token = generateTokenWithSession(existingUser._id, existingUser.role, sessionId);
                    const redisKey = `${SESSION_PREFIX}${existingUser._id.toString()}`;
                    try {
                        if (!redisClient.isOpen) {
                            await redisClient.connect().catch(() => {});
                        }
                        if (redisClient.isOpen) {
                            await redisClient.set(redisKey, sessionId, { EX: SESSION_EXPIRY_SECONDS });
                        }
                    } catch (redisError) {
                        console.error('[Google Callback] Error setting session in Redis:', redisError);
                    }
                    // Extract frontend URL from state parameter
                    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                    try {
                        const { state } = req.query;
                        if (state) {
                            const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
                            if (decodedState && decodedState.frontendUrl) {
                                frontendUrl = decodedState.frontendUrl;
                            }
                        }
                    } catch (error) {
                        console.warn('[Google Callback] Failed to parse OAuth state, using default frontend URL:', error.message);
                    }
                    const redirectUrl = `${frontendUrl}/auth/google/callback?token=${token}&success=true`;
                    return res.redirect(redirectUrl);
                }
            } catch (findError) {
                console.error('Error finding existing user after duplicate key error:', findError);
            }
        }
        
        // Extract frontend URL from state parameter for error redirect
        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        try {
            const { state } = req.query;
            if (state) {
                const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
                if (decodedState && decodedState.frontendUrl) {
                    frontendUrl = decodedState.frontendUrl;
                }
            }
        } catch (error) {
            console.warn('[Google Callback] Failed to parse OAuth state, using default frontend URL:', error.message);
        }
        const errorMessage = error.message || 'Google authentication failed';
        const redirectUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(errorMessage)}`;
        res.redirect(redirectUrl);
    }
});

/**
 * @desc    Link Google account to existing user
 * @route   POST /api/auth/link-google
 * @access  Private
 */
export const linkGoogleAccount = asyncHandler(async (req, res, next) => {
    const { code } = req.body;
    const userId = req.user._id;

    if (!code) {
        return res.status(400).json({
            status: 'fail',
            message: 'Authorization code is required'
        });
    }

    try {
        // Exchange code for tokens
        const tokens = await getGoogleTokens(code);
        
        // Get user info from Google
        const googleUser = await getGoogleUserInfo(tokens);

        if (!googleUser.email || !googleUser.verified_email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Google account email is not verified'
            });
        }

        // Check if Google account is already linked to another user
        const existingGoogleUser = await User.findOne({ googleId: googleUser.id });
        if (existingGoogleUser && existingGoogleUser._id.toString() !== userId.toString()) {
            return res.status(400).json({
                status: 'fail',
                message: 'This Google account is already linked to another user'
            });
        }

        // Check if email matches current user
        const currentUser = await User.findById(userId);
        if (currentUser.email !== googleUser.email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Google account email does not match your current account email'
            });
        }

        // Link Google account
        currentUser.googleId = googleUser.id;
        currentUser.googleProfile = {
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            verified_email: googleUser.verified_email,
            locale: googleUser.locale
        };
        
        await currentUser.save();

        res.status(200).json({
            status: 'success',
            message: 'Google account linked successfully'
        });

    } catch (error) {
        console.error('Link Google Account Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to link Google account'
        });
    }
});

/**
 * @desc    Unlink Google account from user
 * @route   DELETE /api/auth/unlink-google
 * @access  Private
 */
export const unlinkGoogleAccount = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        
        if (!user.googleId) {
            return res.status(400).json({
                status: 'fail',
                message: 'No Google account is linked to this user'
            });
        }

        // Check if user has a password (local auth)
        if (!user.password) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cannot unlink Google account. Please set a password first or link another authentication method'
            });
        }

        // Unlink Google account
        user.googleId = undefined;
        user.googleProfile = undefined;
        user.authProvider = 'local';
        
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Google account unlinked successfully'
        });

    } catch (error) {
        console.error('Unlink Google Account Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to unlink Google account'
        });
    }
});

/**
 * @desc    Android Google OAuth with ID Token
 * @route   POST /api/auth/google/android
 * @access  Public
 */
export const androidGoogleAuth = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({
            status: 'fail',
            message: 'ID token is required for Android authentication'
        });
    }

    let googleUser = null; // Declare outside try block for error handling
    try {
        // Verify the Android ID token
        googleUser = await verifyAndroidIdToken(idToken);

        if (!googleUser.email || !googleUser.email_verified) {
            return res.status(400).json({
                status: 'fail',
                message: 'Google account email is not verified'
            });
        }

        // Get a valid name (with fallback)
        const userName = getGoogleUserName(googleUser);

        // Check if user already exists
        let user = await User.findOne({ 
            $or: [
                { email: googleUser.email },
                { googleId: googleUser.sub }
            ]
        }).populate({
            path: 'subscriptions.planId',
            model: 'SubscriptionPlan',
            select: 'name price currency duration features isActive _id'
        });

        if (user) {
            // Update existing user with Google info if needed
            if (!user.googleId) {
                user.googleId = googleUser.sub;
                user.authProvider = 'google';
                user.googleProfile = {
                    id: googleUser.sub,
                    email: googleUser.email,
                    name: userName,
                    picture: googleUser.picture,
                    verified_email: googleUser.email_verified,
                    locale: googleUser.locale
                };
                user.isEmailVerified = true;
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                name: userName,
                email: googleUser.email,
                googleId: googleUser.sub,
                authProvider: 'google',
                googleProfile: {
                    id: googleUser.sub,
                    email: googleUser.email,
                    name: userName,
                    picture: googleUser.picture,
                    verified_email: googleUser.email_verified,
                    locale: googleUser.locale
                },
                isEmailVerified: true,
                subscriptions: [],
                role: 'user'
            });

            await user.save();
        }

        // Send token response
        await sendTokenResponseWithSession(user, 200, res, 'Android Google login successful.');

    } catch (error) {
        console.error('Android Google Auth Error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue
        });
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            console.error(`Duplicate ${duplicateField} detected:`, error.keyValue);
            // Try to find the existing user and log them in
            try {
                const existingUser = await User.findOne({
                    $or: [
                        { email: googleUser?.email },
                        { googleId: googleUser?.sub }
                    ]
                }).populate({
                    path: 'subscriptions.planId',
                    model: 'SubscriptionPlan',
                    select: 'name price currency duration features isActive _id'
                });
                
                if (existingUser) {
                    return await sendTokenResponseWithSession(existingUser, 200, res, 'Android Google login successful.');
                }
            } catch (findError) {
                console.error('Error finding existing user after duplicate key error:', findError);
            }
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                status: 'fail',
                message: `Validation error: ${messages.join('. ')}`
            });
        }
        
        res.status(500).json({
            status: 'error',
            message: 'Android Google authentication failed'
        });
    }
});

/**
 * @desc    Link Google account to existing user (Android)
 * @route   POST /api/auth/link-google/android
 * @access  Private
 */
export const linkGoogleAccountAndroid = asyncHandler(async (req, res, next) => {
    const { idToken } = req.body;
    const userId = req.user._id;

    if (!idToken) {
        return res.status(400).json({
            status: 'fail',
            message: 'ID token is required for Android authentication'
        });
    }

    try {
        // Verify the Android ID token
        const googleUser = await verifyAndroidIdToken(idToken);

        if (!googleUser.email || !googleUser.email_verified) {
            return res.status(400).json({
                status: 'fail',
                message: 'Google account email is not verified'
            });
        }

        // Check if Google account is already linked to another user
        const existingGoogleUser = await User.findOne({ googleId: googleUser.sub });
        if (existingGoogleUser && existingGoogleUser._id.toString() !== userId.toString()) {
            return res.status(400).json({
                status: 'fail',
                message: 'This Google account is already linked to another user'
            });
        }

        // Check if email matches current user
        const currentUser = await User.findById(userId);
        if (currentUser.email !== googleUser.email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Google account email does not match your current account email'
            });
        }

        // Link Google account
        currentUser.googleId = googleUser.sub;
        currentUser.googleProfile = {
            id: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            verified_email: googleUser.email_verified,
            locale: googleUser.locale
        };
        
        await currentUser.save();

        res.status(200).json({
            status: 'success',
            message: 'Google account linked successfully via Android'
        });

    } catch (error) {
        console.error('Link Google Account Android Error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to link Google account via Android'
        });
    }
});