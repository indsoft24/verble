/**
 * Merge multi-cycle VideoWatchProgress rows into cycle 0 and unlock quizzes
 * for users who completed all lessons in any cycle.
 *
 * Usage: DOCKER_ENV=true node scripts/migrateToCumulativeUnlock.mjs
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import VideoWatchProgress from '../src/models/VideoWatchProgress.js';
import ModuleCompletion from '../src/models/ModuleCompletion.js';
import Module from '../src/models/Module.js';
import Video from '../src/models/Video.js';

dotenv.config();

const isDocker = process.env.DOCKER_ENV === 'true';
const mongoUri = isDocker
    ? process.env.MONGODB_URI_DOCKER || process.env.MONGODB_URI || process.env.MONGO_URI
    : process.env.MONGODB_URI || process.env.MONGODB_URI_DOCKER || process.env.MONGO_URI;

if (!mongoUri) {
    console.error('MongoDB URI not found. Set MONGODB_URI (local) or MONGODB_URI_DOCKER (Docker).');
    process.exit(1);
}

await mongoose.connect(mongoUri);

const progressRows = await VideoWatchProgress.find().lean();
const groups = new Map();

for (const row of progressRows) {
    const key = `${row.user}:${row.module}:${row.video}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
}

let merged = 0;
let deleted = 0;

for (const [, rows] of groups) {
    if (rows.length <= 1 && (rows[0]?.moduleCompletionCycle ?? 0) === 0) continue;

    const base = rows.find((r) => r.moduleCompletionCycle === 0) || rows[0];
    const watchCount = rows.reduce((sum, r) => sum + (r.watchCount || 0), 0);
    const isCompleted = rows.some((r) => r.isCompleted);
    const completedAt = rows
        .filter((r) => r.completedAt)
        .map((r) => r.completedAt)
        .sort((a, b) => new Date(b) - new Date(a))[0];
    const lastWatchedAt = rows
        .filter((r) => r.lastWatchedAt)
        .map((r) => r.lastWatchedAt)
        .sort((a, b) => new Date(b) - new Date(a))[0];

    await VideoWatchProgress.updateOne(
        { _id: base._id },
        {
            $set: {
                moduleCompletionCycle: 0,
                watchCount,
                isCompleted,
                ...(completedAt ? { completedAt } : {}),
                ...(lastWatchedAt ? { lastWatchedAt } : {}),
            },
        }
    );
    merged += 1;

    const extraIds = rows.filter((r) => r._id.toString() !== base._id.toString()).map((r) => r._id);
    if (extraIds.length > 0) {
        const result = await VideoWatchProgress.deleteMany({ _id: { $in: extraIds } });
        deleted += result.deletedCount || 0;
    }
}

const modules = await Module.find().select('_id course').lean();
let quizUnlocked = 0;

for (const mod of modules) {
    const totalVideos = await Video.countDocuments({ modules: mod._id, isPublished: true });
    if (totalVideos === 0) continue;

    const userIds = await VideoWatchProgress.distinct('user', { module: mod._id });
    for (const userId of userIds) {
        const completedCount = await VideoWatchProgress.countDocuments({
            user: userId,
            module: mod._id,
            moduleCompletionCycle: 0,
            isCompleted: true,
        });
        if (completedCount < totalVideos) continue;

        const result = await ModuleCompletion.updateOne(
            { user: userId, module: mod._id },
            {
                $set: {
                    quizUnlocked: true,
                    firstCycleCompleted: true,
                    videosCompleted: completedCount,
                    totalVideos,
                },
                $setOnInsert: {
                    user: userId,
                    module: mod._id,
                    course: mod.course,
                    quizPassed: false,
                    quizScore: 0,
                    quizFailedAttempts: 0,
                    quizExhausted: false,
                    isCompleted: false,
                },
            },
            { upsert: true }
        );
        if (result.modifiedCount > 0 || result.upsertedCount > 0) quizUnlocked += 1;
    }
}

console.log(`Merged ${merged} user/video groups; deleted ${deleted} extra cycle rows; updated ${quizUnlocked} quiz unlock records.`);
await mongoose.disconnect();
