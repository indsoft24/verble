import express from 'express';
import { uploadGatedFile as uploadGatedFileController } from '../controllers/gatedContentAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import uploadGatedFileMiddleware from '../middleware/uploadGatedFileMiddleware.js';
import multerErrorHandler from '../middleware/multerErrorHandler.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.route('/:postId')
    .post(uploadGatedFileMiddleware.single('gatedFile'),
        multerErrorHandler,
        uploadGatedFileController
    );

export default router;
