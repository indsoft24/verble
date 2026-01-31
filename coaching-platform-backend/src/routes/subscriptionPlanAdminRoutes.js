// File: src/routes/subscriptionPlanAdminRoutes.js

import express from 'express';
import {
    createSubscriptionPlan,
    getAllSubscriptionPlansAdmin,
    getSubscriptionPlanByIdAdmin,
    updateSubscriptionPlanAdmin,
    deleteSubscriptionPlanAdmin
} from '../controllers/subscriptionPlanAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import uploadImage from '../middleware/uploadImageMemoryMiddleware.js';
import multerErrorHandler from '../middleware/multerErrorHandler.js';

const router = express.Router();

// Apply admin protection to all routes in this file
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
    .post(uploadImage.single('image'), multerErrorHandler, createSubscriptionPlan)    // POST /api/admin/subscription-plans
    .get(getAllSubscriptionPlansAdmin); // GET /api/admin/subscription-plans

router.route('/:id')
    .get(getSubscriptionPlanByIdAdmin)    // GET /api/admin/subscription-plans/:id
    .patch(uploadImage.single('image'), multerErrorHandler, updateSubscriptionPlanAdmin)  // PATCH /api/admin/subscription-plans/:id
    .delete(deleteSubscriptionPlanAdmin); // DELETE /api/admin/subscription-plans/:id

export default router;