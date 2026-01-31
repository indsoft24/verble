import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
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

// Compression middleware - compress all responses
app.use(compression());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

