import express from 'express';
import { getUpscCourses, getUpscVideos, getFeaturedUpscCourses } from '../controllers/firstIasController.js';

const router = express.Router();

// Public routes for First IAS (UPSC) - matching public course routes pattern
router.get('/featured-courses', getFeaturedUpscCourses);
router.get('/courses', getUpscCourses);
router.get('/videos', getUpscVideos);

export default router;