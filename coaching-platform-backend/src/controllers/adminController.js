import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { formatMobileNumber, validateMobileNumber } from '../utils/smsService.js';
import { assignFreeFoundationToUser } from '../services/defaultSubscriptionService.js';
import {
    forceFreeResetForAdminDowngrade,
    updateUnlockedLevelsFromSubscriptions,
} from '../services/subscriptionAccessService.js';
import { issueLoginPinForUser } from './phonePinAuthController.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Video from '../models/Video.js';
import Course from '../models/Course.js';

const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    delete obj.loginPin;
    delete obj.emailVerificationToken;
    delete obj.mobileOtpToken;
    if (!Array.isArray(obj.subscriptions)) obj.subscriptions = [];
    return obj;
};

/** Admin detail view — includes PIN metadata but never the hashed PIN. */
const sanitizeUserForAdminDetail = (user) => {
    const obj = sanitizeUser(user);
    obj.authProvider = user.authProvider;
    obj.loginPinIssuedAt = user.loginPinIssuedAt || null;
    obj.hasLoginPin = Boolean(user.loginPinIssuedAt);
    return obj;
};

export const getPlatformStats = asyncHandler(async (req, res) => {
    const [totalUsers, totalVideos, publishedVideos, totalCourses, publishedCourses] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        Video.countDocuments(),
        Video.countDocuments({ isPublished: true }),
        Course.countDocuments(),
        Course.countDocuments({ isPublished: true }),
    ]);

    const activeUserSubscriptions = await User.countDocuments({
        'subscriptions.status': 'active',
        role: 'user',
    });

    res.status(200).json({
        status: 'success',
        data: {
            stats: {
                totalUsers,
                activeUserSubscriptions,
                totalVideos,
                publishedVideos,
                totalCourses,
                publishedCourses,
            },
        },
    });
});

const FREE_FOUNDATION_NAME = 'Free Foundation';
const isStandaloneBonusPlanName = (name = '') => name.trim().toLowerCase() === 'bonus';

const getActiveSubscriptions = (user) => {
    const now = new Date();
    return (user.subscriptions || []).filter(
        (s) =>
            s.status === 'active' &&
            s.startDate &&
            s.endDate &&
            new Date(s.startDate) <= now &&
            new Date(s.endDate) >= now
    );
};

const activeSubscriptionElemMatch = (extra = {}) => {
    const now = new Date();
    return {
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
        ...extra,
    };
};

/** MongoDB filter for admin user list segments (pagination-friendly). */
const buildUserListQuery = (search, segment) => {
    const query = {};

    if (search && String(search).trim()) {
        const term = String(search).trim();
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        query.$or = [{ name: regex }, { email: regex }, { phoneNumber: regex }, { mobile: regex }];
    }

    if (segment === 'premium') {
        query.subscriptions = {
            $elemMatch: activeSubscriptionElemMatch({ planName: { $ne: FREE_FOUNDATION_NAME } }),
        };
    } else if (segment === 'free') {
        query.$and = [
            {
                subscriptions: {
                    $elemMatch: activeSubscriptionElemMatch({ planName: FREE_FOUNDATION_NAME }),
                },
            },
            {
                subscriptions: {
                    $not: {
                        $elemMatch: activeSubscriptionElemMatch({ planName: { $ne: FREE_FOUNDATION_NAME } }),
                    },
                },
            },
        ];
    }

    return query;
};

export const getAllUsers = asyncHandler(async (req, res) => {
    const { search, segment, page: pageRaw, limit: limitRaw } = req.query;
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const limit = Math.min(Math.max(parseInt(limitRaw, 10) || 25, 1), 100);
    const skip = (page - 1) * limit;

    const seg = segment === 'free' || segment === 'premium' ? segment : 'all';
    const query = buildUserListQuery(search, search ? 'all' : seg);

    const [total, users] = await Promise.all([
        User.countDocuments(query),
        User.find(query)
            .select('-password -loginPin')
            .populate({
                path: 'subscriptions.planId',
                model: 'SubscriptionPlan',
                select: 'name price currency duration isActive _id',
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.status(200).json({
        status: 'success',
        data: {
            users: users.map(sanitizeUser),
            pagination: { page, limit, total, totalPages },
        },
    });
});

export const resendLoginPinForUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }
    if (!user.email) {
        return res.status(400).json({ status: 'fail', message: 'User has no email on file.' });
    }

    let plainPin;
    try {
        plainPin = await issueLoginPinForUser(user);
    } catch (err) {
        console.error('[Admin resendLoginPin] failed:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to send login PIN email.',
        });
    }

    const refreshed = await User.findById(user._id).select('loginPinIssuedAt');

    res.status(200).json({
        status: 'success',
        message: `Login PIN sent to ${user.email}.`,
        data: {
            loginPin: plainPin,
            loginPinIssuedAt: refreshed?.loginPinIssuedAt || new Date(),
        },
    });
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId)
        .select('-password -loginPin')
        .populate({
            path: 'subscriptions.planId',
            model: 'SubscriptionPlan',
            select: 'name price currency duration features isActive _id',
        });

    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    res.status(200).json({ status: 'success', data: { user: sanitizeUserForAdminDetail(user) } });
});

