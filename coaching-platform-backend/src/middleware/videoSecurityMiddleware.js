/**
 * Video Security Middleware
 * Prevents unauthorized video downloads and enforces streaming-only access
 */

/**
 * Validates referrer to ensure requests come from authorized domains
 * Only applies to video token endpoints, allows authenticated mobile apps
 */
export const validateReferrer = (req, res, next) => {
    // Skip referrer check for:
    // - Webhooks
    // - Admin routes
    // - Auth routes
    // - Non-video endpoints
    if (req.path.includes('/webhook') || 
        req.path.includes('/api/admin') || 
        req.path.includes('/api/auth') ||
        req.path.includes('/api/public') ||
        !req.path.includes('/get-play-token')) {
        return next();
    }

    // Check if request has Authorization header (authenticated request)
    // This works even before the protect middleware runs
    const authHeader = req.headers.authorization;
    const hasAuthToken = authHeader && authHeader.startsWith('Bearer ');
    
    // For authenticated users (mobile apps), allow without referrer
    // Mobile apps don't send referrer headers, but they send Authorization headers
    if (hasAuthToken) {
        // Allowing authenticated request without referrer
        return next();
    }

    const referer = req.get('referer') || req.get('referrer');
    const origin = req.get('origin');
    
    // Get allowed domains from environment
    const allowedDomains = process.env.ALLOWED_VIDEO_DOMAINS 
        ? process.env.ALLOWED_VIDEO_DOMAINS.split(',').map(d => d.trim())
        : ['localhost', '127.0.0.1'];
    
    // For video token requests from web, check referrer/origin
    const requestOrigin = origin || (referer ? new URL(referer).origin : null);
    
    // If no origin/referrer and not authenticated, block (likely a bot)
    if (!requestOrigin) {
        // No referrer/origin for unauthenticated request
        return res.status(403).json({
            status: 'error',
            message: 'Unauthorized access. Please login or use an authorized client.'
        });
    }
    
    if (requestOrigin) {
        const isAllowed = allowedDomains.some(domain => {
            const domainLower = domain.toLowerCase();
            const originLower = requestOrigin.toLowerCase();
            return originLower.includes(domainLower) || 
                   originLower === `http://${domainLower}` || 
                   originLower === `https://${domainLower}` ||
                   originLower === `http://${domainLower}:5173` ||
                   originLower === `http://${domainLower}:3000`;
        });
        
        if (!isAllowed) {
            // Unauthorized referrer blocked
            return res.status(403).json({
                status: 'error',
                message: 'Unauthorized access. Requests must come from authorized domains.'
            });
        }
    }
    
    next();
};

/**
 * Validates user agent to block download tools and bots
 * Only applies to video playback endpoints, allows mobile apps and admin routes
 */
export const validateUserAgent = (req, res, next) => {
    // Skip user agent check for:
    // - Admin routes
    // - Auth routes
    // - Webhooks
    // - Non-video endpoints
    if (req.path.includes('/api/admin') || 
        req.path.includes('/api/auth') ||
        req.path.includes('/webhook') ||
        (!req.path.includes('/get-play-token') && 
         !req.path.includes('/player') && 
         !req.path.includes('/stream'))) {
        return next();
    }
    
    const userAgent = req.get('user-agent') || '';
    const userAgentLower = userAgent.toLowerCase();
    
    // Check if request has Authorization header (authenticated request)
    // Authenticated mobile apps should be allowed regardless of user agent
    const authHeader = req.headers.authorization;
    const hasAuthToken = authHeader && authHeader.startsWith('Bearer ');
    
    // Allow mobile app user agents (Android, iOS)
    const allowedMobileAgents = [
        'okhttp',           // Android HTTP client
        'retrofit',         // Android HTTP client
        'android',          // Android apps
        'ios',              // iOS apps
        'iphone',           // iPhone
        'ipad',             // iPad
        'mobile',           // Mobile browsers
        'mozilla',          // Browsers (includes mobile)
        'chrome',           // Chrome browser
        'safari',           // Safari browser
        'firefox',          // Firefox browser
        'edge',             // Edge browser
    ];
    
    // Check if it's a mobile app or browser
    const isAllowedClient = allowedMobileAgents.some(allowed => userAgentLower.includes(allowed));
    
    // Allow if it's an authenticated request OR if it's an allowed client
    if (hasAuthToken || isAllowedClient) {
        if (hasAuthToken) {
            // Allowing authenticated request
        }
        return next();
    }
    
    // Block known download tools and suspicious user agents
    const blockedAgents = [
        'wget',
        'curl',
        'python-requests',
        'go-http-client',
        'apache-httpclient',
        'postman',
        'insomnia',
        'httpie',
        'downloader',
        'scraper',
        'bot',
        'crawler',
        'spider',
    ];
    
    // Only check for specific video playback endpoints
    if (req.path.includes('/get-play-token') || 
        req.path.includes('/player') || 
        req.path.includes('/stream')) {
        
        const isBlocked = blockedAgents.some(blocked => userAgentLower.includes(blocked));
        
        if (isBlocked) {
            // Blocked suspicious user agent
            return res.status(403).json({
                status: 'error',
                message: 'Unauthorized client. Please use a web browser or mobile app.'
            });
        }
    }
    
    next();
};

