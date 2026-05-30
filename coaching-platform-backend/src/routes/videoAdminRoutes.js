// src/routes/videoAdminRoutes.js
import express from 'express';
import {
    initiateUpload,
    uploadLocalVideoAndTranscode,
    uploadVideoChunk,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    cleanupOrphanVideoStorageAdmin,
    updateVideoStatusAdmin, 
    getVideosForModuleAdmin,
    removeVideoFromModuleAdmin,
    bulkLinkVideos
} from '../controllers/videoAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import multerErrorHandler from '../middleware/multerErrorHandler.js';
import { loadLocalVideoForUpload, uploadLocalVideoFile } from '../middleware/uploadLocalVideoMiddleware.js';
import {
    loadLocalVideoForChunkUpload,
    uploadVideoChunkMulter,
} from '../middleware/uploadVideoChunkMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.post('/initiate-upload', initiateUpload);
router.post('/cleanup-orphan-storage', cleanupOrphanVideoStorageAdmin);

router.post(
    '/:id/upload-file',
    loadLocalVideoForUpload,
    uploadLocalVideoFile.single('video'),
    multerErrorHandler,
    uploadLocalVideoAndTranscode
);

router.post(
    '/:id/upload-chunk',
    loadLocalVideoForChunkUpload,
    uploadVideoChunkMulter.single('chunk'),
    multerErrorHandler,
    uploadVideoChunk
);

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