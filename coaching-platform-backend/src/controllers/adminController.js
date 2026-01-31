import User from '../models/User.js';
import Video from '../models/Video.js';
import Course from '../models/Course.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import VideoWatchProgress from '../models/VideoWatchProgress.js';
import Notification from '../models/Notification.js';
import BlogPost from '../models/BlogPost.js';
import KnowledgeBaseArticle from '../models/KnowledgeBaseArticle.js';
import mongoose from 'mongoose';
import { isValid, formatISO, parseISO } from 'date-fns';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import redisClient from '../config/redisClient.js';

const SESSION_PREFIX = 'session:user:'; 

/** * @desc    Calculate end date based on start date and plan duration
 * @param   { Date } startDate - The start date of the subscription
 * @param   { Object } duration - The duration object containing unit and value
 * @return  { Date } - The calculated end date
 * @throws  { Error } - Throws an error if duration is invalid or unit is not recognized
 * @note    If duration is missing or invalid, defaults to 1 year from start date
 * */
const calculateEndDate = (startDate, duration) => {
    const date = new Date(startDate);
    if (!duration || !duration.unit || typeof duration.value !== 'number') {
        console.warn("[AdminController] Plan duration missing or invalid in calculateEndDate, defaulting to 1 year for safety.");
        date.setFullYear(date.getFullYear() + 1); 
        return date;
    }
    switch (duration.unit) {
        case 'day': date.setDate(date.getDate() + duration.value); break;
        case 'week': date.setDate(date.getDate() + duration.value * 7); break;
        case 'month': date.setMonth(date.getMonth() + duration.value); break;
        case 'year': date.setFullYear(date.getFullYear() + duration.value); break;
        default: 
            console.error("Invalid duration unit provided to calculateEndDate:", duration.unit);
            date.setFullYear(date.getFullYear() + 1); 
            break; 
    }
    return date;
};

/** * @desc    Get all users for admin
 * @route   GET /api/admin/users
 * @access  Private/Admin
 **/
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({})
            .select('-password -activeSessions')
            .populate({
                path: 'subscriptions.planId',
                model: 'SubscriptionPlan',
                select: 'name' 
            })
            .sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: users.length, data: { users } });
    } catch (error) {
        console.error("ADMIN GET ALL USERS ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch users.' });
    }
};

/** * @desc    Get a specific user by ID for admin
 * @route   GET /api/admin/users/:userId
 * @access  Private/Admin
 **/
export const getUserByIdForAdmin = async (req, res, next) => {
    const { userId } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid user ID format.' });
        }
        const user = await User.findById(userId)
            .select('-password -activeSessions')
            .populate({
                path: 'subscriptions.planId',
                model: 'SubscriptionPlan',
                select: 'name description price currency duration isActive features'
            });
        if (!user) return res.status(404).json({ status: 'fail', message: 'User not found.' });
        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        console.error(`ADMIN GET USER BY ID (${userId}) ERROR:`, error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch user details.' });
    }
};

/** * @desc    Admin updates a user's role (user/admin)
 * @route   PATCH /api/admin/users/:userId/role
 * @access  Private/Admin   
 * This endpoint allows an admin to change a user's role.
 **/
export const updateUserRoleByAdmin = async (req, res, next) => {
     try {
        const { userId } = req.params;
        const { role: newRole } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid user ID.' });
        }
        const allowedRoles = ['user', 'admin'];
        if (!newRole || !allowedRoles.includes(newRole)) {
            return res.status(400).json({ status: 'fail', message: `Invalid role. Allowed: ${allowedRoles.join(', ')}.`});
        }
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) return res.status(404).json({ status: 'fail', message: 'User not found.' });
        if (req.user && req.user._id.toString() === userToUpdate._id.toString()) {
            return res.status(400).json({ status: 'fail', message: 'Admins cannot change their own role here.'});
        }
        userToUpdate.role = newRole;
        await userToUpdate.save({ validateBeforeSave: true });
        const updatedUser = await User.findById(userId).select('-password -activeSessions').populate({ path: 'subscriptions.planId', model: 'SubscriptionPlan', select: 'name' });
        res.status(200).json({ status: 'success', message: `User role updated to '${newRole}'.`, data: { user: updatedUser } });
    } catch (error) {
        console.error("ADMIN UPDATE USER ROLE ERROR:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update user role.' });
    }
};

