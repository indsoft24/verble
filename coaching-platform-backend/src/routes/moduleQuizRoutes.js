// src/routes/moduleQuizRoutes.js
import express from 'express';
import {
    getModuleQuiz,
    submitModuleQuiz,
    getQuizSubmission,
    getModuleCompletion,
    getModuleQuizAvailability,
} from '../controllers/moduleQuizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:moduleId/availability', protect, getModuleQuizAvailability);
router.get('/:moduleId/completion', protect, getModuleCompletion);
router.get('/:moduleId/submission/:submissionId', protect, getQuizSubmission);
router.post('/:moduleId/submit', protect, submitModuleQuiz);
router.get('/:moduleId', protect, getModuleQuiz);

export default router;
