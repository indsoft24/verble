// src/routes/dailyNotificationAdminRoutes.js
import express from 'express';
import {
    triggerDailyNotificationsAdmin,
    triggerPuzzleTaskNotificationsAdmin,
    triggerChallengeRemindersAdmin
} from '../controllers/dailyNotificationController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(restrictTo('admin'));

router.post('/trigger-daily', triggerDailyNotificationsAdmin);
router.post('/trigger-puzzle-tasks', triggerPuzzleTaskNotificationsAdmin);
router.post('/trigger-reminders', triggerChallengeRemindersAdmin);

export default router;
