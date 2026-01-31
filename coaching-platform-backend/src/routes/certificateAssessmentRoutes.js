// src/routes/certificateAssessmentRoutes.js
import express from 'express';
import {
    getCertificateAssessment,
    submitCertificateAssessment,
    getAssessmentSubmission,
} from '../controllers/certificateAssessmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getCertificateAssessment);
router.post('/submit', protect, submitCertificateAssessment);
router.get('/submission', protect, getAssessmentSubmission);

export default router;
