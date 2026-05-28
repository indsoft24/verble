import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getPromoBannerAdmin, updatePromoBanner } from '../controllers/promoBannerController.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/', getPromoBannerAdmin);
router.put('/', updatePromoBanner);

export default router;
