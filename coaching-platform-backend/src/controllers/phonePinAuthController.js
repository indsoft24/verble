import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import redisClient from '../config/redisClient.js';
import { formatMobileNumber, validateMobileNumber } from '../utils/smsService.js';
import { generateLoginPin, isValidLoginPinFormat } from '../utils/loginPin.js';
import { sendLoginPinEmail } from '../utils/loginPinEmail.js';
import { sendTokenResponseWithSession } from './authController.js';

const LOGIN_ATTEMPT_PREFIX = 'loginpin:attempts:';
const FORGOT_PIN_PREFIX = 'loginpin:forgot:';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;
const FORGOT_PIN_COOLDOWN_SECONDS = 60;
const REGENERATE_PIN_PREFIX = 'loginpin:regen:';
const REGENERATE_PIN_COOLDOWN_SECONDS = 30;

const normalizePhone = (phoneNumber) =>
    formatMobileNumber(phoneNumber, process.env.DEFAULT_COUNTRY_CODE || '+91');

const findUserByPhone = async (formattedPhone) => {
    return User.findOne({
        $or: [{ phoneNumber: formattedPhone }, { mobile: formattedPhone }],
    })
        .select('+loginPin')
        .populate({
            path: 'subscriptions.planId',
            model: 'SubscriptionPlan',
            select: 'name price currency duration features isActive _id',
        });
};

const checkLoginLockout = async (formattedPhone) => {
    if (!redisClient.isOpen) return null;
    const key = `${LOGIN_ATTEMPT_PREFIX}${formattedPhone}`;
    const attempts = parseInt((await redisClient.get(key)) || '0', 10);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const ttl = await redisClient.ttl(key);
        return ttl > 0 ? ttl : LOGIN_LOCK_SECONDS;
    }
    return null;
};

const recordFailedLogin = async (formattedPhone) => {
    if (!redisClient.isOpen) return;
    const key = `${LOGIN_ATTEMPT_PREFIX}${formattedPhone}`;
    const attempts = await redisClient.incr(key);
    if (attempts === 1) {
        await redisClient.expire(key, LOGIN_LOCK_SECONDS);
    }
};

const clearLoginAttempts = async (formattedPhone) => {
    if (!redisClient.isOpen) return;
    await redisClient.del(`${LOGIN_ATTEMPT_PREFIX}${formattedPhone}`);
};

/**
 * @desc    Login with phone number and PIN
 * @route   POST /api/auth/phone-pin/login
 */
export const loginWithPhonePin = asyncHandler(async (req, res) => {
    const { phoneNumber, pin } = req.body;

    if (!phoneNumber || !pin) {
        return res.status(400).json({ status: 'fail', message: 'Phone number and PIN are required.' });
    }
    if (!isValidLoginPinFormat(pin)) {
        return res.status(400).json({ status: 'fail', message: 'PIN must be a 6-digit number.' });
    }

    const formattedPhone = normalizePhone(phoneNumber);
    if (!formattedPhone || !validateMobileNumber(formattedPhone)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid phone number format. Include country code (e.g. +919876543210).',
        });
    }

    const lockTtl = await checkLoginLockout(formattedPhone);
    if (lockTtl) {
        return res.status(429).json({
            status: 'fail',
            message: `Too many failed attempts. Try again in ${lockTtl} seconds.`,
        });
    }

    const user = await findUserByPhone(formattedPhone);
    if (!user || !user.loginPin) {
        await recordFailedLogin(formattedPhone);
        return res.status(401).json({ status: 'fail', message: 'Incorrect phone number or PIN.' });
    }

    if (!user.isEmailVerified) {
        return res.status(403).json({
            status: 'fail',
            message: 'Please verify your email before logging in.',
            code: 'EMAIL_NOT_VERIFIED',
            data: { email: user.email },
        });
    }

    const pinMatch = await user.compareLoginPin(pin);
    if (!pinMatch) {
        await recordFailedLogin(formattedPhone);
        return res.status(401).json({ status: 'fail', message: 'Incorrect phone number or PIN.' });
    }

    await clearLoginAttempts(formattedPhone);

    if (!user.phoneNumber) {
        user.phoneNumber = formattedPhone;
    }
    if (!user.termsAcceptedAt) {
        user.termsAcceptedAt = new Date();
    }
    await user.save();

    await sendTokenResponseWithSession(user, 200, res, 'Logged in successfully.');
});

/**
 * @desc    Change login PIN (authenticated)
 * @route   PATCH /api/auth/phone-pin/change-pin
 */
