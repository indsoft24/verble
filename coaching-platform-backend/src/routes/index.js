// src/routes/index.js
import express from 'express';
const router = express.Router();

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import adminRoutes from './adminRoutes.js';
import subscriptionPlanRoutes from './subscriptionPlanRoutes.js';
import videoAdminRoutes from './videoAdminRoutes.js';
import videoRoutes from './videoRoutes.js';
import subscriptionPlanAdminRoutes from './subscriptionPlanAdminRoutes.js';
import subscriptionUserRoutes from './subscriptionUserRoutes.js';
import courseAdminRoutes from './courseAdminRoutes.js';
import moduleAdminRoutes from './moduleAdminRoutes.js';
import courseRoutes from './courseRoutes.js';
import moduleRoutes from './moduleRoutes.js';
import blogAdminRoutes from './blogAdminRoutes.js';
import blogRoutes from './blogRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import formSubmissionRoutes from './formSubmissionRoutes.js';
import materialRoutes from './materialRoutes.js';
import materialUserRoutes from './materialUserRoutes.js';
import examCategoryRoutes from './examCategoryRoutes.js';
import examCategoryAdminRoutes from './examCategoryAdminRoutes.js';
import gatedContentAdminRoutes from './gatedContentAdminRoutes.js';
import leadRoutes from './leadRoutes.js';
import downloadRoutes from './downloadRoutes.js';
import knowledgeBaseAdminRoutes from './knowledgeBaseAdminRoutes.js';
import helpRoutes from './helpRoutes.js';
import dailyContentAdminRoutes from './dailyContentAdminRoutes.js';
import dailyNotificationAdminRoutes from './dailyNotificationAdminRoutes.js';
import aiRoutes from './aiRoutes.js';
import sitemapRoutes from './sitemapRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import webhookRoutes from './webhookRoutes.js';
import dailyQuoteRoutes from './dailyQuoteRoutes.js';
import dailyContentRoutes from './dailyContentRoutes.js';
import sentenceSubmissionRoutes from './sentenceSubmissionRoutes.js';
import storySubmissionRoutes from './storySubmissionRoutes.js';
import vocabSubmissionRoutes from './vocabSubmissionRoutes.js';
import puzzleSubmissionRoutes from './puzzleSubmissionRoutes.js';
import sceneSubmissionRoutes from './sceneSubmissionRoutes.js';
import speechSubmissionRoutes from './speechSubmissionRoutes.js';
import aiPromptRoutes from './aiPromptRoutes.js';
import moduleQuizRoutes from './moduleQuizRoutes.js';
import certificateAssessmentRoutes from './certificateAssessmentRoutes.js';
import certificateRoutes from './certificateRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import offerRoutes from './offerRoutes.js';
import promoBannerRoutes from './promoBannerRoutes.js';
import promoBannerAdminRoutes from './promoBannerAdminRoutes.js';
import recentJoinersRoutes from './recentJoinersRoutes.js';
import sentenceValidationRoutes from './sentenceValidationRoutes.js';
import databaseManagerRoutes from './databaseManagerRoutes.js';
import courseCertificateRoutes from './courseCertificateRoutes.js';
import courseCertificateAdminRoutes from './courseCertificateAdminRoutes.js';
import { serveCourseImage, serveModuleImage, serveSubscriptionImage, serveGeneralImage, getSupportedImageTypes } from '../controllers/imageServingController.js';



router.get('/test', (req, res) => {
    res.json({ message: 'Backend API is running and reachable!' });
});

router.use('/', sitemapRoutes);

router.use('/webhooks', webhookRoutes);

