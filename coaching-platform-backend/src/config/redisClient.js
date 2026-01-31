import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config({ path: process.cwd() + '/.env' });

// Default to localhost for local development, use REDIS_URL env var for Docker/production
// If REDIS_URL contains 'redis:' (Docker hostname) and we're not in Docker, fallback to localhost
let redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
if (redisUrl.includes('redis://redis:') && !process.env.DOCKER_ENV) {
    console.warn('[Redis] Detected Docker hostname but not in Docker environment. Using localhost instead.');
    redisUrl = 'redis://localhost:6379';
}
console.log(`[Redis] Attempting to connect to Redis at: ${redisUrl}`);

const redisClient = createClient({
    url: redisUrl,
});

redisClient.on('connect', () => {
    console.log('[Redis] Client connecting to Redis...');
});

redisClient.on('ready', () => {
    console.log('[Redis] Client connected to Redis and ready to use.');
});

redisClient.on('error', (err) => {
    // Only log errors, don't crash the app - Redis is optional for session management
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        console.warn(`[Redis] Connection failed at ${redisUrl}. Redis is optional - app will continue without session management.`);
        console.warn(`[Redis] To fix: Start Redis server or set REDIS_URL in .env file.`);
    } else {
        console.error('[Redis] Client Error:', err.message);
    }
});

redisClient.on('end', () => {
    console.log('[Redis] Client disconnected from Redis.');
});

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        try {
            await redisClient.connect();
            console.log('[Redis] Successfully connected to Redis');
        } catch (err) {
            // Redis is optional - don't crash the app if it's not available
            console.warn('[Redis] Failed to connect to Redis. App will continue without session management.');
            console.warn('[Redis] This is OK for development. For production, ensure Redis is running.');
        }
    }
};

// Connect to Redis, but don't block app startup if it fails
connectRedis().catch(() => {
    // Silently handle - Redis is optional
});


export default redisClient;