// src/routes/videoAdminRoutes.js
import express from 'express';
import {
    initiateUpload,
    finalizeBunnyVideoAndSaveMetadata,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    updateVideoStatusAdmin, 
    getVideosForModuleAdmin,
    removeVideoFromModuleAdmin,
    bulkLinkVideos
} from '../controllers/videoAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.post('/initiate-upload', initiateUpload);

router.post('/finalize-bunny-upload', finalizeBunnyVideoAndSaveMetadata);

router.route('/')
    .get(getAllVideos);

router.post('/bulk-link', bulkLinkVideos);

router.patch('/:videoId/status', updateVideoStatusAdmin); 

router.route('/:id')
    .get(getVideoById)
    .patch(updateVideo) 
    .delete(deleteVideo);

router.get('/by-module/:moduleId', getVideosForModuleAdmin); 
router.patch('/:videoId/modules/remove', removeVideoFromModuleAdmin);

export default router;