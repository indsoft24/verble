/**
 * One-time migration: assign unique sequential order values per module for published videos
 * that share duplicate order values (common when default order was 0).
 *
 * Usage: node scripts/backfillVideoOrder.mjs
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Video from '../src/models/Video.js';
import Module from '../src/models/Module.js';

dotenv.config();

await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);

const modules = await Module.find().select('_id title').lean();
let updatedVideos = 0;

for (const mod of modules) {
    const videos = await Video.find({ modules: mod._id, isPublished: true })
        .sort({ order: 1, createdAt: 1, _id: 1 })
        .select('_id title order')
        .lean();

    for (let i = 0; i < videos.length; i++) {
        if (videos[i].order !== i) {
            await Video.updateOne({ _id: videos[i]._id }, { $set: { order: i } });
            console.log(`Module ${mod.title}: "${videos[i].title}" order ${videos[i].order} -> ${i}`);
            updatedVideos += 1;
        }
    }
}

console.log(`Done. Updated order on ${updatedVideos} video(s) across ${modules.length} module(s).`);
await mongoose.disconnect();
