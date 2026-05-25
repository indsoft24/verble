import express from 'express';
import multer from 'multer';
import { uploadMaterial, deleteMaterial, downloadMaterial } from '../controllers/materialController.js';
import { protect} from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Configure multer for in-memory file storage.
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.use(protect);

router.route('/:videoId/:materialId/download').get(downloadMaterial);

// Route to upload a new material file for a specific video
// The :videoId should be the local MongoDB video _id
router.route('/:videoId').post(
    upload.single('materialFile'), 
    uploadMaterial
);

// Route to delete a specific material from a video
router.route('/:videoId/:materialId').delete(
    deleteMaterial
);

export default router;
