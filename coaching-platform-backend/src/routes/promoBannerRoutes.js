// src/routes/promoBannerRoutes.js
import express from 'express';
import { getPromoBanner } from '../controllers/promoBannerController.js';

const router = express.Router();
router.get('/', getPromoBanner);
export default router;
