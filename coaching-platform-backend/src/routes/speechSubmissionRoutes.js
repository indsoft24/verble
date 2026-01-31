// src/routes/speechSubmissionRoutes.js
import express from 'express';
import { submitSpeechDescription, getUserSpeechSubmission } from '../controllers/speechSubmissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', submitSpeechDescription);
router.get('/:speechId', getUserSpeechSubmission);

export default router;
