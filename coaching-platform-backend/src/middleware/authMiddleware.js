import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import redisClient from '../config/redisClient.js';

const SESSION_PREFIX = 'session:user:'; 

export const protect = async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ status: 'fail', message: 'Not authorized, no token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const currentUser = await User.findById(decoded.id).select('-password');
        if (!currentUser) {
            return res.status(401).json({ status: 'fail', message: 'The user belonging to this token no longer exists.' });
        }

        // Check session in Redis
        if (!redisClient.isOpen) {
            console.warn('[Protect Middleware] Redis client not connected. Session check cannot be performed.');
        } else {
            const redisKey = `${SESSION_PREFIX}${currentUser._id.toString()}`;
            let storedSessionId = null;
            try {
                storedSessionId = await Promise.race([
                    redisClient.get(redisKey),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Redis session lookup timed out')), 3000)
                    ),
                ]);
            } catch (redisErr) {
                console.warn('[Protect Middleware] Redis session check skipped:', redisErr.message);
                req.user = currentUser;
                req.token = token;
                return next();
            }

            if (!decoded.sessionId) {
                console.warn(`[Protect Middleware] JWT for user ${currentUser._id} is missing sessionId payload.`);
                return res.status(401).json({ status: 'fail', message: 'Session information missing from token.' });
            }

            if (storedSessionId !== decoded.sessionId) {
                return res.status(401).json({ 
                    status: 'fail', 
                    message: 'Session expired or invalid. You might have logged in on another device.' 
                });
            }
        }

        req.user = currentUser;
        req.token = token; 
        next();
    } catch (error) {
        console.error("[Protect Middleware] Authentication Error:", error.name, error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'fail', message: 'Your session has expired. Please log in again.' });
        }
        return res.status(401).json({ status: 'fail', message: 'Not authorized.' }); 
    }
};

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'You do not have permission to perform this action.',
            });
        }
        next();
    };
};