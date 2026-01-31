// src/routes/certificateRoutes.js
import express from 'express';
import {
    generateUserCertificate,
    getMyCertificate,
    downloadCertificate,
    verifyCertificateByCode,
} from '../controllers/certificateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, generateUserCertificate);
router.get('/my-certificate', protect, getMyCertificate);
router.get('/download/:fileName', protect, downloadCertificate);
router.get('/verify/:verificationCode', verifyCertificateByCode); // Public route

export default router;
