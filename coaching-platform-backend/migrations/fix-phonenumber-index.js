/**
 * Migration Script: Fix User phoneNumber Unique Index
 * 
 * This script drops the old non-sparse unique index on phoneNumber
 * and allows the new sparse unique index to be created automatically
 * by Mongoose on the next server start.
 * 
 * The issue: Multiple users with phoneNumber: null were causing duplicate key errors
 * because the old index treated null values as duplicates.
 * 
 * Solution: Make the index sparse so null values are ignored in uniqueness checks.
 * 
 * Run with: node migrations/fix-phonenumber-index.js
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
        const collection = db.collection('users');

        // List all indexes
        const indexes = await collection.indexes();
        console.log('\n📋 Current indexes on users collection:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique || false}, sparse: ${index.sparse || false})`);
        });

        // Try to drop old non-sparse unique index on phoneNumber
        const oldIndexName = 'phoneNumber_1';
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

        // Create new sparse unique index
        try {
            await collection.createIndex(
                { phoneNumber: 1 },
                { 
                    unique: true, 
                    sparse: true,
                    name: 'phoneNumber_1'
                }
            );
            console.log('\n✅ Created new sparse unique index on phoneNumber');
        } catch (err) {
            if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
                console.log('\nℹ️  Index already exists with correct options, skipping');
            } else {
                throw err;
            }
        }

        // Verify the new index
        const updatedIndexes = await collection.indexes();
        const phoneNumberIndex = updatedIndexes.find(idx => idx.name === 'phoneNumber_1');
        if (phoneNumberIndex) {
            console.log('\n📋 Updated phoneNumber index:');
            console.log(`  - Name: ${phoneNumberIndex.name}`);
            console.log(`  - Unique: ${phoneNumberIndex.unique || false}`);
            console.log(`  - Sparse: ${phoneNumberIndex.sparse || false}`);
        }

        console.log('\n✅ Migration complete!');
        console.log('📝 Note: Users with phoneNumber: null will no longer cause duplicate key errors.');

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

