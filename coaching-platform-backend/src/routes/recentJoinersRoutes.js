// src/routes/recentJoinersRoutes.js
import express from 'express';
import { getRecentJoiners } from '../controllers/recentJoinersController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getRecentJoiners);

export default router;
