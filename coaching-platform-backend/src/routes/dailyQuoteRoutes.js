// src/routes/dailyQuoteRoutes.js
import express from 'express';
import { getDailyQuote } from '../controllers/dailyQuoteController.js';

const router = express.Router();

// GET /api/daily-quote - Get daily quote (public)
router.get('/', getDailyQuote);

export default router;
