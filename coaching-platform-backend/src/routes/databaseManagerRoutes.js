import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
    createDocument,
    deleteDocument,
    getAuditLogs,
    getCollectionDocuments,
    getCollections,
    updateDocument,
} from '../controllers/databaseManagerController.js';
import { parseEnvList } from '../utils/databaseManagerUtils.js';

const router = express.Router();

const rateLimitStore = new Map();

const enforceDatabaseManagerAccess = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ status: 'fail', message: 'Only admins can access this module.' });
    }

    const allowedEmails = parseEnvList(process.env.DB_MANAGER_ALLOWED_EMAILS || '');
    if (allowedEmails.length > 0) {
        const userEmail = (req.user.email || '').toLowerCase();
        const matches = allowedEmails.some((email) => email.toLowerCase() === userEmail);
        if (!matches) {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to use Database Manager.',
            });
        }
    }
    next();
};

const rateLimitDatabaseManager = (req, res, next) => {
    const key = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 180;

    const current = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > current.resetAt) {
        current.count = 0;
        current.resetAt = now + windowMs;
    }
    current.count += 1;
    rateLimitStore.set(key, current);

    if (current.count > maxRequests) {
        return res.status(429).json({
            status: 'fail',
            message: 'Rate limit exceeded for Database Manager.',
        });
    }
    next();
};

router.use(protect);
router.use(restrictTo('admin'));
router.use(enforceDatabaseManagerAccess);
router.use(rateLimitDatabaseManager);

router.get('/collections', getCollections);
router.get('/collections/:collectionName/documents', getCollectionDocuments);
router.post('/collections/:collectionName/documents', createDocument);
router.put('/collections/:collectionName/documents/:documentId', updateDocument);
router.delete('/collections/:collectionName/documents/:documentId', deleteDocument);
router.get('/audit-logs', getAuditLogs);

export default router;
