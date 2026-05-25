import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
    getAdminCertificateRules,
    getAdminIssuedCertificates,
    updateAdminCertificateRule,
} from '../controllers/courseCertificateController.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/rules', getAdminCertificateRules);
router.patch('/rules/:courseId', updateAdminCertificateRule);
router.get('/issued', getAdminIssuedCertificates);

export default router;
