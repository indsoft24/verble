import express from 'express';
import { 
    getAllPublishedVideos, 
    getPlayToken, 
    getPublishedVideoById ,
    serveVideoThumbnail,
    serveVideoStream,
    getPublicContentForGuests,
    markVideoCompleted,
    getVideoNavigationContext
} from '../controllers/videoController.js';
import { serveHlsMaster, serveHlsSegment } from '../controllers/localVideoStreamController.js';
import { protect} from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.get('/', getAllPublishedVideos); 
router.get('/thumbnail/:videoId', serveVideoThumbnail);
router.get('/content', getPublicContentForGuests);

// This middleware protects all subsequent routes in this file
router.use(protect);

// Self-hosted HLS (must be registered before /:videoId)
router.get('/hls/:videoId/master.m3u8', serveHlsMaster);
router.get('/hls/:videoId/:quality/:filename', serveHlsSegment);

router.get('/player/:videoId', serveVideoStream);

// GET /api/videos/:videoId/get-play-token -> Get a secure token to play the video
router.get('/:videoId/get-play-token', getPlayToken);

// POST /api/videos/:videoId/complete -> Mark a video as completed
router.post('/:videoId/complete', markVideoCompleted);

// GET /api/videos/:videoId/navigation -> module-scoped lesson navigation
router.get('/:videoId/navigation', getVideoNavigationContext);

// GET /api/videos/:videoId -> Get a single published video by its ID
router.get('/:videoId', getPublishedVideoById);

export default router;

