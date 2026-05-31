// src/routes/sentenceValidationRoutes.js
import express from 'express';
import {
    validateSentenceSubmission,
    validateStorySentences,
    validateVocabSentences,
    getPendingSubmissions,
    getAllSubmissions,
} from '../controllers/sentenceValidationController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/vocab/:submissionId/sentences', protect, restrictTo('admin'), validateVocabSentences);
router.put('/story/:submissionId/sentences', protect, restrictTo('admin'), validateStorySentences);
router.put('/:submissionId', protect, restrictTo('admin'), validateSentenceSubmission);
router.get('/pending', protect, restrictTo('admin'), getPendingSubmissions);
router.get('/all', protect, restrictTo('admin'), getAllSubmissions);

export default router;
