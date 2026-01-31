import express from 'express';
import { 
    downloadMaterial, 
    getAllMaterials, 
    getMaterialsByVideo 
} from '../controllers/materialController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// --- Public Routes ---

// @route   GET /api/materials
// @desc    Fetch info for all materials
router.get('/', getAllMaterials);

// @route   GET /api/materials/:videoId
// @desc    Fetch info for materials of a specific video
router.get('/:videoId', getMaterialsByVideo);


// --- Protected Routes ---

// @route   GET /api/materials/:videoId/:materialId/download
// @desc    Download a specific material file
router.get(
    '/:videoId/:materialId/download', 
    protect,
    downloadMaterial
);

export default router;
