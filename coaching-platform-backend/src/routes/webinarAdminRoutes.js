import express from 'express';
import {
    createWebinar,
    getWebinarAdminById,
    listWebinarsForAdmin,
    updateWebinar,
} from '../controllers/webinarController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/', listWebinarsForAdmin);
router.post('/', createWebinar);
router.get('/:webinarId', getWebinarAdminById);
router.put('/:webinarId', updateWebinar);

export default router;