/**
 * @desc    Admin creates a new user
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
export const createUserByAdmin = async (req, res, next) => {
    try {
        const { name, email, phoneNumber, password, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'Name, email, and password are required.' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'Password must be at least 6 characters long.' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'A user with this email already exists.' 
            });
        }

        // Check if phone number is provided and unique
        if (phoneNumber) {
            const existingPhoneUser = await User.findOne({ phoneNumber: phoneNumber.trim() });
            if (existingPhoneUser) {
                return res.status(400).json({ 
                    status: 'fail', 
                    message: 'A user with this phone number already exists.' 
                });
            }
        }

        // Validate role
        const allowedRoles = ['user', 'admin'];
        const userRole = role && allowedRoles.includes(role) ? role : 'user';

        // Generate OTP for email verification
        const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOTP = crypto.createHash('sha256').update(verificationOTP).digest('hex');
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        // Create new user (unverified - user must verify email on first login)
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
            password: password, // Will be hashed by pre-save hook
            role: userRole,
            authProvider: 'local',
            isEmailVerified: false, // User must verify email on first login
            emailVerificationToken: hashedOTP,
            emailVerificationExpires: otpExpires,
        });

        await newUser.save();

        // Note: OTP will be sent when user attempts first login, not during user creation

        // Fetch the created user without password
        const createdUser = await User.findById(newUser._id)
            .select('-password -activeSessions')
            .populate({
                path: 'subscriptions.planId',
                model: 'SubscriptionPlan',
                select: 'name description price currency duration isActive features'
            });

        res.status(201).json({
            status: 'success',
            message: 'User created successfully.',
            data: { user: createdUser }
        });

    } catch (error) {
        console.error("ADMIN CREATE USER ERROR:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                status: 'fail', 
                message: `A user with this ${field} already exists.` 
            });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create user.' });
    }
};

/**
 * @desc    Admin updates a user's password
 * @route   PATCH /api/admin/users/:userId/password
 * @access  Private/Admin
 */
