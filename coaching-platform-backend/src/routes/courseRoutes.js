import express from 'express';
import {getFeaturedCourses, getAllPublishedCourses, getPublishedCourseById, getMyCourses, getFeaturedUPSCourses, getFeaturedLawCourses, getUpscCoursesList, getLawCoursesList} from '../controllers/courseController.js';
import { getSubscriptionPlansForCourse } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.route('/featured').get(getFeaturedCourses);

router.route('/upsc').get(getFeaturedUPSCourses);
router.route('/upsc-list').get(getUpscCoursesList);

router.route('/law').get(getFeaturedLawCourses);
router.route('/law-list').get(getLawCoursesList);

router.route('/').get(getAllPublishedCourses);

router.get('/my-courses', protect, getMyCourses);

router.get('/:courseId/subscription-plans', getSubscriptionPlansForCourse);

router.get('/:courseId', getPublishedCourseById);



export default router;