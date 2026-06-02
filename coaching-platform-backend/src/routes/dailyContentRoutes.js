import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getDailyContent,
    getTodaysDailyContent,
    getAdjacentContentBySequence,
    getProfessionalLibrary,
} from '../controllers/dailyContentController.js';

const router = express.Router();

router.use(protect);
router.get('/today', getTodaysDailyContent);
router.get('/adjacent', getAdjacentContentBySequence);
router.get('/professional-library', getProfessionalLibrary);
router.get('/', getDailyContent);

export default router;