/**
 * Rate limiting for video token generation
 * Prevents abuse and token harvesting
 */
const tokenRequestCounts = new Map();

export const rateLimitTokenGeneration = (req, res, next) => {
    // Skip rate limiting for admin routes and non-token endpoints
    if (!req.path.includes('/get-play-token') || req.path.includes('/api/admin')) {
        return next();
    }
    
    const userId = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // Max 10 tokens per minute per user
    
    const userRequests = tokenRequestCounts.get(userId) || [];
    
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        // Rate limit exceeded
        return res.status(429).json({
            status: 'error',
            message: 'Too many token requests. Please wait before requesting again.'
        });
    }
    
    // Add current request
    recentRequests.push(now);
    tokenRequestCounts.set(userId, recentRequests);
    
    // Clean up old entries periodically (every 5 minutes)
    if (Math.random() < 0.01) { // 1% chance on each request
        const cutoff = now - (5 * 60 * 1000);
        for (const [key, requests] of tokenRequestCounts.entries()) {
            const filtered = requests.filter(timestamp => timestamp > cutoff);
            if (filtered.length === 0) {
                tokenRequestCounts.delete(key);
            } else {
                tokenRequestCounts.set(key, filtered);
            }
        }
    }
    
    next();
};

/**
 * Adds security headers specifically for video responses
 * Only applies to actual video playback endpoints, not admin or listing endpoints
 */
export const videoSecurityHeaders = (req, res, next) => {
    // Only apply to actual video playback endpoints, not admin routes or video listings
    const isVideoPlaybackEndpoint = (
        req.path.includes('/get-play-token') || 
        req.path.includes('/player') || 
        req.path.includes('/stream')
    ) && !req.path.includes('/api/admin');
    
    if (isVideoPlaybackEndpoint) {
        // Prevent caching of video tokens
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Prevent embedding in unauthorized sites
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        
        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Content Security Policy for video
        res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; media-src 'self' https://*.mediadelivery.net https://*.bunny.net https://*.b-cdn.net; script-src 'self' 'unsafe-inline'; frame-src 'self' https://*.mediadelivery.net;"
        );
    }
    
    next();
};

/**
 * Validates video token before serving video
 * Only applies to actual video playback endpoints
 */
export const validateVideoToken = (req, res, next) => {
    // Skip validation for admin routes and non-playback endpoints
    if (req.path.includes('/api/admin') || 
        (!req.path.includes('/player') && !req.path.includes('/stream'))) {
        return next();
    }
    
    // This middleware validates tokens passed in query params
    // The actual token validation happens in Bunny Stream, but we can do basic checks
    const { token, expires } = req.query;
    
    if (!token || !expires) {
        return res.status(400).json({
            status: 'error',
            message: 'Token and expiration are required.'
        });
    }
    
    // Check if token has expired
    const expiresTimestamp = parseInt(expires, 10);
    const now = Math.floor(Date.now() / 1000);
    
    if (expiresTimestamp < now) {
        return res.status(403).json({
            status: 'error',
            message: 'Token has expired. Please request a new token.'
        });
    }
    
    // Validate token format (should be hex string)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid token format.'
        });
    }
    
    next();
};

