// src/routes/dailyContentRoutes.js
import express from 'express';
import { getTodaysDailyContent, getDailyContent } from '../controllers/dailyContentController.js';

const router = express.Router();

// GET /api/daily-content/today - Get today's daily content
router.get('/today', getTodaysDailyContent);

// GET /api/daily-content - Get daily content with optional filters
router.get('/', getDailyContent);

export default router;
