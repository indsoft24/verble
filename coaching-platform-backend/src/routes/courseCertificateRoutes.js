import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    downloadMyCourseCertificate,
    generateMyCourseCertificate,
    getCourseCertificateEligibility,
    getCourseCertificationEvaluation,
    getCourseReportCardController,
    getMyCourseCertificates,
    publicDownloadCourseCertificate,
} from '../controllers/courseCertificateController.js';

const router = express.Router();

router.get('/public-download/:verificationCode', publicDownloadCourseCertificate);

router.use(protect);
router.get('/my-course-certificates', getMyCourseCertificates);
router.get('/courses/:courseId/eligibility', getCourseCertificateEligibility);
router.get('/courses/:courseId/evaluation', getCourseCertificationEvaluation);
router.get('/courses/:courseId/report-card', getCourseReportCardController);
router.post('/courses/:courseId/generate', generateMyCourseCertificate);
router.get('/download/:certificateId', downloadMyCourseCertificate);

export default router;
