import express from 'express';
import { 
    createRazorpayOrder, 
    verifyPayment,
    razorpayWebhook
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/razorpay-webhook', razorpayWebhook);

router.use(protect);

router.post('/create-order', createRazorpayOrder);
router.post('/verify-payment', verifyPayment);


export default router;