import express from 'express';
import { getLawCourses, getLawVideos, getFeaturedLawCourses } from '../controllers/knowledgeNationController.js';

const router = express.Router();

// Public routes for Knowledge Nation (Law) - matching public course routes pattern
router.get('/featured-courses', getFeaturedLawCourses);
router.get('/courses', getLawCourses);
router.get('/videos', getLawVideos);

export default router;
