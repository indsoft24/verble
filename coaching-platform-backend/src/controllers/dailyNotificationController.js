// src/controllers/dailyNotificationController.js
import asyncHandler from 'express-async-handler';
import { triggerDailyNotifications } from '../utils/dailyNotificationScheduler.js';
import { sendDailyPuzzleTaskNotifications, sendDailyChallengeReminders } from '../services/dailyNotificationService.js';

/**
 * @desc    Manually trigger all daily notifications (Admin only)
 * @route   POST /api/admin/notifications/trigger-daily
 * @access  Private/Admin
 */
export const triggerDailyNotificationsAdmin = asyncHandler(async (req, res) => {
    try {
        const result = await triggerDailyNotifications();
        res.status(200).json({
            status: 'success',
            message: 'Daily notifications triggered successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to trigger daily notifications'
        });
    }
});

/**
 * @desc    Manually trigger puzzle/task notifications (Admin only)
 * @route   POST /api/admin/notifications/trigger-puzzle-tasks
 * @access  Private/Admin
 */
export const triggerPuzzleTaskNotificationsAdmin = asyncHandler(async (req, res) => {
    try {
        const result = await sendDailyPuzzleTaskNotifications();
        res.status(200).json({
            status: 'success',
            message: 'Puzzle/task notifications triggered successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to trigger puzzle/task notifications'
        });
    }
});

/**
 * @desc    Manually trigger challenge reminders (Admin only)
 * @route   POST /api/admin/notifications/trigger-reminders
 * @access  Private/Admin
 */
export const triggerChallengeRemindersAdmin = asyncHandler(async (req, res) => {
    try {
        const result = await sendDailyChallengeReminders();
        res.status(200).json({
            status: 'success',
            message: 'Challenge reminders triggered successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to trigger challenge reminders'
        });
    }
});
