import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
    getPlatformStats,
    getAllUsers,
    getUserById,
    createUserByAdmin,
    updateUserInfo,
    updateUserRole,
    updateUserPassword,
    deleteUser,
    addSubscriptionToUser,
    removeSubscriptionFromUser,
    resendLoginPinForUser,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.post('/users', createUserByAdmin);
router.post('/users/:userId/resend-login-pin', resendLoginPinForUser);
router.patch('/users/:userId', updateUserInfo);
router.patch('/users/:userId/update-role', updateUserRole);
router.patch('/users/:userId/password', updateUserPassword);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/subscriptions', addSubscriptionToUser);
router.delete('/users/:userId/subscriptions/:subscriptionInstanceId', removeSubscriptionFromUser);

export default router;