export const updateUserPasswordByAdmin = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { password } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid user ID format.' });
        }

        if (!password) {
            return res.status(400).json({ status: 'fail', message: 'Password is required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'Password must be at least 6 characters long.' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        // Check if user has local auth (has password field)
        if (user.authProvider !== 'local') {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'Cannot update password for users who signed up with Google OAuth.' 
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = password;
        await user.save({ validateBeforeSave: true });

        res.status(200).json({
            status: 'success',
            message: 'User password updated successfully.'
        });

    } catch (error) {
        console.error("ADMIN UPDATE USER PASSWORD ERROR:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update user password.' });
    }
};

/**
 * @desc    Admin updates a user's basic information (name, phoneNumber)
 * @route   PATCH /api/admin/users/:userId
 * @access  Private/Admin
 */
export const updateUserInfoByAdmin = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { name, phoneNumber } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid user ID format.' });
        }

        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        // Update fields if provided
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({ status: 'fail', message: 'Name must be a non-empty string.' });
            }
            userToUpdate.name = name.trim();
        }

        if (phoneNumber !== undefined) {
            // Allow empty string to clear phone number, or a valid phone number string
            if (phoneNumber !== null && phoneNumber !== '' && typeof phoneNumber !== 'string') {
                return res.status(400).json({ status: 'fail', message: 'Phone number must be a string or null.' });
            }
            userToUpdate.phoneNumber = phoneNumber === '' ? undefined : phoneNumber?.trim() || undefined;
        }

        // Validate that at least one field is being updated
        if (name === undefined && phoneNumber === undefined) {
            return res.status(400).json({ status: 'fail', message: 'At least one field (name or phoneNumber) must be provided for update.' });
        }

        await userToUpdate.save({ validateBeforeSave: true });

        const updatedUser = await User.findById(userId)
            .select('-password -activeSessions')
            .populate({
                path: 'subscriptions.planId',
                model: 'SubscriptionPlan',
                select: 'name description price currency duration isActive features'
            });

        res.status(200).json({
            status: 'success',
            message: 'User information updated successfully.',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error("ADMIN UPDATE USER INFO ERROR:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update user information.' });
    }
};


/**
 * @desc    Admin ADDS a new subscription instance to a user.
 * @route   POST /api/admin/users/:userId/subscriptions
 * @access  Private/Admin
 */
export const adminAddUserSubscription = async (req, res, next) => {
    const { userId } = req.params;
    const { planId, status, startDate: customStartDateStr, endDate: customEndDateStr } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid user ID format.' });
        }
        if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ status: 'fail', message: 'Valid planId is required to add a subscription.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({ status: 'fail', message: 'Subscription plan not found.' });
        }
        const startDate = customStartDateStr && isValid(parseISO(customStartDateStr)) ? parseISO(customStartDateStr) : new Date();
        let endDate;

        if (customEndDateStr && isValid(parseISO(customEndDateStr))) {
            endDate = parseISO(customEndDateStr);
        } else if (plan.duration) {
            endDate = calculateEndDate(startDate, plan.duration);
        } else {
            console.error(`Plan ${plan.name} (${plan._id}) has no duration. Cannot calculate end date.`);
            return res.status(400).json({ status: 'fail', message: `Plan '${plan.name}' has no duration configured.`});
        }
        
        if (endDate <= startDate) {
            return res.status(400).json({ status: 'fail', message: 'End date must be after start date.' });
        }
        
        const newSubscriptionInstance = {
            planId: plan._id,
            planName: plan.name, 
            status: status || 'active',
            startDate,
            endDate,
        };

        user.subscriptions.push(newSubscriptionInstance);
        await user.save();

        // Update unlocked levels based on subscription type
        try {
            const { updateUnlockedLevelsFromSubscriptions } = await import('../services/subscriptionAccessService.js');
            await updateUnlockedLevelsFromSubscriptions(userId);
        } catch (error) {
            console.error('[AdminController] Error updating unlocked levels:', error);
            // Don't fail the subscription if level update fails
        }

        const updatedUser = await User.findById(userId)
            .select('-password -activeSessions')
            .populate({
                path: 'subscriptions.planId',
                model: 'SubscriptionPlan',
                select: 'name price currency duration isActive features'
            });

        res.status(200).json({
            status: 'success',
            message: `Subscription to '${plan.name}' added for user successfully.`,
            data: { user: updatedUser },
        });

    } catch (error) {
        console.error("ADMIN ADD USER SUBSCRIPTION ERROR:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to add user subscription.' });
    }
};

/**
 * @desc    Admin removes a specific subscription instance from a user
 * @route   DELETE /api/admin/users/:userId/subscriptions/:subscriptionInstanceId
 * @access  Private/Admin
 */
export const adminRemoveUserSubscriptionInstance = async (req, res, next) => {
    const { userId, subscriptionInstanceId } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(subscriptionInstanceId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid User ID or Subscription Instance ID format.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        const initialSubscriptionCount = user.subscriptions.length;
        user.subscriptions.pull({ _id: new mongoose.Types.ObjectId(subscriptionInstanceId) }); 

        if (user.subscriptions.length === initialSubscriptionCount) {
            return res.status(404).json({ status: 'fail', message: 'Subscription instance not found on this user.' });
        }

        await user.save();

        const updatedUser = await User.findById(userId)
            .select('-password -activeSessions')
            .populate({
                path: 'subscriptions.planId',
                model: 'SubscriptionPlan',
                select: 'name price currency duration isActive features'
            });

        res.status(200).json({
            status: 'success',
            message: 'Subscription instance removed successfully.',
            data: { user: updatedUser },
        });

    } catch (error) {
        console.error("ADMIN REMOVE USER SUBSCRIPTION INSTANCE ERROR:", error);
        res.status(500).json({ status: 'error', message: 'Failed to remove user subscription instance.' });
    }
};

/**
 * @desc    Delete a user and all related data
 * @route   DELETE /api/admin/users/:userId
 * @access  Private/Admin
 */
