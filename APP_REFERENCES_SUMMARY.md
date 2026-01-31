# App References Summary

This document lists all references to the three apps across the project:
1. **KNOWLEDGE_NATION** / knowledge-nation
2. **Tutor Uncle** / tutoruncle
3. **first-ias** / First IAS

---

## Backend Files

### 1. Configuration Files

#### `coaching-platform-backend/src/config/razorpayConfig.js`
- **Lines 7-8**: `'knowledge-nation': 'knowledge-nation'` and `'first-ias': 'first-ias'` in APP_IDENTIFIERS
- **Line 18**: Default fallback to `'first-ias'`
- **Lines 21-24**: `'first-ias'` Razorpay config
- **Lines 26-29**: `'knowledge-nation'` Razorpay config
- **Line 39**: Fallback to `'first-ias'`
- **Line 54**: Default app identifier `'first-ias'`

#### `coaching-platform-backend/.env.example`
- **Line 92**: `KNOWLEDGE_NATION_FRONTEND_URL=https://knowledgenation.online`
- **Line 93**: `TUTORUNCLE_FRONTEND_URL=https://www.tutoruncle.co.in`
- **Line 94**: `FIRST_IAS_FRONTEND_URL=https://www.tutoruncle.co.in`
- **Lines 100-102**: `RAZORPAY_KEY_ID_FIRST_IAS`, `RAZORPAY_KEY_SECRET_FIRST_IAS`, `RAZORPAY_WEBHOOK_SECRET_FIRST_IAS`
- **Lines 105-107**: `RAZORPAY_KEY_ID_KNOWLEDGE_NATION`, `RAZORPAY_KEY_SECRET_KNOWLEDGE_NATION`, `RAZORPAY_WEBHOOK_SECRET_KNOWLEDGE_NATION`

---

### 2. Controllers

#### `coaching-platform-backend/src/controllers/authController.js`
- **Line 20**: Comment: `// Supports: knowledge-nation (web), tutoruncle (web), first-ias (app only)`
- **Line 33**: `'knowledge-nation': process.env.KNOWLEDGE_NATION_FRONTEND_URL || 'https://knowledgenation.online'`
- **Line 34**: `'tutoruncle': process.env.TUTORUNCLE_FRONTEND_URL || 'https://www.tutoruncle.co.in'`
- **Line 35**: `'first-ias': process.env.FIRST_IAS_FRONTEND_URL || process.env.FRONTEND_URL || 'https://www.tutoruncle.co.in'`
- **Line 42**: Comment: `// Priority 3: Default to tutoruncle (most common web frontend)`
- **Line 43**: Default fallback to `'https://www.tutoruncle.co.in'`
- **Line 481**: `if (appIdentifier && ['first-ias', 'knowledge-nation'].includes(appIdentifier))`
- **Line 488**: `if (appIdentifier === 'first-ias') appName = 'First IAS';`
- **Line 489**: `if (appIdentifier === 'knowledge-nation') appName = 'Knowledge Nation';`
- **Line 521**: `const resetURL = 'https://www.tutoruncle.co.in/reset-password/${resetToken}';`
- **Line 525**: Email text: `"Please click on the button below to reset your password for Tutor Uncle:"`
- **Line 532**: Email subject: `'Your Tutor Uncle Password Reset Link'`
- **Lines 748, 831, 852**: Multiple fallbacks to `'https://www.tutoruncle.co.in'`

#### `coaching-platform-backend/src/controllers/firstIasController.js`
- **Line 7**: Constant: `const UPSC_SLUG = 'upsc-civil-services';`
- **Line 10**: Comment: `* @desc    Get featured UPSC courses for the First_IAS homepage`
- **Line 11**: Route: `* @route   GET /api/ias/featured-courses`
- **Line 35**: Route: `* @route   GET /api/ias/courses`
- **Line 77**: Route: `* @route   GET /api/ias/videos`

#### `coaching-platform-backend/src/controllers/knowledgeNationController.js`
- **Line 7**: Constant: `const LAW_SLUG = 'law-entrance';`
- **Line 10**: Comment: `* @desc    Get a list of featured LAW courses for the homepage`
- **Line 11**: Route: `* @route   GET /api/kn/featured-courses`
- **Line 35**: Comment: `* @desc    Get all published LAW courses (paginated) for Knowledge Nation`
- **Line 36**: Route: `* @route   GET /api/kn/courses`
- **Line 78**: Comment: `* @desc    Get all published LAW videos (paginated) for Knowledge Nation`
- **Line 79**: Route: `* @route   GET /api/kn/videos`

