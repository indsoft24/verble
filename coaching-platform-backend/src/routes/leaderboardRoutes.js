// src/routes/leaderboardRoutes.js
import express from 'express';
import {
    getFreeLeaderboard,
    getPaidLeaderboard,
    getMyRank,
} from '../controllers/leaderboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/free', protect, getFreeLeaderboard);
router.get('/paid', protect, getPaidLeaderboard);
router.get('/my-rank', protect, getMyRank);

export default router;
