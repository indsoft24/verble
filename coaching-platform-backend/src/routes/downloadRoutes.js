import express from 'express';
import { downloadGatedFile } from '../controllers/leadController.js';

const router = express.Router();

router.get('/gated-file/:token', downloadGatedFile);

export default router;