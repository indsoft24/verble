// src/services/subscriptionAccessService.js
import User from '../models/User.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';

/**
 * Check if user has an active Gold subscription
 * Gold subscription is identified by plan name containing "Gold" (case-insensitive)
 * @param {Object} user - User object with subscriptions
 * @returns {boolean} - True if user has active Gold subscription
 */
export const hasActiveGoldSubscription = (user) => {
    if (!user || !user.subscriptions || user.subscriptions.length === 0) {
        return false;
    }

    const now = new Date();
    return user.subscriptions.some(sub => {
        const isActive = sub.status === 'active' && 
                       new Date(sub.startDate) <= now && 
                       new Date(sub.endDate) >= now;
        const isGold = sub.planName && sub.planName.toLowerCase().includes('gold');
        return isActive && isGold;
    });
};

/**
 * Check if user has an active Full Course subscription
 * Full Course subscription is identified by plan name containing "Full Course" or "Full Course" (case-insensitive)
 * @param {Object} user - User object with subscriptions
 * @returns {boolean} - True if user has active Full Course subscription
 */
export const hasActiveFullCourseSubscription = (user) => {
    if (!user || !user.subscriptions || user.subscriptions.length === 0) {
        return false;
    }

    const now = new Date();
    return user.subscriptions.some(sub => {
        const isActive = sub.status === 'active' && 
                       new Date(sub.startDate) <= now && 
                       new Date(sub.endDate) >= now;
        const isFullCourse = sub.planName && (
            sub.planName.toLowerCase().includes('full course') ||
            sub.planName.toLowerCase().includes('fullcourse')
        );
        return isActive && isFullCourse;
    });
};

/**
 * Update user's unlocked levels based on active subscriptions
 * - Gold subscription unlocks: FREE, BRONZE, SILVER, GOLD
 * - Full Course subscription unlocks: All levels (FREE, BRONZE, SILVER, GOLD, FULL_COURSE)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated unlocked levels
 */
export const updateUnlockedLevelsFromSubscriptions = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const hasGold = hasActiveGoldSubscription(user);
        const hasFullCourse = hasActiveFullCourseSubscription(user);

        let unlockedLevels = ['FREE']; // Always start with FREE

        // If user has Full Course subscription, unlock everything
        if (hasFullCourse) {
            unlockedLevels = ['FREE', 'BRONZE', 'SILVER', 'GOLD', 'FULL_COURSE'];
            if (user.membershipLevel !== 'FULL_COURSE') {
                user.membershipLevel = 'FULL_COURSE';
            }
        } 
        // If user has Gold subscription, unlock FREE, BRONZE, SILVER, GOLD
        else if (hasGold) {
            unlockedLevels = ['FREE', 'BRONZE', 'SILVER', 'GOLD'];
            if (!['FULL_COURSE'].includes(user.membershipLevel)) {
                user.membershipLevel = 'GOLD';
            }
        }
        // Otherwise, keep existing unlocked levels from gamification (don't override)
        // Only add subscription-based unlocks if they're not already there
        else {
            // Keep existing unlocked levels from streak/70% completion
            unlockedLevels = user.unlockedLevels || ['FREE'];
        }

        // Update user's unlocked levels
        user.unlockedLevels = unlockedLevels;
        await user.save();

        return {
            unlockedLevels,
            hasGold,
            hasFullCourse,
            membershipLevel: user.membershipLevel
        };
    } catch (error) {
        console.error('[SubscriptionAccessService] Error updating unlocked levels:', error);
        throw error;
    }
};

/**
 * Check and handle subscription expiration
 * - After 1 year, lock free-bronze-silver-gold content (but keep full course)
 * - Update subscription status to 'expired' if past endDate
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Expiration status and updated unlocked levels
 */
