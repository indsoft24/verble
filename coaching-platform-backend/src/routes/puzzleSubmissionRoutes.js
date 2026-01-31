// src/routes/puzzleSubmissionRoutes.js
import express from 'express';
import { submitPuzzle, getUserPuzzleSubmission } from '../controllers/puzzleSubmissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', submitPuzzle);
router.get('/:puzzleId', getUserPuzzleSubmission);

export default router;
