// src/routes/userRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
    getMyUserProfile, 
    updateMyProfileDetails,
    updateMyPasswordDetails,
    getMyAccessibleCourses,
    getUserProfile,
    requestAccountDeletion
} from '../controllers/userController.js';
const router = express.Router();

router.post('/request-account-deletion', requestAccountDeletion);

router.use(protect); 

// GET /api/users/me - Get current logged-in user's details
router.get('/me', getMyUserProfile);

router.get('/profile', getUserProfile);

// PATCH /api/users/me/update-profile - Update current user's profile (name, phoneNumber)
router.patch('/me/update-profile', updateMyProfileDetails);

// PATCH /api/users/me/update-password - Update current user's password
router.patch('/me/update-password', updateMyPasswordDetails);

router.get('/me/accessible-courses', getMyAccessibleCourses);



export default router;