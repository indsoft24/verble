// File: src/routes/blogRoutes.js 

import express from 'express';
import {
    getAllPublishedBlogPosts,
    getPublishedBlogPostBySlug,
    getRecentBlogPosts,
    getAllBlogCategories,
    getPublishedPostsByCategory,
    serveBlogImage,
    serveBlogContentImage
} from '../controllers/blogController.js';

const router = express.Router();
 

router.get('/image/:imageName', serveBlogImage);
router.get('/content-image/:imageName', serveBlogContentImage);



router.route('/').get(getAllPublishedBlogPosts);
router.route('/recent').get(getRecentBlogPosts);
router.route('/categories').get(getAllBlogCategories);
router.get('/category/:slug', getPublishedPostsByCategory);
router.route('/:slug').get(getPublishedBlogPostBySlug);

export default router;