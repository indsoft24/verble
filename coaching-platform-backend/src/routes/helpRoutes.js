// src/routes/helpRoutes.js
import express from 'express';
import {
    getHelpArticles,
    getHelpArticleById,
    getHelpCategories
} from '../controllers/helpController.js';

const router = express.Router();

// Public routes - no authentication required
router.get('/categories', getHelpCategories);
router.get('/:id', getHelpArticleById);
router.get('/', getHelpArticles);

export default router;
