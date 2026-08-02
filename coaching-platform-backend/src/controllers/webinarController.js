import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import Webinar from '../models/Webinar.js';
import WebinarRegistration from '../models/WebinarRegistration.js';
import User from '../models/User.js';
import { getRazorpayConfig } from '../config/razorpayConfig.js';

const isObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ''));

const slugify = (text) =>
    String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const parseTopics = (topicsRaw) => {
    if (Array.isArray(topicsRaw)) {
        return topicsRaw.map((t) => String(t || '').trim()).filter(Boolean);
    }
    return String(topicsRaw || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
};

const hasActivePaidSubscription = (user) => {
    if (!user) return false;
    const now = new Date();
    const active = (user.subscriptions || []).some(
        (sub) => sub?.status === 'active' && sub?.endDate && new Date(sub.endDate) > now
    );
    if (!active) return false;
    return ['GOLD', 'FULL_COURSE'].includes(String(user.membershipLevel || '').toUpperCase());
};

/** True when user has no active Gold / Full-course subscription (gamification tier alone does not count). */
const isNonSubscriberUser = (user) => {
    if (!user) return false;
    return !hasActivePaidSubscription(user);
};

const getRegistrationEligibility = (webinar, user) => {
    if (!user) {
        return { canRegister: false, reason: 'LOGIN_REQUIRED' };
    }
    if (user.role === 'admin') {
        return { canRegister: true, reason: null };
    }
    if (webinar.audience === 'ALL') {
        return { canRegister: true, reason: null };
    }
    if (webinar.audience === 'FREE_ONLY') {
        if (isNonSubscriberUser(user)) {
            return { canRegister: true, reason: null };
        }
        return {
            canRegister: false,
            reason: 'SUBSCRIBERS_EXCLUDED',
            message: 'This webinar is for learners without an active Gold or Full Course subscription.',
        };
    }
    if (webinar.audience === 'PAID_SUBSCRIBERS') {
        if (hasActivePaidSubscription(user)) {
            return { canRegister: true, reason: null };
        }
        return {
            canRegister: false,
            reason: 'SUBSCRIPTION_REQUIRED',
            message: 'This webinar is available only to active Gold or Full Course subscribers.',
        };
    }
    return { canRegister: false, reason: 'UNKNOWN', message: 'You are not eligible to register for this webinar.' };
};

const canAudienceRegister = (webinar, user) => getRegistrationEligibility(webinar, user).canRegister;

/** If admin switched webinar to FREE, clear stale payment-pending registrations. */
const reconcileRegistrationForWebinar = async (webinar, registration) => {
    if (!registration || webinar.mode !== 'FREE' || registration.status !== 'PAYMENT_PENDING') {
        return registration;
    }
    await WebinarRegistration.updateOne(
        { _id: registration._id },
        {
            $set: {
                status: 'REGISTERED',
                accessGrantedBySubscription: false,
                'payment.amount': 0,
                'payment.currency': 'INR',
            },
        }
    );
    return WebinarRegistration.findById(registration._id).lean();
};

const loadWebinarJoinContext = async (webinarId, userId) => {
    if (!isObjectId(webinarId)) {
        const err = new Error('Invalid webinar id.');
        err.statusCode = 400;
        throw err;
    }
    const webinar = await Webinar.findById(webinarId).select('+meetingLink');
    if (!webinar || !webinar.isPublished || webinar.isArchived) {
        const err = new Error('Webinar not found.');
        err.statusCode = 404;
        throw err;
    }
    let registration = await WebinarRegistration.findOne({
        webinarId: webinar._id,
        userId,
    });
    if (registration) {
        registration = await reconcileRegistrationForWebinar(webinar, registration);
    }
    if (!registration) {
        const err = new Error('Please register before joining this webinar.');
        err.statusCode = 403;
        throw err;
    }
    const paidOk =
        webinar.mode === 'FREE' ||
        registration.status === 'PAYMENT_DONE' ||
        registration.accessGrantedBySubscription ||
        registration.status === 'REGISTERED';
    if (!paidOk) {
        const err = new Error('Payment is pending for this webinar.');
        err.statusCode = 403;
        throw err;
    }
    if (!canJoinNow(webinar)) {
        const err = new Error('Join is available only in the live access window.');
        err.statusCode = 403;
        throw err;
    }
    if (!webinar.meetingLink) {
        const err = new Error('Meeting link is not configured for this webinar.');
        err.statusCode = 404;
        throw err;
    }
    return { webinar, registration };
};

const computeJoinWindow = (webinar) => {
    const startsAt = new Date(webinar.startsAt);
    const endsAt = new Date(webinar.endsAt);
    const openAt = new Date(startsAt.getTime() - (webinar.joinWindowBeforeMinutes || 0) * 60 * 1000);
    const closeAt = new Date(endsAt.getTime() + (webinar.joinWindowAfterMinutes || 0) * 60 * 1000);
    return { openAt, closeAt, now: new Date() };
};

const canJoinNow = (webinar) => {
    const { openAt, closeAt, now } = computeJoinWindow(webinar);
    return now >= openAt && now <= closeAt;
};

const sanitizeWebinar = (webinarDoc, registration = null, user = null) => {
    const webinar = webinarDoc.toObject ? webinarDoc.toObject() : webinarDoc;
    const joinWindow = computeJoinWindow(webinar);
    const eligibility = getRegistrationEligibility(webinar, user);
    return {
        ...webinar,
        canJoinNow: joinWindow.now >= joinWindow.openAt && joinWindow.now <= joinWindow.closeAt,
        joinWindowOpenAt: joinWindow.openAt,
        joinWindowCloseAt: joinWindow.closeAt,
        canRegister: eligibility.canRegister,
        registrationBlockedReason: eligibility.reason,
        registrationBlockedMessage: eligibility.message || null,
        registration: registration
            ? {
                  status: registration.status,
                  accessGrantedBySubscription: Boolean(registration.accessGrantedBySubscription),
                  payment: registration.payment || undefined,
              }
            : null,
    };
};

export const listWebinarsForUsers = asyncHandler(async (req, res) => {
    const now = new Date();
    const webinars = await Webinar.find({
        isPublished: true,
        isArchived: false,
        endsAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    })
        .select('-meetingLink')
        .sort({ startsAt: 1, sortPriority: -1, createdAt: -1 })
        .lean();

    res.status(200).json({
        status: 'success',
        data: { webinars },
    });
});

export const getWebinarBySlugForUsers = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const webinar = await Webinar.findOne({
        slug: String(slug || '').toLowerCase(),
        isPublished: true,
        isArchived: false,
    }).select('-meetingLink');
    if (!webinar) {
        res.status(404);
        throw new Error('Webinar not found.');
    }

    let registration = null;
    if (req.user?._id) {
        registration = await WebinarRegistration.findOne({
            webinarId: webinar._id,
            userId: req.user._id,
        }).lean();
        registration = await reconcileRegistrationForWebinar(webinar, registration);
    }

    res.status(200).json({
        status: 'success',
        data: { webinar: sanitizeWebinar(webinar, registration, req.user) },
    });
});

