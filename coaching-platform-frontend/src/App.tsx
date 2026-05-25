import { Suspense, lazy, useState, useEffect } from 'react';
import {
    BrowserRouter as Router, Routes, Route, Navigate, useLocation
} from 'react-router-dom';
import { Box, CircularProgress, Typography, CssBaseline, ThemeProvider } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import theme from './theme';

import ScrollToTop from './components/utils/ScrollToTop';
import NotificationContainer from './components/common/NotificationContainer';
import SecurityProtection from './components/SecurityProtection';
import { LanguageProvider } from './contexts/LanguageContext';
import LanguageSwitcherModal from './components/layout/LanguageSwitcherModal';
import { getLanguageChoiceMade } from './i18n/config';

// --- Layout Component Imports (Keep these eager - used on most pages) ---
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// --- Lazy Loaded Pages (Code Splitting) ---
// Public Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

// User Pages
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const VideosListPage = lazy(() => import('./pages/VideosListPage'));
const VideoWatchPage = lazy(() => import('./pages/VideoWatchPage'));
const SubscriptionPlansPage = lazy(() => import('./pages/SubscriptionPlansPage'));
const SubscriptionPlanDetailPage = lazy(() => import('./pages/SubscriptionPlanDetailPage'));
const MySubscriptionPage = lazy(() => import('./pages/MySubscriptionPage'));
const MyCoursesPage = lazy(() => import('./pages/MyCoursesPage'));
const CoursesListPage = lazy(() => import('./pages/CoursesListPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const ModuleVideosPage = lazy(() => import('./pages/ModuleVideosPage'));
const ExamCategoryCoursesPage = lazy(() => import('./pages/ExamCategoryCoursesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfessionalConversationsPage = lazy(() => import('./pages/ProfessionalConversationsPage'));

// Blog Pages
const BlogListPage = lazy(() => import('./pages/BlogListPage'));
const BlogPostDetailPage = lazy(() => import('./pages/BlogPostDetailPage'));

// Admin Pages (Heavy - lazy load)
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminUsersListPage = lazy(() => import('./pages/AdminUsersListPage'));
const AdminVideosListPage = lazy(() => import('./pages/AdminVideosListPage'));
const AdminCreateVideoPage = lazy(() => import('./pages/AdminCreateVideoPage'));
const AdminEditVideoPage = lazy(() => import('./pages/AdminEditVideoPage'));
const AdminSubscriptionPlansListPage = lazy(() => import('./pages/AdminSubscriptionPlansListPage'));
const AdminManageUserSubscriptionPage = lazy(() => import('./pages/AdminManageUserSubscriptionPage'));
const AdminCoursesListPage = lazy(() => import('./pages/AdminCoursesListPage'));
const AdminManageModulesPage = lazy(() => import('./pages/AdminManageModulesPage'));
const AdminModulesListPage = lazy(() => import('./pages/AdminModulesListPage'));
const AdminModuleVideosPage = lazy(() => import('./pages/AdminModuleVideosPage'));
const AdminBlogListPage = lazy(() => import('./pages/AdminBlogListPage'));
const AdminCreateEditBlogPostPage = lazy(() => import('./pages/AdminCreateEditBlogPostPage'));
const AdminExamCategoriesPage = lazy(() => import('./pages/AdminExamCategoriesPage'));
const AdminKnowledgeBasePage = lazy(() => import('./pages/AdminKnowledgeBasePage'));
const AdminSentenceValidationPage = lazy(() => import('./pages/AdminSentenceValidationPage'));
const AdminDailyContentPage = lazy(() => import('./pages/AdminDailyContentPage'));
const AdminDatabaseManagerPage = lazy(() => import('./pages/AdminDatabaseManagerPage'));
const AdminWebinarLeadsPage = lazy(() => import('./pages/AdminWebinarLeadsPage'));
const AdminPromoBannerPage = lazy(() => import('./pages/AdminPromoBannerPage'));
const AdminCertificationManagementPage = lazy(() => import('./pages/AdminCertificationManagementPage'));

// Static Pages (Low priority - lazy load)
const ContactUsPage = lazy(() => import('./pages/static/ContactUsPage'));
const PartnershipPage = lazy(() => import('./pages/static/PartnershipPage'));
const BusinessProposalPage = lazy(() => import('./pages/static/BusinessProposalPage'));
const CareersPage = lazy(() => import('./pages/static/CareersPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/static/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('./pages/static/TermsAndConditionsPage'));
const DisclaimerPage = lazy(() => import('./pages/static/DisclaimerPage'));
const SiteMapPage = lazy(() => import('./pages/static/SiteMapPage'));
const AboutUsPage = lazy(() => import('./pages/static/AboutUsPage'));
const MissionAndVisionPage = lazy(() => import('./pages/static/MissionAndVisionPage'));
const WhyJoinUsPage = lazy(() => import('./pages/static/WhyJoinUsPage'));
const TestimonialsPage = lazy(() => import('./pages/static/TestimonialsPage'));
const FaqsPage = lazy(() => import('./pages/static/FaqsPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const WebinarPage = lazy(() => import('./pages/WebinarPage'));

// Chatbot Widget (Lazy load - not critical for initial render)
const ChatbotWidget = lazy(() => import('./components/features/chatbot/ChatbotWidget'));

// Loading Component
const PageLoader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
    </Box>
);

const NotFoundPage = () => <Typography variant="h4" align="center" sx={{ mt: 5 }}>404 - Page Not Found</Typography>;
const UnauthorizedPage = () => <Typography variant="h4" align="center" sx={{ mt: 5 }}>403 - Unauthorized Access</Typography>;

function AppContent() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading Application...</Typography>
            </Box>
        );
    }

    const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Only show Navbar and Footer for non-admin and non-user dashboard routes */}
            {!location.pathname.startsWith('/admin') &&
                !['/dashboard', '/profile', '/my-courses', '/videos', '/my-subscription', '/notifications', '/professional-conversations'].some(path =>
                    location.pathname === path || location.pathname.startsWith(path + '/')
                ) && <Navbar />}

            <Box component="main" sx={{ flexGrow: 1 }}>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/register" element={<RegistrationPage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={dashboardPath} replace />} />
                        <Route path="/mobile-login" element={<Navigate to="/login" replace />} />
                        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
                        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                        {/* Blog Routes */}
                        <Route path="/blog" element={<BlogListPage />} />
                        <Route path="/blog/:slug" element={<BlogPostDetailPage />} />
                        <Route path="/blog/category/:categorySlug" element={<BlogListPage />} />
                        <Route path="/blog/tag/:tagSlug" element={<BlogListPage />} />

                        {/* Public Course Routes */}
                        <Route path="/courses" element={<CoursesListPage />} />
                        <Route path="/courses/:courseId" element={<CourseDetailPage />} />

                        {/* Public Exam Category Routes */}
                        <Route path="/exams/:slug" element={<ExamCategoryCoursesPage />} />

                        {/* Static Page Routes */}
                        <Route path="/contact-us" element={<ContactUsPage />} />
                        <Route path="/partnership" element={<PartnershipPage />} />
                        <Route path="/business-proposal" element={<BusinessProposalPage />} />
                        <Route path="/careers" element={<CareersPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
                        <Route path="/disclaimer" element={<DisclaimerPage />} />
                        <Route path="/sitemap" element={<SiteMapPage />} />
                        <Route path="/about-us" element={<AboutUsPage />} />
                        <Route path="/mission-vision" element={<MissionAndVisionPage />} />
                        <Route path="/why-join-us" element={<WhyJoinUsPage />} />
                        <Route path='/testimonials' element={<TestimonialsPage />} />
                        <Route path="/faqs" element={<FaqsPage />} />
                        <Route path="/help" element={<HelpPage />} />
                        <Route path="/webinar/:slug" element={<WebinarPage />} />


                        {/* Protected User Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
                            <Route path="/dashboard" element={<UserDashboardPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/my-courses" element={<MyCoursesPage />} />
                            <Route path="/videos" element={<VideosListPage />} />
                            <Route path="/videos/:videoId" element={<VideoWatchPage />} />
                            <Route path="/subscription-plans" element={<SubscriptionPlansPage />} />
                            <Route path="/subscription-plans/:planId" element={<SubscriptionPlanDetailPage />} />
                            <Route path="/my-subscription" element={<MySubscriptionPage />} />
                            <Route path="/notifications" element={<NotificationsPage />} />
                            <Route path="/professional-conversations" element={<ProfessionalConversationsPage />} />
                            <Route path="/modules/:moduleId/videos" element={<ModuleVideosPage />} />
                        </Route>

                        {/* Protected Admin Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                            <Route path="/admin/users" element={<AdminUsersListPage />} />
                            <Route path="/admin/users/:userId/manage-subscription" element={<AdminManageUserSubscriptionPage />} />
                            <Route path="/admin/videos" element={<AdminVideosListPage />} />
                            <Route path="/admin/videos/new" element={<AdminCreateVideoPage />} />
                            <Route path="/admin/videos/edit/:id" element={<AdminEditVideoPage />} />
                            <Route path="/admin/subscription-plans" element={<AdminSubscriptionPlansListPage />} />
                            <Route path="/admin/courses" element={<AdminCoursesListPage />} />
                            <Route path="/admin/courses/:courseId/modules" element={<AdminManageModulesPage />} />
                            <Route path="/admin/modules" element={<AdminModulesListPage />} />
                            <Route path="/admin/modules/:moduleId/videos" element={<AdminModuleVideosPage />} />
                            <Route path="/admin/blog" element={<AdminBlogListPage />} />
                            <Route path="/admin/blog/new" element={<AdminCreateEditBlogPostPage />} />
                            <Route path="/admin/blog/edit/:postId" element={<AdminCreateEditBlogPostPage />} />
                            <Route path="/admin/exam-categories" element={<AdminExamCategoriesPage />} />
                            <Route path='/admin/knowledgebase' element={<AdminKnowledgeBasePage />} />
                            <Route path='/admin/sentence-validation' element={<AdminSentenceValidationPage />} />
                            <Route path='/admin/daily-content' element={<AdminDailyContentPage />} />
                            <Route path='/admin/database-manager' element={<AdminDatabaseManagerPage />} />
                            <Route path='/admin/leads' element={<AdminWebinarLeadsPage />} />
                            <Route path='/admin/promo-banner' element={<AdminPromoBannerPage />} />
                            <Route path='/admin/certification-management' element={<AdminCertificationManagementPage />} />
                        </Route>

                        {/* Fallback Routes */}
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </Box>

            {/* Only show Footer for non-admin and non-user dashboard routes */}
            {!location.pathname.startsWith('/admin') &&
                !['/dashboard', '/profile', '/my-courses', '/videos', '/my-subscription', '/notifications', '/professional-conversations'].some(path =>
                    location.pathname === path || location.pathname.startsWith(path + '/')
                ) && <Footer />}
            {/* Chatbot: keep code, hide it from dashboards/admin */}
            {!location.pathname.startsWith('/admin') &&
                location.pathname !== '/dashboard' && (
                    <Suspense fallback={null}>
                        <ChatbotWidget />
                    </Suspense>
                )}
        </Box>
    );
}

function App() {
    const [isLanguageModalOpen, setLanguageModalOpen] = useState(() => !getLanguageChoiceMade());

    useEffect(() => {
        if (!getLanguageChoiceMade()) {
            setLanguageModalOpen(true);
        }
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <LanguageProvider
                isLanguageModalOpen={isLanguageModalOpen}
                setLanguageModalOpen={setLanguageModalOpen}
            >
                <Router>
                    <CssBaseline />
                    {/* Security protection only in production */}
                    {import.meta.env.PROD && <SecurityProtection />}
                    <ScrollToTop />
                    <LanguageSwitcherModal />
                    <NotificationContainer />
                    <AppContent />
                </Router>
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App;
