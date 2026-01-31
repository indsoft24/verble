// src/routes/vocabSubmissionRoutes.js
import express from 'express';
import { submitVocabSentences, getUserVocabSubmission } from '../controllers/vocabSubmissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', submitVocabSentences);
router.get('/:vocabSetId', getUserVocabSubmission);

export default router;
