// src/services/GamificationService.js
import User from '../models/User.js';
import DailyContent from '../models/DailyContent.js';
import mongoose from 'mongoose';
import { appendLedgerEntry } from './scoreLedgerService.js';
import { getLocalTodayBounds } from '../utils/dailyContentLocalDay.js';

const CHALLENGE_TARGETS = { free: 30, bronze: 60, silver: 90 };

class GamificationService {
    /**
     * Record participation activity (leaderboard / streak). Does not affect evaluation score.
     * @param {string} userId - User ID
     * @param {string} contentId - DailyContent ID
     * @param {number} points - Participation points (defaults to 10)
     */
    static async recordActivity(userId, contentId, points = 10) {
        try {
            // Validate inputs
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(contentId)) {
                throw new Error('Invalid userId or contentId');
            }

            // Get user and content
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const content = await DailyContent.findById(contentId);
            if (!content) {
                throw new Error('Content not found');
            }

            const { start: todayStart, end: todayEnd } = getLocalTodayBounds();

            // Check if already completed today (server local calendar day)
            const todayProgress = user.dailyProgress.find((progress) => {
                const t = new Date(progress.date).getTime();
                return t >= todayStart.getTime() && t < todayEnd.getTime();
            });

            if (todayProgress) {
                // Check if this specific content was already completed
                const alreadyCompleted = todayProgress.activitiesCompleted.some(
                    id => id.toString() === contentId.toString()
                );

                if (alreadyCompleted) {
                    return {
                        success: false,
                        message: 'Activity already completed today',
                        user,
                        progress: this.buildUserProgressSnapshot(user),
                    };
                }

                // Add to existing progress
                todayProgress.activitiesCompleted.push(contentId);
                todayProgress.score += points;
            } else {
                // Create new daily progress entry
                user.dailyProgress.push({
                    date: todayStart,
                    activitiesCompleted: [contentId],
                    score: points,
                });
            }

            // Award points
            user.points = (user.points || 0) + (points || 0);

            const levelKey = this._resolveActiveStreakKey(user);
            if (levelKey) {
                this._updateStreak(user, levelKey, todayStart);
            }

            user.markModified('streaks');
            user.markModified('dailyProgress');
            await user.save();

            const activityTitle = content.title || content.contentType || 'Daily activity';
            await appendLedgerEntry({
                userId,
                category: 'participation',
                points,
                delta: points,
                title: `Participation: ${activityTitle}`,
                sourceType: 'daily_content',
                sourceId: contentId.toString(),
                eventKind: 'participation',
                status: 'approved',
                occurredAt: new Date(),
                meta: { contentType: content.contentType },
            });

            return {
                success: true,
                message: 'Activity recorded successfully',
                user,
                progress: this.buildUserProgressSnapshot(user),
            };
        } catch (error) {
            throw new Error(`Failed to record activity: ${error.message}`);
        }
    }

    /**
     * Run participation gamification after a submission (streak, points, level-up).
     * @returns {{ participationPointsAwarded: number, progress: object|null, levelUp: object|null }}
     */
    static async runParticipationGamification(userId, contentId, points = 10) {
        let participationPointsAwarded = 0;
        let levelUp = null;
        let progress = null;

        try {
            const gamificationResult = await this.recordActivity(userId, contentId, points);
            participationPointsAwarded = gamificationResult?.success ? points : 0;
            progress = gamificationResult?.progress ?? null;
            levelUp = await this.checkLevelUp(userId);
            const fresh = await User.findById(userId);
            if (fresh) {
                progress = this.buildUserProgressSnapshot(fresh);
            }
        } catch (err) {
            console.error('[Gamification] Participation failed:', {
                userId,
                contentId,
                error: err?.message || err,
            });
            try {
                const fresh = await User.findById(userId);
                if (fresh) {
                    progress = this.buildUserProgressSnapshot(fresh);
                }
            } catch {
                /* ignore */
            }
        }

        return { participationPointsAwarded, progress, levelUp };
    }

    /** Snapshot for dashboard / auth patch after activity. */
    static buildUserProgressSnapshot(user) {
        const u = user?.toObject ? user.toObject() : user;
        return {
            streaks: u.streaks || {},
            membershipLevel: u.membershipLevel || 'FREE',
            unlockedLevels: u.unlockedLevels || ['FREE'],
            points: u.points ?? 0,
        };
    }

    /**
     * Apply admin evaluation score delta (separate from participation user.points).
     * @param {string} userId
     * @param {number} delta - Change in evaluation points (can be negative on re-review)
     */
    /**
     * @param {object} [ledgerMeta] - optional { title, sourceType, sourceId, points, meta }
     */
    static async applyEvaluationDelta(userId, delta, ledgerMeta = null) {
        if (!delta || delta === 0) {
            return { success: true, delta: 0 };
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid userId');
        }
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        user.evaluationScore = Math.max(0, (user.evaluationScore || 0) + delta);
        await user.save();

        if (ledgerMeta?.sourceType && ledgerMeta?.sourceId) {
            await appendLedgerEntry({
                userId,
                category: 'evaluation',
                points: ledgerMeta.points ?? Math.abs(delta),
                delta,
                title: ledgerMeta.title || 'Evaluation score update',
                sourceType: ledgerMeta.sourceType,
                sourceId: ledgerMeta.sourceId,
                eventKind: 'evaluation',
                status: 'approved',
                occurredAt: ledgerMeta.occurredAt || new Date(),
                meta: ledgerMeta.meta || {},
            });
        }

        return {
            success: true,
            delta,
            evaluationScore: user.evaluationScore,
        };
    }

    /**
     * Calculate completion percentage for free content in a given period
     * @private
     * @param {Object} user - User document
     * @param {number} days - Number of days to look back
     * @returns {Promise<number>} Completion percentage (0-100)
     */
    static async _calculateFreeContentCompletion(user, days) {
        if (!user.dailyProgress || user.dailyProgress.length === 0) {
            return 0;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days);

        // Get all daily progress entries in the period
        const progressInPeriod = user.dailyProgress.filter(progress => {
            const progressDate = new Date(progress.date);
            progressDate.setHours(0, 0, 0, 0);
            return progressDate >= startDate && progressDate <= today;
        });

        if (progressInPeriod.length === 0) {
            return 0;
        }

        // Collect all unique activity IDs
        const activityIdSet = new Set();
        progressInPeriod.forEach(progress => {
            if (progress.activitiesCompleted && progress.activitiesCompleted.length > 0) {
                progress.activitiesCompleted.forEach(id => {
                    activityIdSet.add(id.toString());
                });
            }
        });

        if (activityIdSet.size === 0) {
            return 0;
        }

        // Get the content to check levels (only FREE level content)
        const activityIds = Array.from(activityIdSet);
        const freeContents = await DailyContent.find({
            _id: { $in: activityIds },
            level: 'FREE'
        }).select('_id level').lean();

        // Create a Set of FREE content IDs for quick lookup
        const freeContentIds = new Set(freeContents.map(c => c._id.toString()));

        // Count days with at least one FREE level activity
        const freeContentDays = new Set();
        progressInPeriod.forEach(progress => {
            const progressDate = new Date(progress.date);
            progressDate.setHours(0, 0, 0, 0);
            const dateKey = progressDate.getTime();

            // Check if any activity in this day's progress is FREE level
            const hasFreeContent = progress.activitiesCompleted && 
                progress.activitiesCompleted.some(activityId => {
                    return freeContentIds.has(activityId.toString());
                });

            if (hasFreeContent) {
                freeContentDays.add(dateKey);
            }
        });

        // Calculate percentage
        const totalDays = days;
        const daysWithFreeContent = freeContentDays.size;
        const completionPercentage = (daysWithFreeContent / totalDays) * 100;

        return Math.round(completionPercentage * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Check if user should be upgraded to next level based on streak OR 70% completion rule
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Object with upgraded boolean and newLevel string
     */
    static async checkLevelUp(userId) {
        try {
            // Validate input
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid userId');
            }

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            let upgraded = false;
            let newLevel = user.membershipLevel;
            let upgradeReason = null;

            // Check level up conditions
            if (user.membershipLevel === 'FREE') {
                const freeStreak = user.streaks.free?.current || 0;
                const completionPercentage = await this._calculateFreeContentCompletion(user, 30);

                // Unlock BRONZE if: 30 consecutive days OR 70% completion in last 30 days
                if (freeStreak >= 30 || completionPercentage >= 70) {
                    if (!user.unlockedLevels.includes('BRONZE')) {
                        user.unlockedLevels.push('BRONZE');
                    }
                    upgraded = true;
                    newLevel = 'BRONZE';
                    user.membershipLevel = 'BRONZE';
                    upgradeReason = freeStreak >= 30 
                        ? '30 consecutive days streak' 
                        : `${completionPercentage}% completion in last 30 days`;
                    await user.save();
                }
            } else if (user.membershipLevel === 'BRONZE') {
                const bronzeStreak = user.streaks.bronze?.current || 0;
                const completionPercentage = await this._calculateFreeContentCompletion(user, 60);

                // Unlock SILVER if: 60 consecutive days OR 70% completion in last 60 days
                if (bronzeStreak >= 60 || completionPercentage >= 70) {
                    if (!user.unlockedLevels.includes('SILVER')) {
                        user.unlockedLevels.push('SILVER');
                    }
                    upgraded = true;
                    newLevel = 'SILVER';
                    user.membershipLevel = 'SILVER';
                    upgradeReason = bronzeStreak >= 60 
                        ? '60 consecutive days streak' 
                        : `${completionPercentage}% completion in last 60 days`;
                    await user.save();
                }
            } else if (user.membershipLevel === 'SILVER') {
                // Check for 90-day extension: 70% completion in last 90 days
                const completionPercentage = await this._calculateFreeContentCompletion(user, 90);
                
                if (completionPercentage >= 70) {
                    // Reward another 90 days - this could mean extending access or unlocking something
                    // For now, we'll just track this. You may want to add a field to track extension periods
                    upgradeReason = `${completionPercentage}% completion in last 90 days - 90 day extension granted`;
                    // Note: The document mentions "rewarded another 90 days" but doesn't specify what this unlocks
                    // You may need to add additional logic here based on your business requirements
                }
            }

            return {
                upgraded,
                newLevel,
                upgradeReason
            };
        } catch (error) {
            throw new Error(`Failed to check level up: ${error.message}`);
        }
    }

    /**
     * Update streak for a specific level
     * @private
     * @param {Object} user - User document
     * @param {string} levelKey - Level key ('free', 'bronze', 'silver')
     */
    static _updateStreak(user, levelKey, todayStart = getLocalTodayBounds().start) {
        const today = new Date(todayStart);

        const streak = user.streaks?.[levelKey] || { current: 0, max: 0, lastActive: null };

        if (!streak.lastActive) {
            // First time activity
            streak.current = 1;
            streak.lastActive = today;
            if (streak.current > (streak.max || 0)) {
                streak.max = streak.current;
            }
        } else {
            const lastActiveDate = new Date(streak.lastActive);
            lastActiveDate.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
                // Already counted today, no change
                return;
            } else if (daysDiff === 1) {
                // Consecutive day - increment streak
                streak.current = (streak.current || 0) + 1;
                streak.lastActive = today;
                if (streak.current > (streak.max || 0)) {
                    streak.max = streak.current;
                }
            } else {
                // Streak broken - reset to 1
                streak.current = 1;
                streak.lastActive = today;
                if (streak.current > (streak.max || 0)) {
                    streak.max = streak.current;
                }
            }
        }

        // Update the streak in user object
        if (!user.streaks[levelKey]) {
            user.streaks[levelKey] = {};
        }
        user.streaks[levelKey].current = streak.current;
        user.streaks[levelKey].max = streak.max;
        user.streaks[levelKey].lastActive = streak.lastActive;
    }

    /**
     * Streak bucket for challenge progression (includes GOLD / FULL_COURSE subscribers).
     * @private
     */
    static _resolveActiveStreakKey(user) {
        const fromLevel = this._getLevelKey(user.membershipLevel);
        if (fromLevel) {
            return fromLevel;
        }

        const freeCurrent = user.streaks?.free?.current ?? 0;
        if (freeCurrent < CHALLENGE_TARGETS.free) {
            return 'free';
        }
        const bronzeCurrent = user.streaks?.bronze?.current ?? 0;
        if (bronzeCurrent < CHALLENGE_TARGETS.bronze) {
            return 'bronze';
        }
        return 'silver';
    }

    /**
     * @private
     * @param {string} membershipLevel
     * @returns {string|null}
     */
    static _getLevelKey(membershipLevel) {
        const levelMap = {
            FREE: 'free',
            BRONZE: 'bronze',
            SILVER: 'silver',
        };
        return levelMap[membershipLevel] || null;
    }
}

export default GamificationService;
