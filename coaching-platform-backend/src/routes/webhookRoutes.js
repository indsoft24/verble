import express from 'express';
import { handleBunnyWebhook } from '../controllers/webhookController.js';

const router = express.Router();

router.post('/bunny-stream', handleBunnyWebhook);

export default router;