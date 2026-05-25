// src/routes/dailyContentAdminRoutes.js
import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
    getAllDailyContentAdmin,
    createDailyContentAdmin,
    bulkCreateDailyContentAdmin,
    updateDailyContentAdmin,
    deleteDailyContentAdmin,
    uploadDailyContentImageAdmin,
} from '../controllers/dailyContentAdminController.js';
import uploadBlogImage from '../middleware/uploadBlogImageMiddleware.js';
import multerErrorHandler from '../middleware/multerErrorHandler.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(restrictTo('admin'));

// GET /api/admin/daily-content - Get all daily content
router.get('/', getAllDailyContentAdmin);

// POST /api/admin/daily-content/bulk - Bulk create (must be before /:id if ever added under POST)
router.post('/bulk', bulkCreateDailyContentAdmin);

router.post(
    '/upload-image',
    uploadBlogImage.single('image'),
    multerErrorHandler,
    uploadDailyContentImageAdmin
);

// POST /api/admin/daily-content - Create new daily content
router.post('/', createDailyContentAdmin);

// PATCH /api/admin/daily-content/:id - Update daily content
router.patch('/:id', updateDailyContentAdmin);

// DELETE /api/admin/daily-content/:id - Delete daily content
router.delete('/:id', deleteDailyContentAdmin);

export default router;
