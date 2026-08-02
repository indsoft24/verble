import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { certificationRateLimit } from '../middleware/certificationRateLimit.js';
import {
    downloadLearningCertificate,
    listMyLearningCertificates,
    verifyLearningCertificate,
} from '../controllers/learningCertificateController.js';

const router = express.Router();
router.get('/verify/:verificationCode', certificationRateLimit({ max: 30 }), verifyLearningCertificate);
router.use(protect, certificationRateLimit({ max: 90 }));
router.get('/mine', listMyLearningCertificates);
router.get('/:certificateId/download', downloadLearningCertificate);

export default router;