export const checkAndHandleSubscriptionExpiration = async (userId) => {
    try {
        const user = await User.findById(userId).populate('subscriptions.planId');
        if (!user) {
            throw new Error('User not found');
        }

        const now = new Date();
        let hasExpiredSubscriptions = false;
        let hasActiveFullCourse = false;
        let hasActiveGold = false;

        // Check each subscription
        for (const subscription of user.subscriptions) {
            const endDate = new Date(subscription.endDate);
            const isExpired = endDate < now;

            // Mark expired subscriptions
            if (isExpired && subscription.status === 'active') {
                subscription.status = 'expired';
                hasExpiredSubscriptions = true;
            }

            // Check for active Full Course subscription
            if (!isExpired && subscription.status === 'active') {
                const planName = subscription.planName || '';
                if (planName.toLowerCase().includes('full course') || 
                    planName.toLowerCase().includes('fullcourse')) {
                    hasActiveFullCourse = true;
                } else if (planName.toLowerCase().includes('gold')) {
                    hasActiveGold = true;
                }
            }
        }

        // Save user if subscriptions were marked as expired
        if (hasExpiredSubscriptions) {
            await user.save();
        }

        // Check if user had Full Course subscription (even if expired now)
        const hadFullCourseSubscription = user.subscriptions.some(sub => {
            const planName = sub.planName || '';
            return (planName.toLowerCase().includes('full course') || 
                   planName.toLowerCase().includes('fullcourse'));
        });

        // Update unlocked levels based on current active subscriptions
        // This will handle the logic: Gold unlocks FREE/BRONZE/SILVER/GOLD, Full Course unlocks all
        let updatedLevels;
        try {
            updatedLevels = await updateUnlockedLevelsFromSubscriptions(userId);
        } catch (error) {
            console.error('[SubscriptionAccessService] Error updating levels:', error);
            // Fallback to current user state
            updatedLevels = {
                unlockedLevels: user.unlockedLevels || ['FREE'],
                membershipLevel: user.membershipLevel || 'FREE',
                hasGold: hasActiveGold,
                hasFullCourse: hasActiveFullCourse
            };
        }
        
        // After 1 year expiration logic:
        // If user had Full Course subscription that expired, keep FULL_COURSE access
        // But remove other subscription-based unlocks (FREE, BRONZE, SILVER, GOLD from Gold subscription)
        if (hasExpiredSubscriptions && !hasActiveFullCourse && !hasActiveGold) {
            if (hadFullCourseSubscription) {
                // User had Full Course - keep FULL_COURSE access, remove others
                // Refresh user to get latest state
                const refreshedUser = await User.findById(userId);
                refreshedUser.unlockedLevels = ['FREE', 'FULL_COURSE'];
                if (refreshedUser.membershipLevel !== 'FULL_COURSE') {
                    refreshedUser.membershipLevel = 'FULL_COURSE';
                }
                await refreshedUser.save();
                
                return {
                    hasExpiredSubscriptions: true,
                    hasActiveFullCourse: false,
                    hasActiveGold: false,
                    unlockedLevels: ['FREE', 'FULL_COURSE'],
                    membershipLevel: 'FULL_COURSE',
                    keptFullCourseAccess: true
                };
            } else {
                // User had Gold subscription that expired - remove subscription-based unlocks
                // Keep only gamification-based unlocks
                const refreshedUser = await User.findById(userId);
                const currentLevels = refreshedUser.unlockedLevels || ['FREE'];
                
                // Remove GOLD if it was only from subscription (not from gamification)
                const gamificationLevels = currentLevels.filter(level => {
                    if (level === 'GOLD' && refreshedUser.membershipLevel !== 'GOLD') {
                        return false; // Remove GOLD if not from gamification
                    }
                    return true;
                });
                
                refreshedUser.unlockedLevels = gamificationLevels.length > 0 ? gamificationLevels : ['FREE'];
                
                // Update membership level if it was subscription-based
                if (refreshedUser.membershipLevel === 'GOLD' && !gamificationLevels.includes('GOLD')) {
                    // Downgrade from GOLD if it was subscription-based
                    if (gamificationLevels.includes('SILVER')) {
                        refreshedUser.membershipLevel = 'SILVER';
                    } else if (gamificationLevels.includes('BRONZE')) {
                        refreshedUser.membershipLevel = 'BRONZE';
                    } else {
                        refreshedUser.membershipLevel = 'FREE';
                    }
                }
                await refreshedUser.save();
                
                return {
                    hasExpiredSubscriptions: true,
                    hasActiveFullCourse: false,
                    hasActiveGold: false,
                    unlockedLevels: refreshedUser.unlockedLevels,
                    membershipLevel: refreshedUser.membershipLevel
                };
            }
        }

        // Get final state after all updates
        const finalUser = await User.findById(userId).select('unlockedLevels membershipLevel');
        
        return {
            hasExpiredSubscriptions,
            hasActiveFullCourse,
            hasActiveGold,
            unlockedLevels: finalUser.unlockedLevels || updatedLevels.unlockedLevels,
            membershipLevel: finalUser.membershipLevel || updatedLevels.membershipLevel
        };
    } catch (error) {
        console.error('[SubscriptionAccessService] Error checking subscription expiration:', error);
        throw error;
    }
};

/**
 * Process subscription expiration for all users (to be run daily)
 * @returns {Promise<Object>} - Summary of processed users
 */
export const processAllUserSubscriptionExpirations = async () => {
    try {
        console.log('[SubscriptionAccessService] Starting subscription expiration check for all users...');
        
        const users = await User.find({
            role: 'user',
            'subscriptions.status': 'active'
        }).select('_id subscriptions');

        let processedCount = 0;
        let expiredCount = 0;

        for (const user of users) {
            try {
                const result = await checkAndHandleSubscriptionExpiration(user._id);
                processedCount++;
                if (result.hasExpiredSubscriptions) {
                    expiredCount++;
                }
            } catch (error) {
                console.error(`[SubscriptionAccessService] Error processing user ${user._id}:`, error);
            }
        }

        console.log(`[SubscriptionAccessService] Processed ${processedCount} users, ${expiredCount} had expired subscriptions.`);

        return {
            processedCount,
            expiredCount
        };
    } catch (error) {
        console.error('[SubscriptionAccessService] Error processing all user subscriptions:', error);
        throw error;
    }
};
