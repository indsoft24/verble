import express from 'express';
import {getFeaturedCourses, getAllPublishedCourses, getPublishedCourseById, getMyCourses} from '../controllers/courseController.js';
import { getSubscriptionPlansForCourse } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.route('/featured').get(getFeaturedCourses);

router.route('/').get(getAllPublishedCourses);

router.get('/my-courses', protect, getMyCourses);

router.get('/:courseId/subscription-plans', getSubscriptionPlansForCourse);

router.get('/:courseId', getPublishedCourseById);



export default router;