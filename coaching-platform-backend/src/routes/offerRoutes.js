// src/routes/offerRoutes.js
import express from 'express';
import {
    getActiveOffers,
    createOffer,
} from '../controllers/offerController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getActiveOffers); // Public
router.post('/', protect, restrictTo('admin'), createOffer); // Admin only

export default router;
