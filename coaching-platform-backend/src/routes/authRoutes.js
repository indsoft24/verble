// src/routes/authRoutes.js
import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getMe, 
    logoutUser, 
    forgotPassword, 
    resetPassword,
    verifyEmail,          
    resendVerificationEmail,
    resetPasswordWithOtp,
    googleAuth,
    googleCallback,
    linkGoogleAccount,
    unlinkGoogleAccount,
    androidGoogleAuth,
    linkGoogleAccountAndroid
} from '../controllers/authController.js';
import {
    sendMobileOTP,
    verifyMobileOTP,
    loginWithMobile,
    registerWithMobile,
} from '../controllers/mobileAuthController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateOAuthCallback, canLinkGoogle, canUnlinkGoogle } from '../middleware/oauthMiddleware.js';

const router = express.Router();

// Existing Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);

router.post('/verify-email', verifyEmail);
router.post('/resend-verification-email', resendVerificationEmail);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.post('/reset-password-with-otp', resetPasswordWithOtp);

// Google OAuth Routes (Web)
router.get('/google', googleAuth);
router.get('/google/callback', validateOAuthCallback, googleCallback);
router.post('/link-google', protect, canLinkGoogle, linkGoogleAccount);
router.delete('/unlink-google', protect, canUnlinkGoogle, unlinkGoogleAccount);

// Google OAuth Routes (Android)
router.post('/google/android', androidGoogleAuth);
router.post('/google/android/verify', androidGoogleAuth); // Alias for /google/android
router.post('/link-google/android', protect, canLinkGoogle, linkGoogleAccountAndroid);

// Mobile OTP Authentication Routes
router.post('/mobile/send-otp', sendMobileOTP);
router.post('/mobile/verify-otp', verifyMobileOTP);
router.post('/mobile/login', loginWithMobile);
router.post('/mobile/register', registerWithMobile);

export default router;