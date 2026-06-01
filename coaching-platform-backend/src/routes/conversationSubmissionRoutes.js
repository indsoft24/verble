import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    submitConversationPractice,
    getUserConversationSubmission,
} from '../controllers/conversationSubmissionController.js';

const router = express.Router();

router.post('/', protect, submitConversationPractice);
router.get('/:conversationId', protect, getUserConversationSubmission);

export default router;
