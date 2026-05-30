import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
    getAdminCertificateRules,
    getAdminIssuedCertificates,
    updateAdminCertificateRule,
    downloadDemoCertificateAdmin,
    getAdminCertificateBranding,
    updateAdminCertificateBranding,
    uploadAdminCertificateSignature,
    uploadAdminCertificateLogo,
    streamAdminCertificateSignature,
    streamAdminCertificateLogo,
} from '../controllers/courseCertificateController.js';
import {
    uploadCertificateSignature,
    uploadCertificateLogo,
} from '../middleware/uploadCertificateBrandingMiddleware.js';
import multerErrorHandler from '../middleware/multerErrorHandler.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/rules', getAdminCertificateRules);
router.get('/branding', getAdminCertificateBranding);
router.patch('/branding', updateAdminCertificateBranding);
router.post(
    '/branding/signature',
    uploadCertificateSignature,
    multerErrorHandler,
    uploadAdminCertificateSignature
);
router.post('/branding/logo', uploadCertificateLogo, multerErrorHandler, uploadAdminCertificateLogo);
router.get('/branding/signature-image', streamAdminCertificateSignature);
router.get('/branding/logo-image', streamAdminCertificateLogo);
router.get('/demo-preview', downloadDemoCertificateAdmin);
router.patch('/rules/:courseId', updateAdminCertificateRule);
router.get('/issued', getAdminIssuedCertificates);

export default router;
