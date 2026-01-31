import express from 'express';
import { handleChat } from '../controllers/aiController.js';

const router = express.Router();

// should be able to interact with the chatbot.
router.post('/chat', handleChat);

export default router;
