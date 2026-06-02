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
import {
    getLearningSettings,
    patchLearningSettings,
    getUserLearningOverride,
    putUserLearningOverride,
    postUserLearningReset,
} from '../controllers/adminLearningSettingsController.js';
import {
    getAdminScoringUsers,
    getAdminUserScoringSummary,
    getAdminUserScoringHistory,
} from '../controllers/scoringHistoryController.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getPlatformStats);
router.get('/scoring/users', getAdminScoringUsers);
router.get('/users', getAllUsers);
router.get('/users/:userId/scoring-summary', getAdminUserScoringSummary);
router.get('/users/:userId/scoring-history', getAdminUserScoringHistory);
router.get('/users/:userId', getUserById);
router.post('/users', createUserByAdmin);
router.post('/users/:userId/resend-login-pin', resendLoginPinForUser);
router.patch('/users/:userId', updateUserInfo);
router.patch('/users/:userId/update-role', updateUserRole);
router.patch('/users/:userId/password', updateUserPassword);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/subscriptions', addSubscriptionToUser);
router.delete('/users/:userId/subscriptions/:subscriptionInstanceId', removeSubscriptionFromUser);

router.get('/learning-settings', getLearningSettings);
router.patch('/learning-settings', patchLearningSettings);
router.get('/users/:userId/learning-override', getUserLearningOverride);
router.put('/users/:userId/learning-override', putUserLearningOverride);
router.post('/users/:userId/learning-reset', postUserLearningReset);

export default router;
