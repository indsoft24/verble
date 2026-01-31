// src/routes/moduleQuizRoutes.js
import express from 'express';
import {
    getModuleQuiz,
    submitModuleQuiz,
    getQuizSubmission,
    getModuleCompletion,
} from '../controllers/moduleQuizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:moduleId', protect, getModuleQuiz);
router.post('/:moduleId/submit', protect, submitModuleQuiz);
router.get('/:moduleId/submission/:submissionId', protect, getQuizSubmission);
router.get('/:moduleId/completion', protect, getModuleCompletion);

export default router;
