import crypto from 'crypto';
import { randomUUID } from 'crypto';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient from '../config/redisClient.js';
import sendEmail from '../utils/email.js';
import { formatMobileNumber, validateMobileNumber } from '../utils/smsService.js';
import { assignFreeFoundationToUser } from '../services/defaultSubscriptionService.js';
import { issueLoginPinForUser } from './phonePinAuthController.js';

const SESSION_PREFIX = 'session:user:';
const SESSION_EXPIRY_SECONDS = process.env.JWT_EXPIRES_IN_SECONDS
    ? parseInt(process.env.JWT_EXPIRES_IN_SECONDS, 10)
    : 60 * 60 * 24 * 7;

export const sendTokenResponseWithSession = async (user, statusCode, res, message = 'Operation successful.') => {
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
        console.error('[Auth] Redis session error:', redisError);
    }

    const userForResponse = user.toObject ? user.toObject() : { ...user };
    delete userForResponse.password;
    delete userForResponse.loginPin;
    delete userForResponse.activeSessions;
    delete userForResponse.mobileOtpToken;
    delete userForResponse.mobileOtpExpires;
    delete userForResponse.emailVerificationToken;
    delete userForResponse.emailVerificationExpires;

    if (!Array.isArray(userForResponse.subscriptions)) {
        userForResponse.subscriptions = [];
    }

    res.status(statusCode).json({
        status: 'success',
        message,
        token,
        data: { user: userForResponse },
    });
};

const sendVerificationOtpEmail = async (user, otp) => {
    const htmlMessage = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Verify your email</h2>
            <p>Hello${user.name ? ` ${user.name}` : ''},</p>
            <p>Your verification code is:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0D47A1;">${otp}</p>
            <p>This code is valid for 10 minutes.</p>
        </div>
    `;
    await sendEmail({
        email: user.email,
        subject: 'Verify your Verble email',
        html: htmlMessage,
    });
};

/**
 * @desc Register — name, email, phone (no password). Sends email OTP.
 */
export const register = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, mobile } = req.body;
    const phoneRaw = phoneNumber || mobile;

    if (!name?.trim() || !email?.trim() || !phoneRaw?.trim()) {
        return res.status(400).json({
            status: 'fail',
            message: 'Name, email, and phone number are required.',
        });
    }

    const formattedPhone = formatMobileNumber(phoneRaw, process.env.DEFAULT_COUNTRY_CODE || '+91');
    if (!formattedPhone || !validateMobileNumber(formattedPhone)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid phone number. Include country code (e.g. +919876543210).',
        });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({
        $or: [{ email: normalizedEmail }, { phoneNumber: formattedPhone }, { mobile: formattedPhone }],
    });

    if (existing) {
        return res.status(400).json({
            status: 'fail',
            message: 'An account with this email or phone number already exists.',
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phoneNumber: formattedPhone,
        mobile: formattedPhone,
        authProvider: 'phone_pin',
        isEmailVerified: false,
        emailVerificationToken: hashedOTP,
        emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
        role: 'user',
    });

    await sendVerificationOtpEmail(user, otp);

    res.status(201).json({
        status: 'success',
        message: 'Registration started. Please check your email for the verification code.',
        data: { email: normalizedEmail },
    });
});

/**
 * @desc Verify email OTP — issues login PIN by email; does NOT auto-login.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ status: 'fail', message: 'Email and OTP are required.' });
    }

    const hashedOTP = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    const user = await User.findOne({
        email: email.toLowerCase().trim(),
        emailVerificationToken: hashedOTP,
        emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ status: 'fail', message: 'Invalid or expired verification code.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await assignFreeFoundationToUser(user._id);

    try {
        await issueLoginPinForUser(user);
    } catch (err) {
        console.error('[verifyEmail] PIN email failed:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Email verified but we could not send your login PIN. Use Forgot PIN on the login page.',
        });
    }

    res.status(200).json({
        status: 'success',
        message:
            'Email verified! Your 6-digit login PIN has been sent to your email. Sign in with your phone number and PIN. Keep your PIN safe—you can change it from your dashboard.',
        data: { email: user.email },
    });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ status: 'fail', message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        return res.status(200).json({ message: 'If an account exists, a new code has been sent.' });
    }
    if (user.isEmailVerified) {
        return res.status(400).json({ status: 'fail', message: 'This email is already verified. Use login instead.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationToken = crypto.createHash('sha256').update(otp).digest('hex');
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    await sendVerificationOtpEmail(user, otp);

    res.status(200).json({ message: 'A new verification code has been sent to your email.' });
});

/** Legacy email/password login (admin fallback). */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ status: 'fail', message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
    }
    if (!user.isEmailVerified) {
        return res.status(403).json({
            status: 'fail',
            message: 'Please verify your email before logging in.',
            code: 'EMAIL_NOT_VERIFIED',
            data: { email: user.email },
        });
    }

    const populated = await User.findById(user._id).populate({
        path: 'subscriptions.planId',
        model: 'SubscriptionPlan',
        select: 'name price currency duration features isActive _id',
    });

    await sendTokenResponseWithSession(populated, 200, res, 'Logged in successfully.');
});

export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate({
            path: 'subscriptions.planId',
            model: 'SubscriptionPlan',
            select: 'name price currency duration features isActive _id',
        });

    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.loginPin;

    res.status(200).json({
        status: 'success',
        data: { user: userObj },
    });
});

export const logout = asyncHandler(async (req, res) => {
    if (req.user?._id && redisClient.isOpen) {
        await redisClient.del(`${SESSION_PREFIX}${req.user._id.toString()}`);
    }
    res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: 'Password reset is disabled. Please use phone + PIN login or Forgot PIN on the login page.',
    });
});

export const resetPassword = asyncHandler(async (req, res) => {
    res.status(400).json({
        status: 'fail',
        message: 'Password reset is disabled. Use Forgot PIN on the login page.',
    });
});
