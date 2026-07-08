import express from 'express';
import {
    register,
    verifyEmail,
    resendVerificationEmail,
    login,
    getMe,
    logout,
    forgotPassword,
    resetPassword,
} from '../controllers/authController.js';
import {
    loginWithPhonePin,
    changeLoginPin,
    forgotLoginPin,
    regenerateLoginPinAfterVerification,
} from '../controllers/phonePinAuthController.js';
import {
    sendMobileOTP,
    verifyMobileOTP,
    loginWithMobile,
    registerWithMobile,
} from '../controllers/mobileAuthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Phone + PIN (primary login)
router.post('/phone-pin/login', loginWithPhonePin);
router.post('/phone-pin/forgot-pin', forgotLoginPin);
router.patch('/phone-pin/change-pin', protect, changeLoginPin);
router.post('/phone-pin/regenerate-after-verify', protect, regenerateLoginPinAfterVerification);

// Registration & verification
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail);

// Legacy email/password (admin emergency)
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Mobile OTP (legacy — kept for compatibility)
router.post('/mobile/send-otp', sendMobileOTP);
router.post('/mobile/verify-otp', verifyMobileOTP);
router.post('/mobile/login', loginWithMobile);
router.post('/mobile/register', registerWithMobile);

export default router;
