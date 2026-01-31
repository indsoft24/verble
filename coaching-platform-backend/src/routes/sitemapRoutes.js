import express from 'express';
import { generateSitemap, generateRobotsTxt } from '../controllers/sitemapController.js';

const router = express.Router();

// route generates the sitemap
router.get('/sitemap.xml', generateSitemap);

// route for robots.txt
router.get('/robots.txt', generateRobotsTxt);

export default router;