export const listWebinarsForAdmin = asyncHandler(async (req, res) => {
    const webinars = await Webinar.find({})
        .sort({ startsAt: -1, createdAt: -1 })
        .lean();

    const counts = await WebinarRegistration.aggregate([
        {
            $group: {
                _id: '$webinarId',
                total: { $sum: 1 },
                registered: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['REGISTERED', 'PAYMENT_DONE']] }, 1, 0],
                    },
                },
                paymentPending: {
                    $sum: { $cond: [{ $eq: ['$status', 'PAYMENT_PENDING'] }, 1, 0] },
                },
            },
        },
    ]);
    const countMap = new Map(counts.map((row) => [String(row._id), row]));
    const webinarsWithCounts = webinars.map((w) => {
        const c = countMap.get(String(w._id));
        return {
            ...w,
            registrationCount: c?.total || 0,
            registeredCount: c?.registered || 0,
            paymentPendingCount: c?.paymentPending || 0,
        };
    });

    res.status(200).json({ status: 'success', data: { webinars: webinarsWithCounts } });
});

export const listWebinarRegistrationsForAdmin = asyncHandler(async (req, res) => {
    const {
        webinarId,
        status,
        search,
        page = '1',
        limit = '50',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    const summaryFilter = {};
    if (webinarId && isObjectId(webinarId)) {
        const webinarObjectId = new mongoose.Types.ObjectId(String(webinarId));
        filter.webinarId = webinarObjectId;
        summaryFilter.webinarId = webinarObjectId;
    }
    if (status && ['REGISTERED', 'PAYMENT_PENDING', 'PAYMENT_DONE', 'CANCELLED'].includes(String(status))) {
        filter.status = String(status);
    }

    let userIds = null;
    const searchText = String(search || '').trim();
    if (searchText) {
        const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const users = await User.find({
            $or: [
                { name: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } },
                { phoneNumber: { $regex: escaped, $options: 'i' } },
                { mobile: { $regex: escaped, $options: 'i' } },
            ],
        })
            .select('_id')
            .lean();
        userIds = users.map((u) => u._id);
        if (userIds.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: {
                    registrations: [],
                    pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
                    summary: { total: 0, registered: 0, paymentPending: 0, paymentDone: 0, cancelled: 0 },
                },
            });
        }
        filter.userId = { $in: userIds };
        summaryFilter.userId = { $in: userIds };
    }

    const [total, registrations, statusSummary] = await Promise.all([
        WebinarRegistration.countDocuments(filter),
        WebinarRegistration.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('userId', 'name email phoneNumber mobile membershipLevel role createdAt')
            .populate('webinarId', 'title slug mode price startsAt endsAt isPublished')
            .lean(),
        WebinarRegistration.aggregate([
            ...(Object.keys(summaryFilter).length ? [{ $match: summaryFilter }] : []),
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);

    const summary = {
        total: 0,
        registered: 0,
        paymentPending: 0,
        paymentDone: 0,
        cancelled: 0,
    };
    for (const row of statusSummary) {
        summary.total += row.count;
        if (row._id === 'REGISTERED') summary.registered = row.count;
        if (row._id === 'PAYMENT_PENDING') summary.paymentPending = row.count;
        if (row._id === 'PAYMENT_DONE') summary.paymentDone = row.count;
        if (row._id === 'CANCELLED') summary.cancelled = row.count;
    }

    const rows = registrations.map((reg) => {
        const user = reg.userId && typeof reg.userId === 'object' ? reg.userId : null;
        const webinar = reg.webinarId && typeof reg.webinarId === 'object' ? reg.webinarId : null;
        return {
            _id: reg._id,
            status: reg.status,
            accessGrantedBySubscription: Boolean(reg.accessGrantedBySubscription),
            payment: reg.payment || null,
            notes: reg.notes || '',
            createdAt: reg.createdAt,
            updatedAt: reg.updatedAt,
            user: user
                ? {
                      _id: user._id,
                      name: user.name || '',
                      email: user.email || '',
                      phone: user.phoneNumber || user.mobile || '',
                      membershipLevel: user.membershipLevel || 'FREE',
                      role: user.role || 'user',
                      joinedAt: user.createdAt || null,
                  }
                : null,
            webinar: webinar
                ? {
                      _id: webinar._id,
                      title: webinar.title,
                      slug: webinar.slug,
                      mode: webinar.mode,
                      price: webinar.price,
                      startsAt: webinar.startsAt,
                      endsAt: webinar.endsAt,
                      isPublished: webinar.isPublished,
                  }
                : null,
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            registrations: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum) || 0,
            },
            summary,
        },
    });
});

