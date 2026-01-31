// src/utils/dailyNotificationScheduler.js
import cron from 'node-cron';
import { sendAllDailyNotifications } from '../services/dailyNotificationService.js';

/**
 * Schedule daily notifications
 * Runs every day at 9:00 AM (configurable via environment variable)
 * Format: minute hour day month dayOfWeek
 * '0 9 * * *' = Every day at 9:00 AM
 */
export const startDailyNotificationScheduler = () => {
    // Get schedule from environment variable or default to 9:00 AM
    const schedule = process.env.DAILY_NOTIFICATION_SCHEDULE || '0 9 * * *';
    
    console.log(`[NotificationScheduler] Setting up daily notification scheduler with schedule: ${schedule}`);
    
    // Schedule the job
    const job = cron.schedule(schedule, async () => {
        console.log(`[NotificationScheduler] Running scheduled daily notifications at ${new Date().toISOString()}`);
        try {
            await sendAllDailyNotifications();
        } catch (error) {
            console.error('[NotificationScheduler] Error in scheduled daily notifications:', error);
        }
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'Asia/Kolkata' // Default to IST, can be configured
    });

    console.log('[NotificationScheduler] Daily notification scheduler started successfully.');
    
    return job;
};

/**
 * Manually trigger daily notifications (for testing or manual execution)
 */
export const triggerDailyNotifications = async () => {
    console.log('[NotificationScheduler] Manually triggering daily notifications...');
    try {
        const result = await sendAllDailyNotifications();
        console.log('[NotificationScheduler] Manual trigger completed:', result);
        return result;
    } catch (error) {
        console.error('[NotificationScheduler] Error in manual trigger:', error);
        throw error;
    }
};
