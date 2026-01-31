// File: src/routes/blogAdminRoutes.js
import express from 'express';
import {
    createBlogPostAdmin,
    getAllBlogPostsAdmin,
    getBlogPostByIdAdmin,
    updateBlogPostAdmin,
    deleteBlogPostAdmin,
    uploadBlogContentImageAdmin
} from '../controllers/blogAdminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import uploadBlogImage  from '../middleware/uploadBlogImageMiddleware.js'; 
import multerErrorHandler from '../middleware/multerErrorHandler.js';

const router = express.Router();

router.use(protect, restrictTo('admin'));


router.route('/')
    .post(uploadBlogImage.single('featureImage'),multerErrorHandler, createBlogPostAdmin)
    .get(getAllBlogPostsAdmin);

router.post('/content-image-upload', uploadBlogImage.single('contentImage'), multerErrorHandler, uploadBlogContentImageAdmin);


router.route('/:postId')
    .get(getBlogPostByIdAdmin)
    .patch(uploadBlogImage.single('featureImage'),multerErrorHandler, updateBlogPostAdmin)
    .delete(deleteBlogPostAdmin);

export default router;