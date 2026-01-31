// src/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // In Docker, prioritize MONGODB_URI_DOCKER (uses service name 'mongo')
        // Otherwise use MONGODB_URI (for local development)
        const mongoURI = process.env.DOCKER_ENV 
            ? (process.env.MONGODB_URI_DOCKER || process.env.MONGODB_URI)
            : (process.env.MONGODB_URI || process.env.MONGODB_URI_DOCKER);
        if (!mongoURI) {
            throw new Error('MongoDB URI not found. Please set MONGODB_URI in your .env file for local development, or MONGODB_URI_DOCKER for Docker.');
        }
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

export default connectDB;