export const createWebinar = asyncHandler(async (req, res) => {
    const {
        title,
        slug,
        descriptionHtml,
        imageUrl,
        meetingLink,
        mode,
        price,
        audience,
        topics,
        startsAt,
        endsAt,
        joinWindowBeforeMinutes,
        joinWindowAfterMinutes,
        isPublished,
        isArchived,
        sortPriority,
    } = req.body;

    if (!title || !meetingLink || !startsAt || !endsAt) {
        res.status(400);
        throw new Error('title, meetingLink, startsAt, and endsAt are required.');
    }
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        res.status(400);
        throw new Error('Invalid schedule. endsAt must be after startsAt.');
    }
    const normalizedSlug = slugify(slug || title);
    if (!normalizedSlug) {
        res.status(400);
        throw new Error('Could not generate a valid slug.');
    }

    const nextMode = String(mode || 'FREE').toUpperCase();
    const nextPrice = Number(price || 0);
    if (nextMode === 'PAID' && (!Number.isFinite(nextPrice) || nextPrice <= 0)) {
        res.status(400);
        throw new Error('Price is required for paid webinars.');
    }

    const existing = await Webinar.findOne({ slug: normalizedSlug });
    if (existing) {
        res.status(409);
        throw new Error('A webinar with this slug already exists.');
    }

    const webinar = await Webinar.create({
        title: String(title).trim(),
        slug: normalizedSlug,
        descriptionHtml: String(descriptionHtml || ''),
        imageUrl: String(imageUrl || ''),
        meetingLink: String(meetingLink || '').trim(),
        mode: nextMode,
        price: nextMode === 'PAID' ? nextPrice : 0,
        audience: String(audience || 'ALL').toUpperCase(),
        topics: parseTopics(topics),
        startsAt: start,
        endsAt: end,
        joinWindowBeforeMinutes: Number(joinWindowBeforeMinutes ?? 15),
        joinWindowAfterMinutes: Number(joinWindowAfterMinutes ?? 30),
        isPublished: Boolean(isPublished),
        isArchived: Boolean(isArchived),
        sortPriority: Number(sortPriority || 0),
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
    });

    res.status(201).json({ status: 'success', data: { webinar: sanitizeWebinar(webinar) } });
});

