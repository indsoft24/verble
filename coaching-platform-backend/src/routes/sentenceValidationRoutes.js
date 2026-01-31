// src/routes/sentenceValidationRoutes.js
import express from 'express';
import {
    validateSentenceSubmission,
    validateStorySentences,
    getPendingSubmissions,
    getAllSubmissions,
} from '../controllers/sentenceValidationController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/:submissionId', protect, restrictTo('admin'), validateSentenceSubmission);
router.put('/story/:submissionId/sentences', protect, restrictTo('admin'), validateStorySentences);
router.get('/pending', protect, restrictTo('admin'), getPendingSubmissions);
router.get('/all', protect, restrictTo('admin'), getAllSubmissions);

export default router;
