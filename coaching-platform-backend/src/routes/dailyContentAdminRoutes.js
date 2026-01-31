// src/routes/dailyContentAdminRoutes.js
import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
    getAllDailyContentAdmin,
    createDailyContentAdmin,
    updateDailyContentAdmin,
    deleteDailyContentAdmin
} from '../controllers/dailyContentAdminController.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(restrictTo('admin'));

// GET /api/admin/daily-content - Get all daily content
router.get('/', getAllDailyContentAdmin);

// POST /api/admin/daily-content - Create new daily content
router.post('/', createDailyContentAdmin);

// PATCH /api/admin/daily-content/:id - Update daily content
router.patch('/:id', updateDailyContentAdmin);

// DELETE /api/admin/daily-content/:id - Delete daily content
router.delete('/:id', deleteDailyContentAdmin);

export default router;
