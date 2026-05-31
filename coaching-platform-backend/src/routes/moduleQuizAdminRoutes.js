import express from 'express';
import {
    listModuleQuizzesAdmin,
    getModuleQuizByModuleAdmin,
    createModuleQuizAdmin,
    updateModuleQuizAdmin,
    deleteModuleQuizAdmin,
    listCoursesForQuizAdmin,
    listModuleQuizSubmissionsAdmin,
    getModuleQuizSubmissionAdmin,
    updateModuleQuizSubmissionNotesAdmin,
    importModuleQuizAdmin,
} from '../controllers/moduleQuizAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, restrictTo('admin'));

router.get('/courses', listCoursesForQuizAdmin);
router.get('/submissions', listModuleQuizSubmissionsAdmin);
router.get('/submissions/:submissionId', getModuleQuizSubmissionAdmin);
router.patch('/submissions/:submissionId', updateModuleQuizSubmissionNotesAdmin);
router.get('/', listModuleQuizzesAdmin);
router.get('/module/:moduleId', getModuleQuizByModuleAdmin);
router.put('/module/:moduleId/import', importModuleQuizAdmin);
router.post('/', createModuleQuizAdmin);
router.patch('/:quizId', updateModuleQuizAdmin);
router.delete('/:quizId', deleteModuleQuizAdmin);

export default router;
