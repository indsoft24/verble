/**
 * Recompute challenge streaks from user.dailyProgress when streaks were never updated
 * (e.g. GOLD / FULL_COURSE membershipLevel skipped streak updates).
 *
 * Usage:
 *   node scripts/backfillStreaksFromDailyProgress.js          # dry-run
 *   node scripts/backfillStreaksFromDailyProgress.js --apply  # write to DB
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js';

const CHALLENGE_TARGETS = { free: 30, bronze: 60, silver: 90 };
const APPLY = process.argv.includes('--apply');

function dayKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/** Consecutive-day streak ending on the most recent activity day. */
function streakFromSortedDays(sortedUniqueMs) {
    if (!sortedUniqueMs.length) {
        return { current: 0, max: 0, lastActive: null };
    }

    let maxRun = 1;
    let run = 1;
    for (let i = 1; i < sortedUniqueMs.length; i++) {
        const diffDays = Math.round((sortedUniqueMs[i] - sortedUniqueMs[i - 1]) / 86400000);
        if (diffDays === 1) {
            run += 1;
        } else {
            maxRun = Math.max(maxRun, run);
            run = 1;
        }
    }
    maxRun = Math.max(maxRun, run);

    let tail = 1;
    for (let i = sortedUniqueMs.length - 2; i >= 0; i--) {
        const diffDays = Math.round((sortedUniqueMs[i + 1] - sortedUniqueMs[i]) / 86400000);
        if (diffDays === 1) {
            tail += 1;
        } else {
            break;
        }
    }

    const lastActive = new Date(sortedUniqueMs[sortedUniqueMs.length - 1]);
    return { current: tail, max: Math.max(maxRun, tail), lastActive };
}

function resolveActiveStreakKeyForBackfill(user) {
    const levelMap = { FREE: 'free', BRONZE: 'bronze', SILVER: 'silver' };
    if (levelMap[user.membershipLevel]) {
        return levelMap[user.membershipLevel];
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

async function main() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('Set MONGODB_URI');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log(APPLY ? '[apply] Writing streak updates…' : '[dry-run] No writes (pass --apply to persist)');

    const users = await User.find({
        'dailyProgress.0': { $exists: true },
    }).select('_id email membershipLevel streaks dailyProgress');

    let updated = 0;
    for (const user of users) {
        const days = (user.dailyProgress || [])
            .map((p) => dayKey(p.date))
            .filter((k) => !Number.isNaN(k));
        const unique = [...new Set(days)].sort((a, b) => a - b);
        if (!unique.length) continue;

        const computed = streakFromSortedDays(unique);
        const key = resolveActiveStreakKeyForBackfill(user);
        const existing = user.streaks?.[key]?.current ?? 0;

        if (computed.current <= existing) {
            continue;
        }

        console.log(
            `${user.email || user._id}: ${key} ${existing} -> ${computed.current} (max ${computed.max}, ${unique.length} active days)`
        );

        if (APPLY) {
            if (!user.streaks[key]) {
                user.streaks[key] = {};
            }
            user.streaks[key].current = computed.current;
            user.streaks[key].max = Math.max(user.streaks[key].max ?? 0, computed.max);
            user.streaks[key].lastActive = computed.lastActive;
            user.markModified('streaks');
            await user.save({ validateBeforeSave: false });
        }
        updated += 1;
    }

    console.log(`Done. ${updated} user(s) ${APPLY ? 'updated' : 'would be updated'}.`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
