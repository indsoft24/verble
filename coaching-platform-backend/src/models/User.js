import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { formatMobileNumber } from '../utils/smsService.js';

const subscriptionInstanceSchema = new mongoose.Schema(
    {
        planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
        planName: { type: String, required: true },
        status: {
            type: String,
            enum: ['none', 'active', 'pending_cancellation', 'cancelled', 'expired', 'trial', 'future_active'],
            default: 'active',
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        stripeSubscriptionId: String,
        paymentDetails: {
            gateway: String,
            razorpay_order_id: String,
            razorpay_payment_id: String,
            razorpay_signature: String,
        },
    },
    { _id: true }
);

const streakSchema = new mongoose.Schema(
    {
        current: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        lastActive: { type: Date, default: null },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: function () {
                return this.authProvider === 'local' && !this.loginPin;
            },
            minlength: [6, 'Password must be at least 6 characters long'],
            select: false,
        },
        loginPin: { type: String, select: false },
        loginPinIssuedAt: { type: Date },
        termsAcceptedAt: { type: Date },
        phoneNumber: { type: String, trim: true },
        mobile: { type: String, trim: true },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        authProvider: {
            type: String,
            enum: ['local', 'google', 'phone_pin'],
            default: 'phone_pin',
        },
        isEmailVerified: { type: Boolean, default: false },
        emailVerificationToken: { type: String, select: false },
        emailVerificationExpires: { type: Date, select: false },
        isMobileVerified: { type: Boolean, default: false },
        mobileOtpToken: { type: String, select: false },
        mobileOtpExpires: { type: Date, select: false },
        lastMobileOtpSentAt: { type: Date },
        googleId: { type: String, sparse: true },
        googleProfile: { type: mongoose.Schema.Types.Mixed },
        stripeCustomerId: String,
        points: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        membershipLevel: {
            type: String,
            enum: ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE'],
            default: 'FREE',
        },
        unlockedLevels: { type: [String], default: ['FREE'] },
        streaks: {
            free: { type: streakSchema, default: () => ({}) },
            bronze: { type: streakSchema, default: () => ({}) },
            silver: { type: streakSchema, default: () => ({}) },
        },
        dailyProgress: { type: [mongoose.Schema.Types.Mixed], default: [] },
        subscriptions: { type: [subscriptionInstanceSchema], default: [] },
        activeSessions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password') && !this.isModified('loginPin')) return next();
    try {
        if (this.isModified('password') && this.password) {
            this.password = await bcrypt.hash(this.password, 12);
        }
        if (this.isModified('loginPin') && this.loginPin) {
            const pin = String(this.loginPin);
            if (!/^\$2[aby]\$/.test(pin)) {
                this.loginPin = await bcrypt.hash(pin, 12);
                this.loginPinIssuedAt = new Date();
            }
        }
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.compareLoginPin = async function (candidatePin) {
    if (!this.loginPin) return false;
    return bcrypt.compare(String(candidatePin), this.loginPin);
};

userSchema.methods.normalizePhoneFields = function () {
    const raw = this.phoneNumber || this.mobile;
    if (!raw) return;
    const formatted = formatMobileNumber(raw, process.env.DEFAULT_COUNTRY_CODE || '+91');
    if (formatted) {
        this.phoneNumber = formatted;
        this.mobile = formatted;
    }
};

const User = mongoose.model('User', userSchema);
export default User;