export const createUserByAdmin = asyncHandler(async (req, res) => {
    const { name, email, phoneNumber, mobile, role } = req.body;
    const phoneRaw = phoneNumber || mobile;

    if (!name?.trim() || !email?.trim() || !phoneRaw?.trim()) {
        return res.status(400).json({
            status: 'fail',
            message: 'Name, email, and phone number are required.',
        });
    }

    const formattedPhone = formatMobileNumber(phoneRaw, process.env.DEFAULT_COUNTRY_CODE || '+91');
    if (!formattedPhone || !validateMobileNumber(formattedPhone)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid phone number format.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({
        $or: [{ email: normalizedEmail }, { phoneNumber: formattedPhone }, { mobile: formattedPhone }],
    });
    if (exists) {
        return res.status(400).json({ status: 'fail', message: 'User with this email or phone already exists.' });
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phoneNumber: formattedPhone,
        mobile: formattedPhone,
        role: role === 'admin' ? 'admin' : 'user',
        authProvider: 'phone_pin',
        isEmailVerified: true,
    });

    await assignFreeFoundationToUser(user._id);

    try {
        await issueLoginPinForUser(user);
    } catch (err) {
        console.error('[Admin createUser] PIN email failed:', err);
    }

    const populated = await User.findById(user._id)
        .select('-password -loginPin')
        .populate({
            path: 'subscriptions.planId',
            model: 'SubscriptionPlan',
            select: 'name price currency duration features isActive _id',
        });

    res.status(201).json({
        status: 'success',
        message: 'User created. Login PIN sent to their email.',
        data: { user: sanitizeUser(populated) },
    });
});

export const updateUserInfo = asyncHandler(async (req, res) => {
    const { name, phoneNumber } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (phoneNumber !== undefined) {
        if (phoneNumber === null || phoneNumber === '') {
            return res.status(400).json({ status: 'fail', message: 'Phone number is required.' });
        }
        const formatted = formatMobileNumber(phoneNumber, process.env.DEFAULT_COUNTRY_CODE || '+91');
        if (!formatted || !validateMobileNumber(formatted)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid phone number.' });
        }
        user.phoneNumber = formatted;
        user.mobile = formatted;
    }

    await user.save();

    const populated = await User.findById(user._id)
        .select('-password -loginPin')
        .populate({ path: 'subscriptions.planId', model: 'SubscriptionPlan' });

    res.status(200).json({ status: 'success', data: { user: sanitizeUser(populated) } });
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid role.' });
    }

    const user = await User.findByIdAndUpdate(
        req.params.userId,
        { role },
        { new: true, runValidators: true }
    )
        .select('-password -loginPin')
        .populate({ path: 'subscriptions.planId', model: 'SubscriptionPlan' });

    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    res.status(200).json({ status: 'success', data: { user: sanitizeUser(user) } });
});

export const updateUserPassword = asyncHandler(async (req, res) => {
    res.status(400).json({
        status: 'fail',
        message: 'Password updates are disabled. Users sign in with phone + PIN.',
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.status(200).json({
        status: 'success',
        message: 'User deleted.',
        data: {
            deletedUser: { _id: user._id, email: user.email, name: user.name },
            deletedRecords: {},
        },
    });
});

export const addSubscriptionToUser = asyncHandler(async (req, res) => {
    const { planId, startDate, endDate, status } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
        return res.status(404).json({ status: 'fail', message: 'Plan not found.' });
    }
    if (isStandaloneBonusPlanName(plan.name)) {
        return res.status(400).json({
            status: 'fail',
            message: 'BONUS cannot be assigned directly. Assign GOLD plan instead.',
        });
    }

    const start = startDate ? new Date(startDate) : new Date();
    let computedEnd = endDate ? new Date(endDate) : null;
    if (!computedEnd && plan.duration) {
        computedEnd = new Date(start);
        const { value, unit } = plan.duration;
        switch (unit) {
            case 'day':
                computedEnd.setDate(computedEnd.getDate() + value);
                break;
            case 'week':
                computedEnd.setDate(computedEnd.getDate() + value * 7);
                break;
            case 'month':
                computedEnd.setMonth(computedEnd.getMonth() + value);
                break;
            case 'year':
                computedEnd.setFullYear(computedEnd.getFullYear() + value);
                break;
            default:
                computedEnd.setFullYear(computedEnd.getFullYear() + 1);
        }
    }
    if (!computedEnd) {
        computedEnd = new Date(start);
        computedEnd.setFullYear(computedEnd.getFullYear() + 1);
    }

    const hasActiveSamePlan = (user.subscriptions || []).some((sub) => {
        if (!sub?.planId || sub.status !== 'active') return false;
        const subPlanId = sub.planId.toString();
        const subStart = sub.startDate ? new Date(sub.startDate) : null;
        const subEnd = sub.endDate ? new Date(sub.endDate) : null;
        if (!subStart || !subEnd) return false;
        return subPlanId === plan._id.toString() && subStart <= computedEnd && subEnd >= start;
    });
    if (hasActiveSamePlan) {
        return res.status(409).json({
            status: 'fail',
            message: 'This subscription plan is already active for the selected date range.',
        });
    }

    user.subscriptions.push({
        planId: plan._id,
        planName: plan.name,
        status: status || 'active',
        startDate: start,
        endDate: computedEnd,
    });
    await user.save();

    await updateUnlockedLevelsFromSubscriptions(user._id);

    const populated = await User.findById(user._id)
        .select('-password -loginPin')
        .populate({ path: 'subscriptions.planId', model: 'SubscriptionPlan' });

    res.status(200).json({ status: 'success', data: { user: sanitizeUser(populated) } });
});

export const removeSubscriptionFromUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    user.subscriptions = user.subscriptions.filter(
        (s) => s._id.toString() !== req.params.subscriptionInstanceId
    );
    await user.save();

    // Admin-selected downgrade path: hard reset learner to FREE + 0-day.
    await forceFreeResetForAdminDowngrade(user._id);

    const populated = await User.findById(user._id)
        .select('-password -loginPin')
        .populate({ path: 'subscriptions.planId', model: 'SubscriptionPlan' });

    res.status(200).json({
        status: 'success',
        message: 'Subscription removed. User reset to FREE with 0-day streak.',
        data: { user: sanitizeUserForAdminDetail(populated) },
    });
});
