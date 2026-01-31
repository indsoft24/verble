import express from 'express';
import { 
    getAllPublishedVideos, 
    getPlayToken, 
    getPublishedVideoById ,
    serveVideoThumbnail,
    serveVideoStream,
    getPublicContentForGuests,
    markVideoCompleted
} from '../controllers/videoController.js';
import { protect} from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.get('/', getAllPublishedVideos); 
router.get('/thumbnail/:videoId', serveVideoThumbnail);
router.get('/content', getPublicContentForGuests);

// This middleware protects all subsequent routes in this file
router.use(protect);

// GET /api/videos/:videoId -> Get a single published video by its ID
router.get('/:videoId', getPublishedVideoById);

// GET /api/videos/:videoId/get-play-token -> Get a secure token to play the video
router.get('/:videoId/get-play-token', getPlayToken);

// POST /api/videos/:videoId/complete -> Mark a video as completed
router.post('/:videoId/complete', markVideoCompleted);

router.get('/player/:videoId', serveVideoStream);

export default router;

