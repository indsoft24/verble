// src/utils/subscriptionExpirationScheduler.js
import cron from 'node-cron';
import { processAllUserSubscriptionExpirations } from '../services/subscriptionAccessService.js';

/**
 * Schedule daily subscription expiration check
 * Runs every day at 2:00 AM (configurable via environment variable)
 * Format: minute hour day month dayOfWeek
 * '0 2 * * *' = Every day at 2:00 AM
 */
export const startSubscriptionExpirationScheduler = () => {
    // Get schedule from environment variable or default to 2:00 AM
    const schedule = process.env.SUBSCRIPTION_EXPIRATION_SCHEDULE || '0 2 * * *';
    
    console.log(`[SubscriptionExpirationScheduler] Setting up subscription expiration scheduler with schedule: ${schedule}`);
    
    // Schedule the job
    const job = cron.schedule(schedule, async () => {
        console.log(`[SubscriptionExpirationScheduler] Running subscription expiration check at ${new Date().toISOString()}`);
        try {
            await processAllUserSubscriptionExpirations();
        } catch (error) {
            console.error('[SubscriptionExpirationScheduler] Error in subscription expiration check:', error);
        }
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'Asia/Kolkata' // Default to IST, can be configured
    });

    console.log('[SubscriptionExpirationScheduler] Subscription expiration scheduler started successfully.');
    
    return job;
};

/**
 * Manually trigger subscription expiration check (for testing or manual execution)
 */
export const triggerSubscriptionExpirationCheck = async () => {
    console.log('[SubscriptionExpirationScheduler] Manually triggering subscription expiration check...');
    try {
        const result = await processAllUserSubscriptionExpirations();
        console.log('[SubscriptionExpirationScheduler] Manual trigger completed:', result);
        return result;
    } catch (error) {
        console.error('[SubscriptionExpirationScheduler] Error in manual trigger:', error);
        throw error;
    }
};
