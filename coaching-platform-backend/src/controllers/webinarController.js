import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Webinar from '../models/Webinar.js';
import WebinarRegistration from '../models/WebinarRegistration.js';
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

const isFreeTierUser = (user) => {
    if (!user) return false;
    return String(user.membershipLevel || 'FREE').toUpperCase() === 'FREE';
};

const canAudienceRegister = (webinar, user) => {
    if (webinar.audience === 'ALL') return true;
    if (webinar.audience === 'FREE_ONLY') return isFreeTierUser(user);
    if (webinar.audience === 'PAID_SUBSCRIBERS') return hasActivePaidSubscription(user);
    return false;
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

const sanitizeWebinar = (webinarDoc, registration = null) => {
    const webinar = webinarDoc.toObject ? webinarDoc.toObject() : webinarDoc;
    const joinWindow = computeJoinWindow(webinar);
    return {
        ...webinar,
        canJoinNow: joinWindow.now >= joinWindow.openAt && joinWindow.now <= joinWindow.closeAt,
        joinWindowOpenAt: joinWindow.openAt,
        joinWindowCloseAt: joinWindow.closeAt,
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
    }

    res.status(200).json({
        status: 'success',
        data: { webinar: sanitizeWebinar(webinar, registration) },
    });
});

export const listWebinarsForAdmin = asyncHandler(async (req, res) => {
    const webinars = await Webinar.find({})
        .sort({ startsAt: -1, createdAt: -1 })
        .lean();
    res.status(200).json({ status: 'success', data: { webinars } });
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
    if (meetingLink !== undefined) webinar.meetingLink = String(meetingLink || '').trim();
    if (audience !== undefined) webinar.audience = String(audience || '').toUpperCase();
    if (topics !== undefined) webinar.topics = parseTopics(topics);
    if (startsAt !== undefined) webinar.startsAt = new Date(startsAt);
    if (endsAt !== undefined) webinar.endsAt = new Date(endsAt);
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
    if (webinar.mode === 'FREE') webinar.price = 0;
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
        res.status(403);
        throw new Error('You are not eligible to register for this webinar.');
    }

    const isPaidSub = hasActivePaidSubscription(req.user);
    const bypassPayment = webinar.mode === 'PAID' && isPaidSub && webinar.audience !== 'FREE_ONLY';
    const requiresPayment = webinar.mode === 'PAID' && !bypassPayment;

    let registration = await WebinarRegistration.findOne({
        webinarId: webinar._id,
        userId: req.user._id,
    });
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
    } else if (!requiresPayment && registration.status !== 'REGISTERED') {
        registration.status = 'REGISTERED';
        registration.accessGrantedBySubscription = bypassPayment;
        registration.payment = {
            ...(registration.payment || {}),
            amount: bypassPayment ? 0 : Number(webinar.price || 0),
        };
        await registration.save();
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
        res.status(400);
        throw new Error('This webinar does not require payment.');
    }
    if (!canAudienceRegister(webinar, req.user)) {
        res.status(403);
        throw new Error('You are not eligible for this webinar.');
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
    const webinar = await Webinar.findById(webinarId).select('+meetingLink');
    if (!webinar || !webinar.isPublished || webinar.isArchived) {
        res.status(404);
        throw new Error('Webinar not found.');
    }

    const registration = await WebinarRegistration.findOne({
        webinarId: webinar._id,
        userId: req.user._id,
    });
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

    const allowedByWindow = canJoinNow(webinar);
    res.status(200).json({
        status: 'success',
        data: {
            canJoin: allowedByWindow,
            joinAvailableAt: computeJoinWindow(webinar).openAt,
            joinClosesAt: computeJoinWindow(webinar).closeAt,
            joinRedirectUrl: allowedByWindow ? `/api/webinars/${webinar._id}/join-redirect` : null,
        },
    });
});

export const webinarJoinRedirect = asyncHandler(async (req, res) => {
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
    const registration = await WebinarRegistration.findOne({
        webinarId: webinar._id,
        userId: req.user._id,
    });
    if (!registration) {
        res.status(403);
        throw new Error('Please register before joining this webinar.');
    }
    const allowedByWindow = canJoinNow(webinar);
    if (!allowedByWindow) {
        res.status(403);
        throw new Error('Join is available only in the live access window.');
    }

    return res.redirect(webinar.meetingLink);
});