export const updateWebinar = asyncHandler(async (req, res) => {
    const { webinarId } = req.params;
    if (!isObjectId(webinarId)) {
        res.status(400);
        throw new Error('Invalid webinar id.');
    }
    const webinar = await Webinar.findById(webinarId).select('+meetingLink');
    if (!webinar) {
        res.status(404);
        throw new Error('Webinar not found.');
    }

    const {
        title,
        slug,
        descriptionHtml,
        imageUrl,
        meetingLink,
        mode,
        price,
        audience,
        topics,
        startsAt,
        endsAt,
        joinWindowBeforeMinutes,
        joinWindowAfterMinutes,
        isPublished,
        isArchived,
        sortPriority,
    } = req.body;

    if (title !== undefined) webinar.title = String(title).trim();
    if (slug !== undefined || title !== undefined) {
        const nextSlug = slugify(slug || webinar.title);
        if (!nextSlug) {
            res.status(400);
            throw new Error('Invalid slug.');
        }
        const taken = await Webinar.findOne({ slug: nextSlug, _id: { $ne: webinar._id } });
        if (taken) {
            res.status(409);
            throw new Error('Another webinar already uses this slug.');
        }
        webinar.slug = nextSlug;
    }
    if (descriptionHtml !== undefined) webinar.descriptionHtml = String(descriptionHtml || '');
    if (imageUrl !== undefined) webinar.imageUrl = String(imageUrl || '');
    if (meetingLink !== undefined) {
        const trimmedLink = String(meetingLink || '').trim();
        if (trimmedLink) {
            webinar.meetingLink = trimmedLink;
        }
    }
    if (audience !== undefined) webinar.audience = String(audience || '').toUpperCase();
    if (topics !== undefined) webinar.topics = parseTopics(topics);
    if (startsAt !== undefined) {
        const start = new Date(startsAt);
        if (Number.isNaN(start.getTime())) {
            res.status(400);
            throw new Error('Invalid start date/time.');
        }
        webinar.startsAt = start;
    }
    if (endsAt !== undefined) {
        const end = new Date(endsAt);
        if (Number.isNaN(end.getTime())) {
            res.status(400);
            throw new Error('Invalid end date/time.');
        }
        webinar.endsAt = end;
    }
    if (joinWindowBeforeMinutes !== undefined) webinar.joinWindowBeforeMinutes = Number(joinWindowBeforeMinutes);
    if (joinWindowAfterMinutes !== undefined) webinar.joinWindowAfterMinutes = Number(joinWindowAfterMinutes);
    if (isPublished !== undefined) webinar.isPublished = Boolean(isPublished);
    if (isArchived !== undefined) webinar.isArchived = Boolean(isArchived);
    if (sortPriority !== undefined) webinar.sortPriority = Number(sortPriority || 0);

    if (mode !== undefined) webinar.mode = String(mode || 'FREE').toUpperCase();
    if (price !== undefined) webinar.price = Number(price || 0);
    if (webinar.mode === 'PAID' && (!Number.isFinite(webinar.price) || webinar.price <= 0)) {
        res.status(400);
        throw new Error('Price is required for paid webinars.');
    }
    if (webinar.mode === 'FREE') {
        webinar.price = 0;
        await WebinarRegistration.updateMany(
            { webinarId: webinar._id, status: 'PAYMENT_PENDING' },
            {
                $set: {
                    status: 'REGISTERED',
                    accessGrantedBySubscription: false,
                    'payment.amount': 0,
                    'payment.currency': 'INR',
                },
            }
        );
    }
    if (new Date(webinar.endsAt) <= new Date(webinar.startsAt)) {
        res.status(400);
        throw new Error('Invalid schedule. endsAt must be after startsAt.');
    }
    webinar.updatedBy = req.user?._id;
    await webinar.save();

    res.status(200).json({ status: 'success', data: { webinar: sanitizeWebinar(webinar) } });
});

