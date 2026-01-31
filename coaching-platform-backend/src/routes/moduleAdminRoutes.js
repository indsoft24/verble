// File: src/routes/moduleAdminRoutes.js

import express from 'express';
import {
    createModuleAdmin,
    getAllModulesAdmin,
    getModulesForCourseAdmin,
    getModuleByIdAdmin,
    updateModuleAdmin,
    deleteModuleAdmin,
    linkVideosToModuleAdmin
} from '../controllers/moduleAdminController.js';
import {
    getVideosForModuleAdmin
} from '../controllers/videoAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import uploadImage from '../middleware/uploadImageMemoryMiddleware.js';
import multerErrorHandler from '../middleware/multerErrorHandler.js';

const router = express.Router();

// All routes here are protected and for admins only
router.use(protect);
router.use(restrictTo('admin'));

// Get all modules across all courses
router.get('/modules', getAllModulesAdmin);

// Create a module for a specific course & Get all modules for a course
router.route('/courses/:courseId/modules')
    .post(uploadImage.single('image'), multerErrorHandler, createModuleAdmin)
    .get(getModulesForCourseAdmin);

// Operations on a specific module by its ID
router.route('/modules/:moduleId')
    .get(getModuleByIdAdmin)
    .patch(uploadImage.single('image'), multerErrorHandler, updateModuleAdmin)
    .delete(deleteModuleAdmin);

router.get('/modules/:moduleId/videos', getVideosForModuleAdmin); 
router.post('/modules/:moduleId/link-videos', linkVideosToModuleAdmin);

export default router;