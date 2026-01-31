import express from 'express';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getUserNotifications)
    .delete(deleteAllNotifications);

router.route('/mark-all-read')
    .post(markAllNotificationsAsRead);

router.route('/:id/read')
    .post(markNotificationAsRead);

router.route('/:id')
    .delete(deleteNotification);

export default router;