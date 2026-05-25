# Verble Frontend - Complete Documentation

React-based English Learning Platform Frontend

---

## 📝 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Authentication Setup](#authentication-setup)
5. [Development](#development)
6. [Build & Deploy](#build--deploy)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

Modern React frontend for the Verble English learning platform.

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **State Management**: React Context API + TanStack Query
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Authentication**: JWT + Google OAuth
- **Video Player**: Custom Bunny CDN integration

### Features
- 📚 Interactive daily learning content
- 🎮 Gamification with points and levels
- 🎥 Video course streaming
- 💳 Razorpay payment integration
- 🔐 Multiple authentication methods
- 📱 Responsive design
- 🌐 Multi-app support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend server running (see backend README)

### Installation

```bash
# Navigate to frontend directory
cd coaching-platform-frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

Frontend will start at `http://localhost:5173`

---

## ⚙️ Environment Configuration

### Development Environment

Create `.env` file in the frontend root:

```env
# ===========================================
# API CONFIGURATION
# ===========================================
# Development
VITE_API_BASE_URL=http://localhost:5000/api

# Production
# VITE_API_BASE_URL=https://api.yourdomain.com/api

# ===========================================
# GOOGLE OAUTH CONFIGURATION
# ===========================================
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id

# ===========================================
# APPLICATION CONFIGURATION
# ===========================================
VITE_APP_NAME=Verble
VITE_APP_URL=http://localhost:5173
```

### Production Environment

For production deployment, update:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_URL=https://www.yourdomain.com
```

### Environment Variables Explained

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | ✅ Yes |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | ⚠️ For OAuth |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_URL` | Frontend URL | No |

---

## 🔐 Authentication Setup

### Google OAuth Configuration

The frontend supports Google Sign-In for quick authentication.

#### Google Cloud Console Setup

1. **Create OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth 2.0 Client ID**
   - Choose **Web application**

2. **Configure Authorized JavaScript Origins:**
   ```
   http://localhost:5173
   https://www.yourdomain.com
   ```

3. **Configure Authorized Redirect URIs:**
   ```
   http://localhost:5000/api/auth/google/callback
   https://api.yourdomain.com/api/auth/google/callback
   ```
   
   ⚠️ **Note:** Redirect URIs point to the **backend**, not frontend

4. **Copy Client ID:**
   - Copy the Web Client ID
   - Add to frontend `.env`:
     ```env
     VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
     ```

#### How Google OAuth Works

1. User clicks "Continue with Google" button
2. Frontend calls `GET /api/auth/google` to get OAuth URL
3. User redirects to Google login page
4. After successful login, Google redirects to backend callback
5. Backend validates, creates/updates user, and returns JWT
6. Backend redirects to frontend with token
7. Frontend stores token and logs in user

#### Components

**GoogleLoginButton** (`src/components/common/GoogleLoginButton.tsx`)
```tsx
import GoogleLoginButton from '../components/common/GoogleLoginButton';

<GoogleLoginButton
  onSuccess={() => console.log('Login successful!')}
  onError={(error) => console.error('Login failed:', error)}
  fullWidth
  variant="outlined"
/>
```

**GoogleAccountManager** (`src/components/common/GoogleAccountManager.tsx`)
```tsx
import GoogleAccountManager from '../components/common/GoogleAccountManager';

// For user profile page
<GoogleAccountManager />
```

**GoogleCallbackPage** (`src/pages/GoogleCallbackPage.tsx`)
- Handles the OAuth callback from backend
- Automatically extracts token from URL
- Logs in user and redirects to dashboard

#### Custom Hook

**useGoogleAuth** (`src/hooks/useGoogleAuth.ts`)
```tsx
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const {
  initiateGoogleLogin,
  linkGoogleAccount,
  unlinkGoogleAccount,
  isLoading,
  error
} = useGoogleAuth();

// Initiate login
const handleGoogleLogin = () => {
  initiateGoogleLogin();
};

// Link account (from profile page)
const handleLinkAccount = async () => {
  await linkGoogleAccount();
};

// Unlink account
const handleUnlinkAccount = async () => {
  await unlinkGoogleAccount();
};
```

### Email Authentication

Traditional email/password authentication with OTP verification.

**Login Flow:**
1. User enters email and password
2. If email not verified, OTP is sent
3. User enters OTP to verify
4. User is logged in

**Components:**
- `LoginPage.tsx` - Email/password login form
- `RegistrationPage.tsx` - User registration form

### Mobile OTP Authentication

Login/register with mobile number (OTP sent via email temporarily).

**Flow:**
1. User enters mobile number
2. OTP is sent to registered email
3. User enters OTP
4. User is logged in or registered

---

## 🛠️ Development

### Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/          # Common UI components
│   ├── features/        # Feature-specific components
│   └── layout/          # Layout components (Header, Footer, Navbar)
├── contexts/            # React Context providers
│   └── AuthContext.tsx  # Authentication context
├── hooks/               # Custom React hooks
│   └── useGoogleAuth.ts
├── pages/               # Page components (routes)
│   ├── LoginPage.tsx
│   ├── HomePage.tsx
│   └── ...
├── services/            # API service layer
│   ├── apiClient.ts     # Axios configuration
│   ├── authService.ts   # Auth API calls
│   └── ...
├── utils/               # Utility functions
├── App.tsx              # Main app component with routes
└── main.tsx             # Entry point
```

### Key Components

**Layout Components:**
- `Navbar.tsx` - Top navigation bar
- `Footer.tsx` - Footer with social links
- `SideMenuView.tsx` - Sidebar navigation (if applicable)

**Authentication:**
- `LoginPage.tsx` - Login page
- `RegistrationPage.tsx` - Registration page
- `GoogleCallbackPage.tsx` - OAuth callback handler

**Learning Features:**
- `WordOfTheDayCard.tsx` - Word of the day component
- `PhraseCard.tsx` - Phrase of the day component
- `StoryCard.tsx` - Story reading component
- `VocabularySetCard.tsx` - Vocabulary learning component
- `ConversationChat.tsx` - Conversation practice component

**Gamification:**
- `HomePage.tsx` - User dashboard with progress
- `Leaderboard.tsx` - Points leaderboard

### Routing

Routes are defined in `App.tsx`:

```tsx
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegistrationPage />} />
  <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
  
  {/* Protected Routes */}
  <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
  <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
  
  {/* ... */}
</Routes>
```

### State Management

**Auth Context:**
```tsx
import { useAuth } from '../contexts/AuthContext';

const { user, login, logout, isAuthenticated } = useAuth();
```

**TanStack Query (for API calls):**
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['courses'],
  queryFn: () => apiClient.get('/courses')
});
```

### API Service Layer

All API calls go through `apiClient.ts`:

```tsx
import apiClient from '../services/apiClient';

// GET request
const response = await apiClient.get('/daily-content');

// POST request
const response = await apiClient.post('/submit-sentence', {
  wordId: 'word_id',
  sentence: 'My sentence'
});

// With headers
const response = await apiClient.post('/payments/create-order', data, {
  headers: { 'x-app-identifier': 'verble' }
});
```

### Styling

Uses Material-UI (MUI) components:

```tsx
import { Box, Typography, Button, TextField } from '@mui/material';

<Box sx={{ padding: 2 }}>
  <Typography variant="h4">Title</Typography>
  <Button variant="contained" color="primary">
    Click Me
  </Button>
</Box>
```

### Custom Hooks

See `src/hooks/` for project-specific hooks (e.g. `useGoogleAuth.ts`).

---

## 📦 Build & Deploy

### Development Build

```bash
npm run dev
```

Runs dev server with hot-reload at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Build output goes to `dist/` directory.

### Deployment Options

#### Option 1: Static Hosting (Netlify, Vercel, etc.)

```bash
# Build
npm run build

# Deploy dist/ folder to your hosting platform
```

#### Option 2: Nginx

```bash
# Build
npm run build

# Copy dist/ to nginx html directory
cp -r dist/* /usr/share/nginx/html/

# Configure nginx
```

Example nginx config:
```nginx
server {
    listen 80;
    server_name www.yourdomain.com;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000/api;
    }
}
```

#### Option 3: Docker

See `docker-compose.vps.yml` in root for combined backend+frontend deployment.

### Environment-Specific Builds

Vite uses `.env` files:
- `.env` - Default (all environments)
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production-specific

---

## 🔧 Troubleshooting

### API Connection Issues

**Problem:** Frontend can't connect to backend

**Solutions:**
```bash
# 1. Check backend is running
curl http://localhost:5000/api/auth/google

# 2. Verify VITE_API_BASE_URL in .env
cat .env

# 3. Check CORS configuration in backend
# Backend should allow requests from localhost:5173

# 4. Clear browser cache and restart dev server
npm run dev
```

### Google OAuth Not Working

**Problem:** Google login fails or redirects incorrectly

**Solutions:**
1. **Check Client ID:**
   ```bash
   # Verify VITE_GOOGLE_CLIENT_ID is set
   cat .env | grep GOOGLE_CLIENT_ID
   ```

2. **Verify Google Cloud Console:**
   - Authorized JavaScript origins include your frontend URL
   - Redirect URIs include your **backend** callback URL
   - OAuth consent screen is configured

3. **Check Network Tab:**
   - Look for failed `/api/auth/google` request
   - Check for CORS errors
   - Verify redirect URL

4. **Backend Configuration:**
   - Ensure backend `GOOGLE_WEB_CLIENT_ID` matches frontend
   - Check backend `GOOGLE_WEB_REDIRECT_URI` is correct

### Build Errors

**Problem:** `npm run build` fails

**Solutions:**
```bash
# 1. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Check TypeScript errors
npm run type-check

# 3. Fix linting errors
npm run lint

# 4. Clear Vite cache
rm -rf node_modules/.vite
```

### Routing Issues (404 on Refresh)

**Problem:** Page works on navigation but 404 on refresh

**Solution:**
This is common with single-page apps. Configure your server:

**Nginx:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Netlify:**
Create `public/_redirects`:
```
/*  /index.html  200
```

**Vercel:**
Automatically handled

### Material-UI Theme Issues

**Problem:** MUI components look broken

**Solutions:**
1. Ensure `@mui/material` and `@emotion/react` are installed
2. Check for conflicting CSS
3. Verify ThemeProvider is wrapping the app

### Video Player Issues

**Problem:** Videos won't play

**Solutions:**
1. Check Bunny CDN token auth key is correct
2. Verify video URLs are properly formatted
3. Check browser console for CORS errors
4. Ensure user has valid subscription

---

## 📞 Support

For issues:
1. Check this documentation
2. Review browser console errors
3. Check network tab for failed requests
4. Verify environment variables
5. Ensure backend is running and accessible

---

## 📄 License

This project is proprietary software.

---

**Last Updated:** February 2026
