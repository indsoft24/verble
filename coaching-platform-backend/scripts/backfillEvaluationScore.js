/**
 * One-time backfill: set user.evaluationScore from reviewed submissions,
 * puzzle points, and best quiz scores per quiz.
 *
 * Usage: node scripts/backfillEvaluationScore.js
 * Requires MONGODB_URI or app env (run from coaching-platform-backend).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import User from '../src/models/User.js';
import { computeEvaluationScore } from '../src/services/evaluationScoreService.js';

async function main() {
    const inDocker = process.env.DOCKER_ENV === 'true' || process.env.NODE_ENV === 'production';
    const uri =
        (inDocker ? process.env.MONGODB_URI_DOCKER : null) ||
        process.env.MONGODB_URI ||
        process.env.MONGODB_URI_DOCKER ||
        process.env.MONGO_URI;
    if (!uri) {
        console.error('Set MONGODB_URI or MONGODB_URI_DOCKER');
        process.exit(1);
    }
    await mongoose.connect(uri);
    const users = await User.find({ role: 'user' }).select('_id evaluationScore').lean();
    let updated = 0;
    for (const u of users) {
        const total = await computeEvaluationScore(u._id);
        if (total !== (u.evaluationScore || 0)) {
            await User.updateOne({ _id: u._id }, { $set: { evaluationScore: total } });
            updated++;
            console.log(`User ${u._id}: ${u.evaluationScore ?? 0} -> ${total}`);
        }
    }
    console.log(`Backfill complete. Updated ${updated} of ${users.length} users.`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