export const getWebinarAdminById = asyncHandler(async (req, res) => {
    const { webinarId } = req.params;
    if (!isObjectId(webinarId)) {
        res.status(400);
        throw new Error('Invalid webinar id.');
    }
    const webinar = await Webinar.findById(webinarId).select('+meetingLink');
    if (!webinar) {
        res.status(404);
        throw new Error('Webinar not found.');
    }
    res.status(200).json({ status: 'success', data: { webinar } });
});

export const registerForWebinar = asyncHandler(async (req, res) => {
    const { webinarId } = req.params;
    if (!isObjectId(webinarId)) {
        res.status(400);
        throw new Error('Invalid webinar id.');
    }
    const webinar = await Webinar.findById(webinarId).select('+meetingLink');
    if (!webinar || !webinar.isPublished || webinar.isArchived) {
        res.status(404);
        throw new Error('Webinar not found.');
    }
    if (!canAudienceRegister(webinar, req.user)) {
        const eligibility = getRegistrationEligibility(webinar, req.user);
        res.status(403);
        throw new Error(eligibility.message || 'You are not eligible to register for this webinar.');
    }

    const isPaidSub = hasActivePaidSubscription(req.user);
    const bypassPayment = webinar.mode === 'PAID' && isPaidSub && webinar.audience !== 'FREE_ONLY';
    const requiresPayment = webinar.mode === 'PAID' && !bypassPayment;

    let registration = await WebinarRegistration.findOne({
        webinarId: webinar._id,
        userId: req.user._id,
    });
    if (registration) {
        registration = await reconcileRegistrationForWebinar(webinar, registration);
    }
    if (!registration) {
        registration = await WebinarRegistration.create({
            webinarId: webinar._id,
            userId: req.user._id,
            status: requiresPayment ? 'PAYMENT_PENDING' : 'REGISTERED',
            accessGrantedBySubscription: bypassPayment,
            payment: {
                amount: requiresPayment ? Number(webinar.price || 0) : 0,
                currency: 'INR',
            },
        });
    } else if (!requiresPayment && registration.status !== 'REGISTERED' && registration.status !== 'PAYMENT_DONE') {
        await WebinarRegistration.updateOne(
            { _id: registration._id },
            {
                $set: {
                    status: 'REGISTERED',
                    accessGrantedBySubscription: bypassPayment,
                    payment: {
                        ...(registration.payment || {}),
                        amount: 0,
                        currency: 'INR',
                    },
                },
            }
        );
        registration = await WebinarRegistration.findById(registration._id);
    }

    res.status(200).json({
        status: 'success',
        data: {
            registration,
            requiresPayment,
            paymentAmount: requiresPayment ? Number(webinar.price || 0) : 0,
        },
    });
});

export const createWebinarPaymentOrder = asyncHandler(async (req, res) => {
    const { webinarId } = req.params;
    if (!isObjectId(webinarId)) {
        res.status(400);
        throw new Error('Invalid webinar id.');
    }
    const webinar = await Webinar.findById(webinarId);
    if (!webinar || !webinar.isPublished || webinar.isArchived) {
        res.status(404);
        throw new Error('Webinar not found.');
    }
    if (webinar.mode !== 'PAID') {
        if (!registration) {
            registration = await WebinarRegistration.create({
                webinarId: webinar._id,
                userId: req.user._id,
                status: 'REGISTERED',
                payment: { amount: 0, currency: 'INR' },
            });
        } else if (registration.status !== 'REGISTERED' && registration.status !== 'PAYMENT_DONE') {
            registration.status = 'REGISTERED';
            registration.payment = { ...(registration.payment || {}), amount: 0, currency: 'INR' };
            await registration.save();
        }
        res.status(200).json({
            status: 'success',
            data: { registered: true, order: null },
        });
        return;
    }
    if (!canAudienceRegister(webinar, req.user)) {
        const eligibility = getRegistrationEligibility(webinar, req.user);
        res.status(403);
        throw new Error(eligibility.message || 'You are not eligible for this webinar.');
    }
    if (hasActivePaidSubscription(req.user) && webinar.audience !== 'FREE_ONLY') {
        res.status(200).json({
            status: 'success',
            data: { bypassedBySubscription: true, order: null },
        });
        return;
    }

    const amount = Number(webinar.price || 0);
    if (!Number.isFinite(amount) || amount < 100) {
        res.status(400);
        throw new Error('Minimum payable amount is ₹1.');
    }

    const razorpayConfig = getRazorpayConfig();
    const instance = new Razorpay({
        key_id: razorpayConfig.key_id,
        key_secret: razorpayConfig.key_secret,
    });
    const order = await instance.orders.create({
        amount,
        currency: 'INR',
        receipt: `webinar_${String(webinar._id).slice(-8)}_${Date.now()}`,
        notes: {
            webinarId: String(webinar._id),
            userId: String(req.user._id),
            kind: 'webinar',
        },
    });

    let registration = await WebinarRegistration.findOne({
        webinarId: webinar._id,
        userId: req.user._id,
    });
    if (!registration) {
        registration = await WebinarRegistration.create({
            webinarId: webinar._id,
            userId: req.user._id,
            status: 'PAYMENT_PENDING',
            payment: { amount, currency: 'INR', orderId: order.id },
        });
    } else {
        registration.status = 'PAYMENT_PENDING';
        registration.payment = {
            ...(registration.payment || {}),
            amount,
            currency: 'INR',
            orderId: order.id,
        };
        await registration.save();
    }

    res.status(200).json({ status: 'success', data: { order } });
});

