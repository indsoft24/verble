import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path'; // Import the path module
import { fileURLToPath } from 'url';
import BlogPost from './src/models/BlogPost.js'; 

// --- CORRECTED: Explicitly define the path to the .env file ---
// This ensures the script can find the environment variables regardless of where it's run from.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
// ----------------------------------------------------------------

// Now, the rest of the script will work correctly as process.env is populated.
const BUNNY_STORAGE_HOSTNAME = process.env.BUNNY_STORAGE_HOSTNAME;
const BUNNY_STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME;
const BUNNY_STORAGE_ACCESS_KEY = process.env.BUNNY_STORAGE_ACCESS_KEY;
const DATABASE_URI = process.env.MONGO_URI;

const listFilesInBunnyStorage = async () => {
    console.log('Fetching file list from Bunny Storage...');
    const url = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE_NAME}/blog_content_images/`;
    try {
        const response = await axios.get(url, {
            headers: { 'AccessKey': BUNNY_STORAGE_ACCESS_KEY },
        });
        return response.data
            .filter(item => !item.IsDirectory)
            .map(item => item.ObjectName);
    } catch (error) {
        console.error(`Error fetching file list from Bunny Storage: ${error.response?.data?.Message || error.message}`);
        throw error;
    }
};

const getAllBlogContent = async () => {
    console.log('Fetching all blog post content from the database...');
    const posts = await BlogPost.find({}).select('content').lean();
    return posts.map(post => post.content).join('');
};

const deleteFilesFromBunnyStorage = async (filesToDelete) => {
    if (filesToDelete.length === 0) {
        console.log('No orphaned files to delete.');
        return;
    }
    console.log(`Preparing to delete ${filesToDelete.length} orphaned files...`);

    for (const filename of filesToDelete) {
        const url = `https://${BUNNY_STORAGE_HOSTNAME}/${BUNNY_STORAGE_ZONE_NAME}/blog_content_images/${filename}`;
        try {
            await axios.delete(url, {
                headers: { 'AccessKey': BUNNY_STORAGE_ACCESS_KEY },
            });
            console.log(`  - DELETED: ${filename}`);
        } catch (error) {
            console.error(`  - FAILED to delete ${filename}: ${error.response?.data?.Message || error.message}`);
        }
    }
};

const runCleanup = async () => {
    console.log('--- Starting Orphaned Image Cleanup Script ---');
    try {
        const allImageFiles = await listFilesInBunnyStorage();
        console.log(`Found ${allImageFiles.length} total files in 'blog_content_images'.`);

        const allContent = await getAllBlogContent();
        console.log('Identifying orphaned files...');
        const orphanedFiles = allImageFiles.filter(filename => !allContent.includes(filename));
        
        await deleteFilesFromBunnyStorage(orphanedFiles);

    } catch (error) {
        console.error('An error occurred during the cleanup process. Aborting.');
    } finally {
        console.log('--- Cleanup Script Finished ---');
    }
};

const execute = async () => {
    if (!BUNNY_STORAGE_ACCESS_KEY || !DATABASE_URI) {
        console.error('Error: Missing required environment variables. Check that your .env file is correct.');
        return;
    }

    await mongoose.connect(DATABASE_URI);
    console.log('Database connected successfully.');

    await runCleanup();

    await mongoose.connection.close();
    console.log('Database connection closed.');
};

execute();
