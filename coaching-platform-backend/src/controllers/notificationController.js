import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

const normalizeCategoryKey = (value) => {
    if (!value) return null;
    const normalized = value.toString().trim().toLowerCase();
    return normalized === '' || normalized === 'all' ? null : normalized;
};

const formatCategoryLabel = (value) => {
    if (!value) return 'General';
    return value
        .toString()
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
    const categoryKey = normalizeCategoryKey(req.query.category);
    const filter = { user: req.user._id };
    if (categoryKey) {
        filter.categoryKey = categoryKey;
    }

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(50);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
    const filteredUnreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    const categoryStatsRaw = await Notification.aggregate([
        { $match: { user: req.user._id } },
        {
            $group: {
                _id: '$categoryKey',
                label: { $first: '$categoryLabel' },
                total: { $sum: 1 },
                unread: {
                    $sum: {
                        $cond: [{ $eq: ['$isRead', false] }, 1, 0],
                    },
                },
            },
        },
        { $sort: { total: -1 } },
    ]);

    const categoryStats = categoryStatsRaw.map((stat) => ({
        key: stat._id || 'general',
        label: stat.label || formatCategoryLabel(stat._id || 'general'),
        total: stat.total,
        unread: stat.unread,
    }));

    res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: {
            notifications,
            unreadCount,
            filteredUnreadCount,
            categories: categoryStats,
        },
    });
});

/**
 * @desc    Mark a single notification as read
 * @route   POST /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id }, 
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found.');
    }

    res.status(200).json({ status: 'success', data: { notification } });
});

/**
 * @desc    Mark all notifications as read for the logged-in user
 * @route   POST /api/notifications/mark-all-read
 * @access  Private
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const categoryKey = normalizeCategoryKey(req.query.category);
    const filter = { user: req.user._id, isRead: false };
    if (categoryKey) {
        filter.categoryKey = categoryKey;
    }

    const result = await Notification.updateMany(filter, { isRead: true });

    res.status(200).json({
        status: 'success',
        message: categoryKey
            ? `Marked ${result.modifiedCount} ${categoryKey.toUpperCase()} notification(s) as read.`
            : 'All notifications marked as read.',
        data: {
            updatedCount: result.modifiedCount,
        },
    });
});

/**
 * @desc    Delete a single notification by ID
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found.');
    }

    res.status(200).json({
        status: 'success',
        message: 'Notification deleted successfully.',
        data: null
    });
});

/**
 * @desc    Delete all notifications for the logged-in user
 * @route   DELETE /api/notifications
 * @access  Private
 */
export const deleteAllNotifications = asyncHandler(async (req, res) => {
    const categoryKey = normalizeCategoryKey(req.query.category);
    const filter = { user: req.user._id };
    if (categoryKey) {
        filter.categoryKey = categoryKey;
    }

    const result = await Notification.deleteMany(filter);

    res.status(200).json({
        status: 'success',
        message: categoryKey
            ? `Deleted ${result.deletedCount} ${categoryKey.toUpperCase()} notification(s).`
            : `Successfully deleted ${result.deletedCount} notification(s).`,
        data: {
            deletedCount: result.deletedCount
        }
    });
});