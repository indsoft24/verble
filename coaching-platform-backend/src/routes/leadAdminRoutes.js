import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getRecentLeadsForAdmin } from '../controllers/leadController.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/', getRecentLeadsForAdmin);

export default router;
