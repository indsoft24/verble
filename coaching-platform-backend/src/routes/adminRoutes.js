// src/routes/adminRoutes.js
import express from 'express';
import { triggerExpirationCheckAdmin } from '../controllers/subscriptionExpirationController.js';
import {
    getAllUsers,
    createUserByAdmin,
    updateUserRoleByAdmin,
    updateUserInfoByAdmin,
    updateUserPasswordByAdmin,
    deleteUserByAdmin,
    adminAddUserSubscription,       
    adminRemoveUserSubscriptionInstance, 
    getUserByIdForAdmin,
    getPlatformStats,
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();


// All routes below are protected and restricted to 'admin'
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getPlatformStats);

// User management routes
router.post('/users', createUserByAdmin);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserByIdForAdmin);
router.patch('/users/:userId', updateUserInfoByAdmin);
router.patch('/users/:userId/password', updateUserPasswordByAdmin);
router.patch('/users/:userId/update-role', updateUserRoleByAdmin);
router.delete('/users/:userId', deleteUserByAdmin);

// Admin managing specific user's subscriptions
router.post('/users/:userId/subscriptions', adminAddUserSubscription); 
router.delete('/users/:userId/subscriptions/:subscriptionInstanceId', adminRemoveUserSubscriptionInstance);

// Subscription expiration management
router.post('/subscriptions/check-expiration', triggerExpirationCheckAdmin);

export default router;