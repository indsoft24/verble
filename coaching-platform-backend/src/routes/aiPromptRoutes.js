// src/routes/aiPromptRoutes.js
import express from 'express';
import {
    getAllPrompts,
    getTopics,
    incrementUsage,
    createPrompt,
    updatePrompt,
    deletePrompt,
} from '../controllers/aiPromptController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (for logged-in users)
router.get('/', protect, getAllPrompts);
router.get('/topics', protect, getTopics);
router.post('/:id/increment-usage', protect, incrementUsage);

// Admin routes
router.post('/', protect, restrictTo('admin'), createPrompt);
router.put('/:id', protect, restrictTo('admin'), updatePrompt);
router.delete('/:id', protect, restrictTo('admin'), deletePrompt);

export default router;
