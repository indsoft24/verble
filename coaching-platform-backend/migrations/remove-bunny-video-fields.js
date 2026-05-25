/**
 * Migration Script: Remove legacy Bunny fields from videos
 *
 * Safe operations:
 * - Drops Bunny-specific indexes if present
 * - Unsets Bunny-specific fields from all video documents
 *
 * Run with: node migrations/remove-bunny-video-fields.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function dropIndexIfExists(collection, indexName) {
    try {
        await collection.dropIndex(indexName);
        console.log(`Dropped index: ${indexName}`);
    } catch (err) {
        if (err.code === 27 || err.codeName === 'IndexNotFound') {
            console.log(`Index not found, skipping: ${indexName}`);
            return;
        }
        throw err;
    }
}

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const collection = mongoose.connection.db.collection('videos');
        const indexes = await collection.indexes();
        console.log(`Found ${indexes.length} indexes on videos.`);

        await dropIndexIfExists(collection, 'bunnyVideoId_1');
        await dropIndexIfExists(collection, 'bunnyVideoLibraryId_1');

        const unsetResult = await collection.updateMany({}, [
            {
                $set: {
                    processingProgress: {
                        $ifNull: ['$processingProgress', '$bunnyProcessingProgress', 0],
                    },
                },
            },
            {
                $unset: [
                    'bunnyVideoId',
                    'bunnyVideoLibraryId',
                    'bunnyStreamUrl',
                    'bunnyThumbnailUrl',
                    'bunnyProcessingProgress',
                ],
            },
        ]);
        console.log(`Unset Bunny fields on ${unsetResult.modifiedCount} documents.`);

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

migrate();