#### `coaching-platform-backend/src/controllers/paymentController.js`
- **Line 151**: Default fallback: `let appIdentifier = 'first-ias'; // Default fallback`

#### `coaching-platform-backend/src/controllers/leadController.js`
- **Line 52**: Email from: `"Tutor Uncle Leads" <${process.env.EMAIL_USER}>`
- **Line 104**: Email from: `"Tutor Uncle Leads" <${process.env.EMAIL_USER}>`

#### `coaching-platform-backend/src/controllers/formSubmissionController.js`
- **Line 33**: Email from: `"Tutor Uncle Forms" <${process.env.EMAIL_USER}>`

#### `coaching-platform-backend/src/controllers/aiController.js`
- **Line 48**: Comment mentions `tutoruncle.co.in` (in API URL context)

---

### 3. Routes

#### `coaching-platform-backend/src/routes/index.js`
- **Line 36**: `import knowledgeNationRoutes from './knowledgeNationRoutes.js';`
- **Line 37**: `import firstIasRoutes from './firstIasRoutes.js';`
- **Line 66**: `router.use('/kn', knowledgeNationRoutes);`
- **Line 68**: `router.use('/ias', firstIasRoutes);`

#### `coaching-platform-backend/src/routes/firstIasRoutes.js`
- **Line 2**: Import: `import { getUpscCourses, getUpscVideos, getFeaturedUpscCourses } from '../controllers/firstIasController.js';`
- **Line 6**: Comment: `// Public routes for First IAS (UPSC) - matching public course routes pattern`

#### `coaching-platform-backend/src/routes/knowledgeNationRoutes.js`
- **Line 2**: Import: `import { getLawCourses, getLawVideos, getFeaturedLawCourses } from '../controllers/knowledgeNationController.js';`
- **Line 6**: Comment: `// Public routes for Knowledge Nation (Law) - matching public course routes pattern`

---

### 4. Server Files

#### `coaching-platform-backend/src/server.js`
- **Line 62**: Health check response: `res.send('Tutor Uncle Backend is Alive!');`

---

### 5. Documentation Files

#### `coaching-platform-backend/RAZORPAY_MULTI_APP_SETUP.md`
- **Line 7**: Mentions "First IAS, Knowledge Nation, etc."
- **Lines 18-25**: First IAS Razorpay configuration examples
- **Lines 44-45**: Knowledge Nation Razorpay credentials
- **Line 56**: `BUNNY_STORAGE_ZONE_NAME=tutoruncle-stream-storage`
- **Line 64**: `FRONTEND_URL=https://www.tutoruncle.co.in`
- **Line 77**: Comment about Knowledge Nation credentials
- **Lines 94, 99, 116, 128, 175, 184**: Examples with `x-app-identifier: first-ias` and `x-app-identifier: knowledge-nation`
- **Line 201**: `RAZORPAY_WEBHOOK_SECRET_KNOWLEDGE_NATION`
- **Line 208**: `knowledge-nation` identifier check

---

## Frontend Files

### 1. Configuration Files

#### `coaching-platform-frontend/.env.example`
- **Line 11**: Comment: `# Production: https://api.tutoruncle.co.in/api`

---

### 2. Components

#### `coaching-platform-frontend/src/components/layout/Footer.tsx`
- **Line 70**: Typography: `<Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Tutor Uncle</Typography>`
- **Line 75**: YouTube link: `href="https://youtube.com/@tutoruncle"`
- **Line 76**: Instagram link: `href="https://www.instagram.com/tutor_uncle_official"`
- **Line 92**: Footer text: `Tutor Uncle`

#### `coaching-platform-frontend/src/components/layout/Navbar.tsx`
- **Line 54**: Logo src: `src="/tutor-uncle-logo-nav.png"`
- **Line 55**: Logo alt: `alt="Tutor Uncle Logo"`

---

### 3. Pages

#### `coaching-platform-frontend/src/pages/VideoWatchPage.tsx`
- **Line 155**: Watermark text: `const watermarkText = user ? '${user.email} | ${user.phoneNumber || ''}' : 'Tutor Uncle';`

#### `coaching-platform-frontend/src/pages/CoursesListPage.tsx`
- **Line 80**: Comment: `// Use the same logic as knowledge-nation-frontend CourseCard`

#### `coaching-platform-frontend/src/pages/CourseDetailPage.tsx`
- Contains references to `tutoruncle.co.in` in API URLs

#### `coaching-platform-frontend/src/pages/SubscriptionPlanDetailPage.tsx`
- Contains references to `tutoruncle.co.in` in API URLs

#### `coaching-platform-frontend/src/pages/BlogPostDetailPage.tsx`
- Contains references to `tutoruncle.co.in` in API URLs

