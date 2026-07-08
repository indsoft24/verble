import express from 'express';
import {
    createWebinarPaymentOrder,
    getWebinarBySlugForUsers,
    getWebinarJoinAccess,
    listWebinarsForUsers,
    registerForWebinar,
    verifyWebinarPayment,
    webinarJoinRedirect,
} from '../controllers/webinarController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', listWebinarsForUsers);
router.get('/slug/:slug', optionalAuth, getWebinarBySlugForUsers);
router.post('/:webinarId/register', protect, registerForWebinar);
router.post('/:webinarId/payment-order', protect, createWebinarPaymentOrder);
router.post('/:webinarId/verify-payment', protect, verifyWebinarPayment);
router.get('/:webinarId/join-access', protect, getWebinarJoinAccess);
router.get('/:webinarId/join-redirect', protect, webinarJoinRedirect);

export default router;

