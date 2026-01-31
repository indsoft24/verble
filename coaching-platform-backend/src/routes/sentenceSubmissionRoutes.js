// src/routes/sentenceSubmissionRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { submitSentence, getUserSubmissions } from '../controllers/sentenceSubmissionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /api/submit-sentence - Submit a sentence
router.post('/', submitSentence);

// GET /api/submit-sentence/:wordId - Get user's submissions for a word
router.get('/:wordId', getUserSubmissions);

export default router;