#### `coaching-platform-frontend/src/pages/static/ContactUsPage.tsx`
- Contains references to `tutoruncle.co.in` in API URLs

#### `coaching-platform-frontend/src/pages/static/WhyJoinTutorUnclePage.tsx`
- Entire page dedicated to "Tutor Uncle"

#### `coaching-platform-frontend/src/pages/static/AboutUsPage.tsx`
- Contains "Tutor Uncle" branding and content

#### `coaching-platform-frontend/src/pages/static/FaqsPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/TestimonialsPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/CareersPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/TermsAndConditionsPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/PrivacyPolicyPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/MissionAndVisionPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/DisclaimerPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/PartnershipPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/BusinessProposalPage.tsx`
- Contains "Tutor Uncle" references

#### `coaching-platform-frontend/src/pages/static/SiteMapPage.tsx`
- Contains "Tutor Uncle" references

---

### 4. Services

#### `coaching-platform-frontend/src/services/apiClient.ts`
- **Line 5**: Default API URL: `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.tutoruncle.co.in/api';`

#### `coaching-platform-frontend/src/services/subscriptionService.ts`
- Contains references to `tutoruncle.co.in` in API URLs

---

### 5. App Configuration

#### `coaching-platform-frontend/src/App.tsx`
- **Line 76**: Lazy import: `const WhyJoinTutorUnclePage = lazy(() => import('./pages/static/WhyJoinTutorUnclePage'));`
- **Line 155**: Route: `<Route path="/why-join-us" element={<WhyJoinTutorUnclePage />} />`

---

### 6. HTML Files

#### `coaching-platform-frontend/index.html`
- Contains "Tutor Uncle" in meta tags and title

---

### 7. Build/Dist Files

All files in `coaching-platform-frontend/dist/` contain compiled references to "Tutor Uncle" (these are generated from source files and will be regenerated on build).

---

## Summary by App

### KNOWLEDGE_NATION / knowledge-nation
**Total Files: 5**
1. `coaching-platform-backend/src/config/razorpayConfig.js`
2. `coaching-platform-backend/.env.example`
3. `coaching-platform-backend/src/controllers/authController.js`
4. `coaching-platform-frontend/src/pages/CoursesListPage.tsx`
5. `coaching-platform-backend/RAZORPAY_MULTI_APP_SETUP.md`

**Routes:**
- `/api/kn/featured-courses`
- `/api/kn/courses`
- `/api/kn/videos`

**Controllers:**
- `knowledgeNationController.js`
- `knowledgeNationRoutes.js`

---

### Tutor Uncle / tutoruncle
**Total Files: 66+** (including dist files)
**Key Files:**
1. Backend: `authController.js`, `server.js`, `leadController.js`, `formSubmissionController.js`
2. Frontend: All static pages, Footer, Navbar, App.tsx, index.html
3. Configuration: `.env.example` files
4. Documentation: `RAZORPAY_MULTI_APP_SETUP.md`

**Branding:**
- Logo files: `/tutor-uncle-logo-nav.png`, `/tutor-uncle-logo.png`
- Social media: YouTube `@tutoruncle`, Instagram `@tutor_uncle_official`
- Domain: `tutoruncle.co.in`, `api.tutoruncle.co.in`

---

### first-ias / First IAS
**Total Files: 8**
1. `coaching-platform-backend/src/config/razorpayConfig.js`
2. `coaching-platform-backend/.env.example`
3. `coaching-platform-backend/src/controllers/authController.js`
4. `coaching-platform-backend/src/routes/index.js`
5. `coaching-platform-backend/src/controllers/paymentController.js`
6. `coaching-platform-backend/src/routes/firstIasRoutes.js`
7. `coaching-platform-backend/src/controllers/firstIasController.js`
8. `coaching-platform-backend/RAZORPAY_MULTI_APP_SETUP.md`

**Routes:**
- `/api/ias/featured-courses`
- `/api/ias/courses`
- `/api/ias/videos`

**Controllers:**
- `firstIasController.js`
- `firstIasRoutes.js`

---

## Notes

1. **Environment Variables**: All three apps have frontend URL configurations in `.env.example`
2. **Razorpay Integration**: Both `first-ias` and `knowledge-nation` have separate Razorpay configurations
3. **Default Fallbacks**: The system defaults to `first-ias` in several places
4. **Tutor Uncle**: Most widespread branding, appears in UI, emails, and documentation
5. **Route Prefixes**: 
   - Knowledge Nation: `/api/kn/*`
   - First IAS: `/api/ias/*`
6. **Build Files**: The `dist/` folder contains compiled references but these are generated from source
