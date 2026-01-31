import express from 'express';
import { subscribeToPlan, getMySubscription } from '../controllers/subscriptionController.js';
import { checkMySubscriptionExpiration, updateMyUnlockedLevels } from '../controllers/subscriptionExpirationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); 
// POST /api/subscriptions/subscribe/:planId
router.post('/subscribe/:planId', subscribeToPlan);

// GET /api/subscriptions/my-subscription
router.get('/my-subscription', getMySubscription);

// POST /api/subscriptions/check-my-expiration
router.post('/check-my-expiration', checkMySubscriptionExpiration);

// POST /api/subscriptions/update-levels
router.post('/update-levels', updateMyUnlockedLevels);

export default router;
