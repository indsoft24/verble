// src/routes/lyricsSubmissionRoutes.js
import express from 'express';
import { submitLyricsSentences, getUserLyricsSubmission } from '../controllers/lyricsSubmissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', submitLyricsSentences);
router.get('/:lyricsId', getUserLyricsSubmission);

export default router;