export const verifyWebinarPayment = asyncHandler(async (req, res) => {
    const { webinarId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!isObjectId(webinarId)) {
        res.status(400);
        throw new Error('Invalid webinar id.');
    }
    const webinar = await Webinar.findById(webinarId);
    if (!webinar || webinar.mode !== 'PAID') {
        res.status(404);
        throw new Error('Paid webinar not found.');
    }

    const razorpayConfig = getRazorpayConfig();
    const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    if (expectedSignature !== razorpay_signature) {
        res.status(400);
        throw new Error('Invalid payment signature.');
    }

    let registration = await WebinarRegistration.findOne({
        webinarId: webinar._id,
        userId: req.user._id,
    });
    if (!registration) {
        registration = await WebinarRegistration.create({
            webinarId: webinar._id,
            userId: req.user._id,
            status: 'PAYMENT_DONE',
            payment: {
                amount: Number(webinar.price || 0),
                currency: 'INR',
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                paidAt: new Date(),
            },
        });
    } else {
        registration.status = 'PAYMENT_DONE';
        registration.payment = {
            ...(registration.payment || {}),
            amount: Number(webinar.price || 0),
            currency: 'INR',
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
            paidAt: new Date(),
        };
        await registration.save();
    }

    res.status(200).json({ status: 'success', data: { registration } });
});

export const getWebinarJoinAccess = asyncHandler(async (req, res) => {
    const { webinarId } = req.params;
    if (!isObjectId(webinarId)) {
        res.status(400);
        throw new Error('Invalid webinar id.');
    }
    const webinar = await Webinar.findById(webinarId);
    if (!webinar || !webinar.isPublished || webinar.isArchived) {
        res.status(404);
        throw new Error('Webinar not found.');
    }

    let registration = await WebinarRegistration.findOne({
        webinarId: webinar._id,
        userId: req.user._id,
    });
    if (registration) {
        registration = await reconcileRegistrationForWebinar(webinar, registration);
    }
    if (!registration) {
        res.status(403);
        throw new Error('Please register before joining this webinar.');
    }

    const paidOk =
        webinar.mode === 'FREE' ||
        registration.status === 'PAYMENT_DONE' ||
        registration.accessGrantedBySubscription ||
        registration.status === 'REGISTERED';
    if (!paidOk) {
        res.status(403);
        throw new Error('Payment is pending for this webinar.');
    }

    const joinWindow = computeJoinWindow(webinar);
    const allowedByWindow = canJoinNow(webinar);
    res.status(200).json({
        status: 'success',
        data: {
            canJoin: allowedByWindow,
            joinAvailableAt: joinWindow.openAt,
            joinClosesAt: joinWindow.closeAt,
        },
    });
});

export const getWebinarJoinMeetingUrl = asyncHandler(async (req, res) => {
    const { webinar, registration } = await loadWebinarJoinContext(req.params.webinarId, req.user._id);
    res.status(200).json({
        status: 'success',
        data: {
            meetingUrl: webinar.meetingLink,
            joinedAt: new Date().toISOString(),
            registrationStatus: registration.status,
        },
    });
});

export const webinarJoinRedirect = asyncHandler(async (req, res) => {
    const { webinar } = await loadWebinarJoinContext(req.params.webinarId, req.user._id);
    return res.redirect(webinar.meetingLink);
});

