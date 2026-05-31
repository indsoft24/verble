/**
 * One-time backfill: set user.evaluationScore from reviewed daily submissions.
 * Does not modify user.points (participation).
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
import UserSentenceSubmission from '../src/models/UserSentenceSubmission.js';
import UserStorySubmission from '../src/models/UserStorySubmission.js';
import UserVocabSubmission from '../src/models/UserVocabSubmission.js';
import UserSceneSubmission from '../src/models/UserSceneSubmission.js';
import UserSpeechSubmission from '../src/models/UserSpeechSubmission.js';

function effectivePoints(doc) {
    if (doc.evaluationPoints != null && doc.evaluationPoints > 0) {
        return doc.evaluationPoints;
    }
    if (doc.isCorrect != null && doc.pointsEarned != null) {
        return doc.pointsEarned;
    }
    return 0;
}

async function sumReviewedForUser(userId) {
    const reviewed = { isCorrect: { $ne: null } };
    const [sentences, stories, vocabs, scenes, speeches] = await Promise.all([
        UserSentenceSubmission.find({ userId, ...reviewed }).lean(),
        UserStorySubmission.find({ userId, ...reviewed }).lean(),
        UserVocabSubmission.find({ userId, ...reviewed }).lean(),
        UserSceneSubmission.find({ userId, ...reviewed }).lean(),
        UserSpeechSubmission.find({ userId, ...reviewed }).lean(),
    ]);
    const all = [...sentences, ...stories, ...vocabs, ...scenes, ...speeches];
    return all.reduce((sum, doc) => sum + effectivePoints(doc), 0);
}

async function main() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('Set MONGODB_URI');
        process.exit(1);
    }
    await mongoose.connect(uri);
    const users = await User.find({ role: 'user' }).select('_id evaluationScore').lean();
    let updated = 0;
    for (const u of users) {
        const total = await sumReviewedForUser(u._id);
        if (total !== (u.evaluationScore || 0)) {
            await User.updateOne({ _id: u._id }, { $set: { evaluationScore: total } });
            updated++;
        }
    }
    console.log(`Backfill complete. Updated ${updated} of ${users.length} users.`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
