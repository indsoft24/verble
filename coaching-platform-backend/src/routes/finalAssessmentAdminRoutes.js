import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { certificationRateLimit } from '../middleware/certificationRateLimit.js';
import {
    bulkImportQuestions,
    createAdminQuestion,
    deleteAdminSettings,
    deleteAdminQuestion,
    exportQuestions,
    getAdminSettings,
    listAdminQuestions,
    reportAttempts,
    updateAdminQuestion,
    upsertAdminSettings,
} from '../controllers/finalAssessmentController.js';

const router = express.Router();
router.use(protect, restrictTo('admin'), certificationRateLimit({ max: 180 }));
router.get('/courses/:courseId/settings', getAdminSettings);
router.put('/courses/:courseId/settings', upsertAdminSettings);
router.delete('/courses/:courseId/settings', deleteAdminSettings);
router.get('/courses/:courseId/questions', listAdminQuestions);
router.post('/courses/:courseId/questions', createAdminQuestion);
router.patch('/courses/:courseId/questions/:questionId', updateAdminQuestion);
router.delete('/courses/:courseId/questions/:questionId', deleteAdminQuestion);
router.post('/courses/:courseId/questions/import', bulkImportQuestions);
router.get('/courses/:courseId/questions/export', exportQuestions);
router.get('/courses/:courseId/attempts', reportAttempts);

export default router;
