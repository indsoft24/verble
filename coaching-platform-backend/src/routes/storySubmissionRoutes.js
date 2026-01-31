// src/routes/storySubmissionRoutes.js
import express from 'express';
import { submitStorySummary, getUserStorySubmission } from '../controllers/storySubmissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', submitStorySummary);
router.get('/:storyId', getUserStorySubmission);

export default router;
