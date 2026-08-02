import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { certificationRateLimit } from '../middleware/certificationRateLimit.js';
import {
    deleteNumberingSettings,
    exportAdminLearningCertificates,
    getEligibilityDetail,
    listAdminLearningCertificates,
    listNumberingSettings,
    manualIssueCourseCertificate,
    regenerateLearningCertificate,
    revokeLearningCertificate,
    unrevokeLearningCertificate,
    upsertNumberingSettings,
} from '../controllers/learningCertificateController.js';

const router = express.Router();
router.use(protect, restrictTo('admin'), certificationRateLimit({ max: 180 }));
router.get('/issued-unified', listAdminLearningCertificates);
router.get('/issued-unified/export', exportAdminLearningCertificates);
router.post('/issued-unified/manual', manualIssueCourseCertificate);
router.post('/issued-unified/:certificateId/revoke', revokeLearningCertificate);
router.post('/issued-unified/:certificateId/unrevoke', unrevokeLearningCertificate);
router.post('/issued-unified/:certificateId/regenerate', regenerateLearningCertificate);
router.get('/eligibility/:userId/:courseId', getEligibilityDetail);
router.get('/numbering', listNumberingSettings);
router.put('/numbering', upsertNumberingSettings);
router.delete('/numbering/:settingsId', deleteNumberingSettings);

export default router;
