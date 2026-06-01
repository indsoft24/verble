// src/routes/sentenceValidationRoutes.js
import express from 'express';
import {
    validateSentenceSubmission,
    validateStorySentences,
    validateVocabSentences,
    validateConversationPractice,
    validateSceneSubmission,
    validateSceneSummaries,
    validateSpeechSummaries,
    validateSceneQuestions,
    getPendingSubmissions,
    getAllSubmissions,
} from '../controllers/sentenceValidationController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/scene/:submissionId/score', protect, restrictTo('admin'), validateSceneSubmission);
router.put('/scene/:submissionId/sentences', protect, restrictTo('admin'), validateSceneSummaries);
router.put('/scene/:submissionId/questions', protect, restrictTo('admin'), validateSceneQuestions);
router.put('/speech/:submissionId/sentences', protect, restrictTo('admin'), validateSpeechSummaries);
router.put('/vocab/:submissionId/sentences', protect, restrictTo('admin'), validateVocabSentences);
router.put('/conversation/:submissionId', protect, restrictTo('admin'), validateConversationPractice);
router.put('/story/:submissionId/sentences', protect, restrictTo('admin'), validateStorySentences);
router.put('/:submissionId', protect, restrictTo('admin'), validateSentenceSubmission);
router.get('/pending', protect, restrictTo('admin'), getPendingSubmissions);
router.get('/all', protect, restrictTo('admin'), getAllSubmissions);

export default router;