export const deleteUserByAdmin = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid user ID format.' });
        }

        // Prevent admin from deleting themselves
        if (req.user && req.user._id && req.user._id.toString() === userId) {
            return res.status(400).json({ 
                status: 'fail', 
                message: 'You cannot delete your own account.' 
            });
        }

        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        // Start transaction for atomic operations
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Delete all VideoWatchProgress records for this user
            await VideoWatchProgress.deleteMany({ user: userId }).session(session);
            console.log(`[Delete User] Deleted VideoWatchProgress records for user ${userId}`);

            // 2. Delete all Notification records for this user
            await Notification.deleteMany({ user: userId }).session(session);
            console.log(`[Delete User] Deleted Notification records for user ${userId}`);

            // 3. Update BlogPost records - set author to null (or delete if preferred)
            // We'll set to null to preserve blog posts but remove author reference
            const blogPostsUpdated = await BlogPost.updateMany(
                { author: userId },
                { $set: { author: null } }
            ).session(session);
            console.log(`[Delete User] Updated ${blogPostsUpdated.modifiedCount} BlogPost records for user ${userId}`);

            // 4. Update Video records - set uploader to null (preserve videos)
            const videosUpdated = await Video.updateMany(
                { uploader: userId },
                { $set: { uploader: null } }
            ).session(session);
            console.log(`[Delete User] Updated ${videosUpdated.modifiedCount} Video records for user ${userId}`);

            // 5. Update KnowledgeBaseArticle records - set author to null
            const articlesUpdated = await KnowledgeBaseArticle.updateMany(
                { author: userId },
                { $set: { author: null } }
            ).session(session);
            console.log(`[Delete User] Updated ${articlesUpdated.modifiedCount} KnowledgeBaseArticle records for user ${userId}`);

            // 6. Clear Redis sessions for this user
            if (redisClient.isOpen) {
                const redisKey = `${SESSION_PREFIX}${userId}`;
                await redisClient.del(redisKey);
                console.log(`[Delete User] Cleared Redis session for user ${userId}`);
            } else {
                console.warn(`[Delete User] Redis client not open, could not clear session for user ${userId}`);
            }

            // 7. Finally, delete the User document
            await User.findByIdAndDelete(userId).session(session);
            console.log(`[Delete User] Deleted User document ${userId}`);

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            res.status(200).json({
                status: 'success',
                message: 'User and all related data deleted successfully.',
                data: {
                    deletedUser: {
                        _id: userId,
                        email: userToDelete.email,
                        name: userToDelete.name
                    },
                    deletedRecords: {
                        videoWatchProgress: 'deleted',
                        notifications: 'deleted',
                        blogPosts: blogPostsUpdated.modifiedCount,
                        videos: videosUpdated.modifiedCount,
                        knowledgeBaseArticles: articlesUpdated.modifiedCount
                    }
                }
            });

        } catch (error) {
            // Rollback transaction on error
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        console.error("ADMIN DELETE USER ERROR:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ status: 'fail', message: messages.join('. ') });
        }
        res.status(500).json({ status: 'error', message: 'Failed to delete user.' });
    }
};

/**
 * @desc    Get platform statistics for Admin Dashboard
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getPlatformStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalVideos = await Video.countDocuments();
        const publishedVideos = await Video.countDocuments({ isPublished: true });
        const totalCourses = await Course.countDocuments();
        const publishedCourses = await Course.countDocuments({ isPublished: true });

        const usersWithSubscriptions = await User.find({ "subscriptions.0": { "$exists": true } })
            .select('subscriptions')
            .lean();
        
        let activeUserSubscriptions = 0;
        const now = new Date();
        if (usersWithSubscriptions) {
            usersWithSubscriptions.forEach(user => {
                if (user.subscriptions && Array.isArray(user.subscriptions)) {
                    const hasActiveSub = user.subscriptions.some(sub => 
                        sub.status === 'active' &&
                        sub.startDate && new Date(sub.startDate) <= now &&
                        sub.endDate && new Date(sub.endDate) >= now
                    );
                    if (hasActiveSub) {
                        activeUserSubscriptions++;
                    }
                }
            });
        }
        
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
                }
            }
        });

    } catch (error) {
        console.error("ADMIN GET PLATFORM STATS ERROR:", error.stack);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch platform statistics.'
        });
    }
};