// src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSubscriptionInstanceSchema = new mongoose.Schema({
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true,
    },
    planName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'pending_cancellation', 'cancelled', 'expired', 'trial', 'future_active'],
        required: true,
        default: 'active',
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    paymentDetails: {
        gateway: { type: String, default: 'razorpay' },
        razorpay_payment_id: { type: String, trim: true },
        razorpay_order_id: { type: String, trim: true },
        razorpay_signature: { type: String, trim: true },
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
}, { _id: true });

const activeSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    deviceId: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    lastLogin: { type: Date, default: Date.now },
}, { _id: false });

const streakSchema = new mongoose.Schema({
    current: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    lastActive: { type: Date }
}, { _id: false });

const dailyProgressSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    activitiesCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DailyContent' }],
    score: { type: Number, default: 0 }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address',
        ],
    },
    phoneNumber: {
        type: String,
        trim: true,
        sparse: true,
        unique: true,
    },
    password: {
        type: String,
        required: function () { return this.authProvider === 'local'; },
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    lastOtpSentAt: Date, // Track when OTP was last sent for cooldown
    passwordResetToken: String,
    passwordResetExpires: Date,
    googleId: {
        type: String,
        sparse: true,
        unique: true,
    },
    googleProfile: {
        id: String,
        email: String,
        name: String,
        picture: String,
        verified_email: Boolean,
        locale: String
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    mobile: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        index: true,
    },
    isMobileVerified: {
        type: Boolean,
        default: false,
    },
    mobileOtpToken: String,
    mobileOtpExpires: Date,
    lastMobileOtpSentAt: Date, // Track when mobile OTP was last sent for cooldown
    points: {
        type: Number,
        default: 0,
    },
    coins: {
        type: Number,
        default: 0,
    },
    membershipLevel: {
        type: String,
        enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE'],
        default: 'FREE',
    },
    unlockedLevels: {
        type: [String],
        default: ['FREE'],
    },
    streaks: {
        free: { type: streakSchema, default: () => ({ current: 0, max: 0, lastActive: null }) },
        bronze: { type: streakSchema, default: () => ({ current: 0, max: 0, lastActive: null }) },
        silver: { type: streakSchema, default: () => ({ current: 0, max: 0, lastActive: null }) },
    },
    dailyProgress: [dailyProgressSchema],
    subscriptions: [userSubscriptionInstanceSchema],
    activeSessions: [activeSessionSchema],
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;