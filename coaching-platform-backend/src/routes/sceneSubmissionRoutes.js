// src/routes/sceneSubmissionRoutes.js
import express from 'express';
import { submitSceneDescription, getUserSceneSubmission } from '../controllers/sceneSubmissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', submitSceneDescription);
router.get('/:sceneId', getUserSceneSubmission);

export default router;
