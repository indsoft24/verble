import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { ensureVideoStorageDirs } from './config/videoStorageConfig.js';
import mainApiRoutes from './routes/index.js';
import { 
    securityHeaders, 
    sanitizeResponse, 
    errorHandler, 
    notFoundHandler 
} from './middleware/securityMiddleware.js';
import {
    validateReferrer,
    validateUserAgent,
    rateLimitTokenGeneration,
    videoSecurityHeaders,
    validateVideoToken
} from './middleware/videoSecurityMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers - must be applied early
app.use(securityHeaders);

// Video-specific security headers
app.use(videoSecurityHeaders);

// CORS configuration
app.use(cors({ origin: '*' }));

// Compression — skip video upload routes (large binary bodies)
app.use(
    compression({
        filter: (req, res) => {
            const p = req.path || '';
            if (p.includes('/upload-file') || p.includes('/upload-chunk')) {
                return false;
            }
            return compression.filter(req, res);
        },
    })
);

// Body parsing — raised for bulk daily-content imports (chunked on client; safety net here)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Video security middleware - validate referrer, user agent, rate limiting
app.use(validateReferrer);
app.use(validateUserAgent);
app.use(rateLimitTokenGeneration);
app.use(validateVideoToken);

// Response sanitization - removes sensitive data from all responses
app.use(sanitizeResponse);

// API routes
app.use('/api', mainApiRoutes);

// Static files
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/', (req, res) => {
    res.send('Verble Backend is Alive!');
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

connectDB().then(async () => {
    try {
        await ensureVideoStorageDirs();
    } catch (e) {
        console.error('[Server] Could not create video storage directories:', e.message);
    }
    // Start daily notification scheduler after DB connection
    if (process.env.ENABLE_DAILY_NOTIFICATIONS !== 'false') {
        try {
            const { startDailyNotificationScheduler } = await import('./utils/dailyNotificationScheduler.js');
            startDailyNotificationScheduler();
        } catch (error) {
            console.error('[Server] Failed to start daily notification scheduler:', error);
            console.error('[Server] Make sure node-cron is installed: npm install node-cron');
        }
    } else {
        console.log('[Server] Daily notifications are disabled (ENABLE_DAILY_NOTIFICATIONS=false)');
    }

    // Start subscription expiration scheduler after DB connection
    if (process.env.ENABLE_SUBSCRIPTION_EXPIRATION_CHECK !== 'false') {
        try {
            const { startSubscriptionExpirationScheduler } = await import('./utils/subscriptionExpirationScheduler.js');
            startSubscriptionExpirationScheduler();
        } catch (error) {
            console.error('[Server] Failed to start subscription expiration scheduler:', error);
            console.error('[Server] Make sure node-cron is installed: npm install node-cron');
        }
    } else {
        console.log('[Server] Subscription expiration check is disabled (ENABLE_SUBSCRIPTION_EXPIRATION_CHECK=false)');
    }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Allow multi-hour uploads (chunked or single); default Node timeouts can drop slow clients.
server.timeout = 0;
server.requestTimeout = 0;
server.keepAliveTimeout = 120_000;
server.headersTimeout = 125_000;

