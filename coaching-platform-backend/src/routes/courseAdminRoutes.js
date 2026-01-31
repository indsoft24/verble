import express from 'express';
import {
    createCourseAdmin,
    getAllCoursesAdmin,
    getCourseByIdAdmin,
    updateCourseAdmin,
    deleteCourseAdmin
} from '../controllers/courseAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import uploadImage from '../middleware/uploadImageMemoryMiddleware.js';
import multerErrorHandler from '../middleware/multerErrorHandler.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
    .post(uploadImage.single('image'), multerErrorHandler, createCourseAdmin)
    .get(getAllCoursesAdmin);

router.route('/:courseId')
    .get(getCourseByIdAdmin)
    .patch(uploadImage.single('image'), multerErrorHandler, updateCourseAdmin)
    .delete(deleteCourseAdmin);

export default router;