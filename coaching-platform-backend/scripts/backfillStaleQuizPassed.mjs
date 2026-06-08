/**
 * One-time migration: reset ModuleCompletion.quizPassed where an active quiz exists
 * but the user has no passing ModuleQuizSubmission.
 *
 * Usage: node scripts/backfillStaleQuizPassed.mjs
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ModuleQuiz from '../src/models/ModuleQuiz.js';
import ModuleCompletion from '../src/models/ModuleCompletion.js';
import ModuleQuizSubmission from '../src/models/ModuleQuizSubmission.js';

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

const activeQuizzes = await ModuleQuiz.find({ isActive: true }).select('module').lean();
const moduleIds = [...new Set(activeQuizzes.map((q) => q.module.toString()))];

let resetCount = 0;

for (const moduleId of moduleIds) {
    const completions = await ModuleCompletion.find({ module: moduleId, quizPassed: true }).lean();
    for (const completion of completions) {
        const passedAttempts = await ModuleQuizSubmission.countDocuments({
            user: completion.user,
            module: moduleId,
            passed: true,
        });
        if (passedAttempts === 0) {
            await ModuleCompletion.updateOne(
                { _id: completion._id },
                { $set: { quizPassed: false, isCompleted: false }, $unset: { completedAt: 1 } }
            );
            resetCount += 1;
            console.log(`Reset stale quizPassed for user ${completion.user} module ${moduleId}`);
        }
    }
}

console.log(`Done. Reset ${resetCount} stale quizPassed record(s) across ${moduleIds.length} module(s).`);
await mongoose.disconnect();