// Mount routes with base paths
router.use('/auth', authRoutes); // Handles /api/auth/*
router.use('/users', userRoutes); // Handles /api/users/*
router.use('/admin', adminRoutes); // Handles /api/admin/*
router.use('/subscription-plans', subscriptionPlanRoutes); // Handles /api/subscription-plans/*
router.use('/admin/videos', videoAdminRoutes);  // Handles /api/admin/videos/*
router.use('/videos', videoRoutes);  // Handles /api/videos/*
router.use('/admin/subscription-plans', subscriptionPlanAdminRoutes);   // Handles /api/admin/subscription-plans/*
router.use('/subscriptions', subscriptionUserRoutes);   // Handles /api/subscriptions/*
router.use('/admin/courses', courseAdminRoutes);    // Handles /api/admin/courses/*
router.use('/admin', moduleAdminRoutes); // Handles /api/admin/modules/*
router.use('/courses', courseRoutes); // Handles /api/courses/* user
router.use('/modules', moduleRoutes);   // Handles /api/modules/* user
router.use('/admin/blog', blogAdminRoutes); // Handles /api/admin/blog/*
router.use('/modules', moduleRoutes);  // Handles /api/modules/* user
router.use('/blog', blogRoutes); // Handles /api/blog/*
router.use('/payments', paymentRoutes); // Handles /api/payments/*
router.use('/forms', formSubmissionRoutes); // Handles /api/forms/*
router.use('/admin/materials', materialRoutes); // Handles /api/admin/materials/*
router.use('/materials', materialUserRoutes);  // Handles /api/materials/*
router.use('/admin/exam-categories', examCategoryAdminRoutes); // Handles /api/admin/exam-categories/*
router.use('/exam-categories', examCategoryRoutes); // Handles /api/exam-categories/*
router.use('/admin/gated-content', gatedContentAdminRoutes); // Handles /api/admin/gated-content/*
router.use('/leads', leadRoutes);
router.use('/downloads', downloadRoutes);
router.use('/admin/knowledge-base', knowledgeBaseAdminRoutes);
router.use('/admin/notifications', dailyNotificationAdminRoutes);
router.use('/help', helpRoutes);
router.use('/admin/daily-content', dailyContentAdminRoutes); // Handles /api/admin/daily-content/*
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes); // Handles /api/notifications/*
router.use('/daily-quote', dailyQuoteRoutes); // Handles /api/daily-quote/*
router.use('/daily-content', dailyContentRoutes); // Handles /api/daily-content/*
router.use('/submit-sentence', sentenceSubmissionRoutes); // Handles /api/submit-sentence/*
router.use('/submit-story-summary', storySubmissionRoutes); // Handles /api/submit-story-summary/*
router.use('/submit-vocab-sentences', vocabSubmissionRoutes); // Handles /api/submit-vocab-sentences/*
router.use('/submit-puzzle', puzzleSubmissionRoutes); // Handles /api/submit-puzzle/*
router.use('/submit-scene-description', sceneSubmissionRoutes); // Handles /api/submit-scene-description/*
router.use('/submit-speech-description', speechSubmissionRoutes); // Handles /api/submit-speech-description/*
router.use('/ai-prompts', aiPromptRoutes); // Handles /api/ai-prompts/*
router.use('/module-quizzes', moduleQuizRoutes); // Handles /api/module-quizzes/*
router.use('/certificate-assessment', certificateAssessmentRoutes); // Handles /api/certificate-assessment/*
router.use('/certificates', certificateRoutes); // Handles /api/certificates/*
router.use('/leaderboard', leaderboardRoutes); // Handles /api/leaderboard/*
router.use('/offers', offerRoutes); // Handles /api/offers/*
router.use('/promo-banner', promoBannerRoutes); // Handles /api/promo-banner/*
router.use('/admin/promo-banner', promoBannerAdminRoutes); // Handles /api/admin/promo-banner/*
router.use('/recent-joiners', recentJoinersRoutes); // Handles /api/recent-joiners/*
router.use('/validate-sentence', sentenceValidationRoutes); // Handles /api/validate-sentence/*
router.use('/admin/database-manager', databaseManagerRoutes); // Handles /api/admin/database-manager/*
router.use('/course-certificates', courseCertificateRoutes); // Handles /api/course-certificates/*
router.use('/admin/certificates', courseCertificateAdminRoutes); // Handles /api/admin/certificates/*

// Image serving routes - General endpoint for Android app
router.get('/images/types', getSupportedImageTypes);
router.get('/images/:type/:imageName', serveGeneralImage);

// Legacy specific image serving routes (for backward compatibility)
router.get('/courses/image/:imageName', serveCourseImage);
router.get('/modules/image/:imageName', serveModuleImage);
router.get('/subscription-plans/image/:imageName', serveSubscriptionImage);





export default router;