export const changeLoginPin = asyncHandler(async (req, res) => {
    const { currentPin, newPin } = req.body;

    if (!newPin) {
        return res.status(400).json({ status: 'fail', message: 'New PIN is required.' });
    }
    if (!isValidLoginPinFormat(newPin)) {
        return res.status(400).json({ status: 'fail', message: 'PIN must be a 6-digit number.' });
    }

    const user = await User.findById(req.user._id).select('+loginPin');
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    if (!user.isEmailVerified) {
        return res.status(403).json({
            status: 'fail',
            message: 'Please verify your email before setting a login PIN.',
        });
    }

    // First-time PIN setup (no existing PIN)
    if (!user.loginPin) {
        user.loginPin = newPin;
        user.authProvider = 'phone_pin';
        await user.save();
        return res.status(200).json({ status: 'success', message: 'Login PIN set successfully.' });
    }

    if (!currentPin) {
        return res.status(400).json({ status: 'fail', message: 'Current PIN is required to change your PIN.' });
    }
    if (!isValidLoginPinFormat(currentPin)) {
        return res.status(400).json({ status: 'fail', message: 'Current PIN must be a 6-digit number.' });
    }
    if (currentPin === newPin) {
        return res.status(400).json({ status: 'fail', message: 'New PIN must be different from current PIN.' });
    }

    const match = await user.compareLoginPin(currentPin);
    if (!match) {
        return res.status(401).json({ status: 'fail', message: 'Current PIN is incorrect.' });
    }

    user.loginPin = newPin;
    await user.save();

    res.status(200).json({ status: 'success', message: 'PIN updated successfully.' });
});

/**
 * @desc    Forgot PIN — email new PIN to registered email
 * @route   POST /api/auth/phone-pin/forgot-pin
 */
export const forgotLoginPin = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ status: 'fail', message: 'Phone number is required.' });
    }

    const formattedPhone = normalizePhone(phoneNumber);
    if (!formattedPhone || !validateMobileNumber(formattedPhone)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid phone number format.' });
    }

    const genericMessage =
        'If an account exists with this phone number and verified email, a new PIN has been sent to your email.';

    if (redisClient.isOpen) {
        const cooldownKey = `${FORGOT_PIN_PREFIX}${formattedPhone}`;
        const exists = await redisClient.get(cooldownKey);
        if (exists) {
            const ttl = await redisClient.ttl(cooldownKey);
            return res.status(429).json({
                status: 'fail',
                message: `Please wait ${ttl > 0 ? ttl : FORGOT_PIN_COOLDOWN_SECONDS} seconds before requesting again.`,
            });
        }
    }

    const user = await User.findOne({
        $or: [{ phoneNumber: formattedPhone }, { mobile: formattedPhone }],
        isEmailVerified: true,
    });

    if (!user) {
        return res.status(200).json({ status: 'success', message: genericMessage });
    }

    const plainPin = generateLoginPin();
    user.loginPin = plainPin;
    await user.save();

    try {
        await sendLoginPinEmail(user, plainPin);
        if (redisClient.isOpen) {
            await redisClient.set(`${FORGOT_PIN_PREFIX}${formattedPhone}`, '1', {
                EX: FORGOT_PIN_COOLDOWN_SECONDS,
            });
        }
    } catch (err) {
        console.error('[ForgotPin] Email failed:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Could not send PIN email. Please try again later.',
        });
    }

    res.status(200).json({ status: 'success', message: genericMessage });
});

/**
 * @desc    Regenerate login PIN after verifying current PIN (authenticated)
 * @route   POST /api/auth/phone-pin/regenerate-after-verify
 */
export const regenerateLoginPinAfterVerification = asyncHandler(async (req, res) => {
    const { currentPin } = req.body;
    if (!currentPin) {
        return res.status(400).json({ status: 'fail', message: 'Current PIN is required.' });
    }
    if (!isValidLoginPinFormat(currentPin)) {
        return res.status(400).json({ status: 'fail', message: 'Current PIN must be a 6-digit number.' });
    }

    const user = await User.findById(req.user._id).select('+loginPin');
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }
    if (!user.loginPin) {
        return res.status(400).json({ status: 'fail', message: 'No login PIN is set for this account.' });
    }

    if (redisClient.isOpen) {
        const cooldownKey = `${REGENERATE_PIN_PREFIX}${user._id.toString()}`;
        const exists = await redisClient.get(cooldownKey);
        if (exists) {
            const ttl = await redisClient.ttl(cooldownKey);
            return res.status(429).json({
                status: 'fail',
                message: `Please wait ${ttl > 0 ? ttl : REGENERATE_PIN_COOLDOWN_SECONDS} seconds before requesting again.`,
            });
        }
    }

    const isMatch = await user.compareLoginPin(currentPin);
    if (!isMatch) {
        return res.status(401).json({ status: 'fail', message: 'Current PIN is incorrect.' });
    }

    const newPin = generateLoginPin();
    user.loginPin = newPin;
    await user.save();

    try {
        await sendLoginPinEmail(user, newPin);
        if (redisClient.isOpen) {
            await redisClient.set(`${REGENERATE_PIN_PREFIX}${user._id.toString()}`, '1', {
                EX: REGENERATE_PIN_COOLDOWN_SECONDS,
            });
        }
    } catch (err) {
        console.error('[RegeneratePin] Email failed:', err);
    }

    res.status(200).json({
        status: 'success',
        message: 'A new PIN has been generated after verification.',
        data: { newPin },
    });
});

/** Issue a new PIN and email it (used after email verification). */
export const issueLoginPinForUser = async (user) => {
    const plainPin = generateLoginPin();
    user.loginPin = plainPin;
    user.authProvider = 'phone_pin';
    await user.save();
    await sendLoginPinEmail(user, plainPin);
    return plainPin;
};
