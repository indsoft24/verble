/**
 * Migration Script: Fix VideoWatchProgress Unique Index
 * 
 * This script drops the old unique index that didn't include moduleCompletionCycle
 * and allows the new index (with moduleCompletionCycle) to be created automatically
 * by Mongoose on the next server start.
 * 
 * Run with: node migrations/fix-videowatchprogress-index.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('videowatchprogresses');

        // List all indexes
        const indexes = await collection.indexes();
        console.log('\n📋 Current indexes:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });

        // Try to drop old unique index
        const oldIndexName = 'user_1_video_1_module_1';
        try {
            await collection.dropIndex(oldIndexName);
            console.log(`\n✅ Dropped old unique index: ${oldIndexName}`);
        } catch (err) {
            if (err.code === 27 || err.codeName === 'IndexNotFound') {
                console.log(`\nℹ️  Old index '${oldIndexName}' does not exist, skipping`);
            } else {
                throw err;
            }
        }

        // The new index will be created automatically by Mongoose on next query
        console.log('\n✅ Migration complete!');
        console.log('📝 Note: New unique index (user_1_video_1_module_1_moduleCompletionCycle_1)');
        console.log('   will be created automatically by Mongoose on next server start.');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run migration
migrate();

