import express from 'express';
import {
    createArticle,
    getAllArticles,
    getArticleById,
    updateArticle,
    deleteArticle
} from '../controllers/knowledgeBaseAdminController.js';
import { protect, restrictTo} from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect and admin middleware to all routes in this file
router.use(protect);
router.use(restrictTo('admin'));

router.route('/')
    .post(createArticle)
    .get(getAllArticles);

router.route('/:id')
    .get(getArticleById)
    .patch(updateArticle)
    .delete(deleteArticle);

export default router;
