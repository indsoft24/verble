import express from 'express';
const router = express.Router();

import { getVideosForModule ,getPublicModulePreview} from '../controllers/moduleController.js'; 
import { protect } from '../middleware/authMiddleware.js';


router.route('/:moduleId/videos').get(protect, getVideosForModule);

router.route('/:moduleId/preview').get(getPublicModulePreview);

export default router;
