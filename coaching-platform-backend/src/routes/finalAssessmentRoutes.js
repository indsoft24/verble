import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { certificationRateLimit } from '../middleware/certificationRateLimit.js';
import {
    autosave,
    getAvailability,
    getHistory,
    getResult,
    startOrResume,
    submit,
} from '../controllers/finalAssessmentController.js';

const router = express.Router();
router.use(protect, certificationRateLimit({ max: 120 }));
router.get('/courses/:courseId/availability', getAvailability);
router.post('/courses/:courseId/start', startOrResume);
router.patch('/attempts/:attemptId/answers', autosave);
router.post('/attempts/:attemptId/submit', submit);
router.get('/attempts/:attemptId/result', getResult);
router.get('/courses/:courseId/history', getHistory);

export default router;
