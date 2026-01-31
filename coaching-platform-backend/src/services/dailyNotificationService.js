// src/services/dailyNotificationService.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import DailyContent from '../models/DailyContent.js';
import { startOfDay, isToday, subDays } from 'date-fns';

/**
 * Send daily puzzle/task notifications to all active users
 */
export const sendDailyPuzzleTaskNotifications = async () => {
    try {
        console.log('[DailyNotifications] Starting daily puzzle/task notifications...');
        
        const today = startOfDay(new Date());
        
        // Get today's puzzle content
        const todayPuzzles = await DailyContent.find({
            type: { $in: ['PUZZLE'] },
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            },
            isActive: true
        });

        // Get today's other daily tasks (WORD, PHRASE, STORY, VOCAB_SET)
        const todayTasks = await DailyContent.find({
            type: { $in: ['WORD', 'PHRASE', 'STORY', 'VOCAB_SET'] },
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            },
            isActive: true
        });

        if (todayPuzzles.length === 0 && todayTasks.length === 0) {
            console.log('[DailyNotifications] No puzzles or tasks available for today.');
            return { puzzles: 0, tasks: 0 };
        }

        // Get all active users (non-admin)
        const users = await User.find({
            role: 'user',
            isEmailVerified: true
        }).select('_id name email membershipLevel unlockedLevels');

        if (users.length === 0) {
            console.log('[DailyNotifications] No active users found.');
            return { puzzles: 0, tasks: 0 };
        }

        const notifications = [];

        for (const user of users) {
            // Check user's unlocked levels
            const unlockedLevels = user.unlockedLevels || ['FREE'];
            
            // Filter puzzles by user's unlocked levels
            const availablePuzzles = todayPuzzles.filter(puzzle => 
                unlockedLevels.includes(puzzle.level)
            );

            // Filter tasks by user's unlocked levels
            const availableTasks = todayTasks.filter(task => 
                unlockedLevels.includes(task.level)
            );

            // Send puzzle notification if available
            if (availablePuzzles.length > 0) {
                const puzzleCount = availablePuzzles.length;
                notifications.push({
                    user: user._id,
                    title: `🎯 Daily Puzzles Available!`,
                    message: `You have ${puzzleCount} new puzzle${puzzleCount > 1 ? 's' : ''} waiting for you today. Test your grammar skills and earn points!`,
                    link: '/dashboard',
                    type: 'new_content',
                    categoryKey: 'daily_challenges',
                    categoryLabel: 'Daily Challenges',
                });
            }

            // Send task notification if available
            if (availableTasks.length > 0) {
                const taskCount = availableTasks.length;
                const taskTypes = [...new Set(availableTasks.map(t => t.type))];
                let taskMessage = '';
                
                if (taskTypes.includes('WORD')) taskMessage += 'Word of the Day, ';
                if (taskTypes.includes('PHRASE')) taskMessage += 'Phrase of the Day, ';
                if (taskTypes.includes('STORY')) taskMessage += 'Story, ';
                if (taskTypes.includes('VOCAB_SET')) taskMessage += 'Vocabulary Set, ';
                
                taskMessage = taskMessage.replace(/,\s*$/, ''); // Remove trailing comma
                
                notifications.push({
                    user: user._id,
                    title: `📚 Daily Learning Tasks Ready!`,
                    message: `New ${taskMessage} ${taskCount > 1 ? 'are' : 'is'} available today. Continue your learning journey!`,
                    link: '/dashboard',
                    type: 'new_content',
                    categoryKey: 'daily_tasks',
                    categoryLabel: 'Daily Tasks',
                });
            }
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            console.log(`[DailyNotifications] Successfully sent ${notifications.length} puzzle/task notifications.`);
        }

        return {
            puzzles: todayPuzzles.length,
            tasks: todayTasks.length,
            notificationsSent: notifications.length
        };
    } catch (error) {
        console.error('[DailyNotifications] Error sending puzzle/task notifications:', error);
        throw error;
    }
};

/**
 * Send daily challenge reminders to users who haven't completed today's activities
 */
export const sendDailyChallengeReminders = async () => {
    try {
        console.log('[DailyNotifications] Starting daily challenge reminders...');
        
        const today = startOfDay(new Date());
        const yesterday = subDays(today, 1);
        
        // Get all active users
        const users = await User.find({
            role: 'user',
            isEmailVerified: true
        }).select('_id name email membershipLevel unlockedLevels dailyProgress streaks');

        if (users.length === 0) {
            console.log('[DailyNotifications] No active users found for reminders.');
            return { remindersSent: 0 };
        }

        const notifications = [];

        for (const user of users) {
            // Check if user has completed any activity today
            const todayProgress = user.dailyProgress?.find(progress => 
                isToday(new Date(progress.date))
            );

            // If user hasn't completed any activity today, send reminder
            if (!todayProgress || !todayProgress.activitiesCompleted || todayProgress.activitiesCompleted.length === 0) {
                // Check user's current streak
                const currentLevel = user.membershipLevel || 'FREE';
                const currentStreak = user.streaks?.[currentLevel.toLowerCase()]?.current || 0;
                
                // Get streak message
                let streakMessage = '';
                if (currentStreak > 0) {
                    streakMessage = `Don't break your ${currentStreak}-day streak! `;
                } else {
                    streakMessage = 'Start building your learning streak today! ';
                }

                // Check if user completed yesterday (to encourage continuation)
                const yesterdayProgress = user.dailyProgress?.find(progress => {
                    const progressDate = new Date(progress.date);
                    return progressDate >= yesterday && progressDate < today;
                });

                let message = '';
                if (yesterdayProgress && yesterdayProgress.activitiesCompleted.length > 0) {
                    message = `${streakMessage}Continue your learning journey with today's challenges!`;
                } else {
                    message = `${streakMessage}Complete today's activities to unlock new levels and earn points!`;
                }

                notifications.push({
                    user: user._id,
                    title: `⏰ Daily Challenge Reminder`,
                    message: message,
                    link: '/dashboard',
                    type: 'default',
                    categoryKey: 'daily_challenges',
                    categoryLabel: 'Daily Challenges',
                });
            }
        }

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            console.log(`[DailyNotifications] Successfully sent ${notifications.length} challenge reminders.`);
        } else {
            console.log('[DailyNotifications] All users have completed today\'s activities. No reminders needed.');
        }

        return { remindersSent: notifications.length };
    } catch (error) {
        console.error('[DailyNotifications] Error sending challenge reminders:', error);
        throw error;
    }
};

/**
 * Main function to send all daily notifications
 * This should be called once per day (typically in the morning)
 */
export const sendAllDailyNotifications = async () => {
    try {
        console.log('[DailyNotifications] ===== Starting daily notification batch =====');
        
        const puzzleTaskResult = await sendDailyPuzzleTaskNotifications();
        const reminderResult = await sendDailyChallengeReminders();
        
        console.log('[DailyNotifications] ===== Daily notification batch completed =====');
        console.log('[DailyNotifications] Summary:', {
            puzzles: puzzleTaskResult.puzzles,
            tasks: puzzleTaskResult.tasks,
            puzzleTaskNotifications: puzzleTaskResult.notificationsSent,
            challengeReminders: reminderResult.remindersSent
        });

        return {
            success: true,
            puzzleTaskNotifications: puzzleTaskResult.notificationsSent,
            challengeReminders: reminderResult.remindersSent,
            total: puzzleTaskResult.notificationsSent + reminderResult.remindersSent
        };
    } catch (error) {
        console.error('[DailyNotifications] Error in daily notification batch:', error);
        throw error;
    }
};
