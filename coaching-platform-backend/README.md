# Verble Backend - Complete Documentation

English Learning Platform with Gamification, Daily Challenges, and Video Courses

---

## 📝 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Authentication & OAuth](#authentication--oauth)
6. [Payment Integration](#payment-integration)
7. [API Documentation](#api-documentation)
8. [Deployment](#deployment)
9. [Features & Implementation Status](#features--implementation-status)
10. [Development](#development)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

Verble is an online coaching/streaming platform focused on English learning with:
- **Gamification System**: Points, coins, membership levels, streaks
- **Daily Content**: Word/Phrase of the day, stories, puzzles, conversations
- **Full Course System**: Video courses with progress tracking
- **Payment Integration**: Razorpay for subscriptions
- **Multi-App Support**: Supports multiple apps (First IAS, Knowledge Nation, etc.)

### Tech Stack
- **Runtime**: Node.js with Express
- **Database**: MongoDB (with Mongoose ODM)
- **Cache/Session**: Redis
- **Authentication**: JWT, Google OAuth, Email OTP, Mobile OTP
- **Payments**: Razorpay
- **CDN**: Bunny CDN for video streaming
- **Email**: Gmail SMTP

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Redis (optional but recommended)
- Git

### Installation

```bash
# Clone repository
cd coaching-platform-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start MongoDB (if using local)
brew services start mongodb-community

# Start Redis (optional)
brew services start redis

# Run development server
npm run dev
```

Server will start at `http://localhost:5000`

---

## ⚙️ Environment Configuration

### Development Environment

Create `.env` file with these variables:

```env
# ===========================================
# APPLICATION CONFIGURATION
# ===========================================
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/verble

# OR MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/verble

# ===========================================
# REDIS CONFIGURATION (Optional)
# ===========================================
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# ===========================================
# JWT CONFIGURATION
# ===========================================
# Generate secure secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-secure-random-secret-here
JWT_EXPIRES_IN=7d
JWT_EXPIRES_IN_SECONDS=604800

# ===========================================
# EMAIL CONFIGURATION (Gmail)
# ===========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# ===========================================
# GOOGLE OAUTH CONFIGURATION
# ===========================================
GOOGLE_WEB_CLIENT_ID=your-google-client-id
GOOGLE_WEB_CLIENT_SECRET=your-google-client-secret
GOOGLE_WEB_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
GOOGLE_ANDROID_REDIRECT_URI=com.mars.education.pvt.ltd:/oauth2redirect

# ===========================================
# PAYMENT CONFIGURATION (RAZORPAY)
# ===========================================
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# ===========================================
# BUNNY CDN CONFIGURATION
# ===========================================
BUNNY_STREAM_LIBRARY_ID=your-library-id
BUNNY_STREAM_API_KEY=your-stream-api-key
BUNNY_TOKEN_AUTH_KEY=your-token-auth-key
BUNNY_STORAGE_ZONE_NAME=your-storage-zone
BUNNY_STORAGE_HOSTNAME=sg.storage.bunnycdn.com
BUNNY_STORAGE_ACCESS_KEY=your-storage-access-key

# ===========================================
# AI CONFIGURATION (Optional)
# ===========================================
GEMINI_API_KEY=your-gemini-api-key
ENABLE_AI_VALIDATION=false

# ===========================================
# NOTIFICATIONS (Optional)
# ===========================================
ENABLE_DAILY_NOTIFICATIONS=true
DAILY_NOTIFICATION_SCHEDULE=0 9 * * *
TZ=Asia/Kolkata
```

### Production Environment

Update these for production:

```env
NODE_ENV=production
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://www.yourdomain.com
GOOGLE_WEB_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback
MONGODB_URI=mongodb+srv://production-credentials
```

### Generating Secure Secrets

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ Database Setup

### MongoDB Configuration

**Option 1: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Use in .env
MONGODB_URI=mongodb://localhost:27017/verble
```

**Option 2: MongoDB Atlas (Recommended for Production)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/verble
   ```

### Redis Configuration

Redis is optional but recommended for sessions and caching.

```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

---

## 🔐 Authentication & OAuth

### Email OTP Authentication

Users can register/login with email + OTP verification.

**Endpoints:**
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-verification-email` - Resend OTP

### Mobile OTP Authentication

Users can register/login with mobile number (OTP sent via email until SMS provider is configured).

**Endpoints:**
- `POST /api/auth/mobile/send-otp` - Send OTP to mobile
- `POST /api/auth/mobile/verify-otp` - Verify OTP and login/register
- `POST /api/auth/mobile/login` - Login with mobile
- `POST /api/auth/mobile/register` - Register with mobile

### Google OAuth Setup

**Backend Configuration:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized origins:
   - `http://localhost:5173`
   - `https://www.yourdomain.com`
4. Add redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `https://api.yourdomain.com/api/auth/google/callback`
5. Update `.env` with credentials

**Endpoints:**
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback` - Handle Google callback
- `POST /api/auth/link-google` - Link Google account
- `DELETE /api/auth/unlink-google` - Unlink Google account

### Gmail App Password Setup

For email functionality:

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `.env`:
   ```env
   EMAIL_PASS=abcdefghijklmnop
   ```

---

## 💳 Payment Integration

### Razorpay Multi-App Setup

The backend supports multiple apps with separate Razorpay accounts.

#### Configuration

Add app-specific Razorpay credentials to `.env`:

```env
# First IAS
RAZORPAY_KEY_ID_FIRST_IAS=rzp_live_xxx
RAZORPAY_KEY_SECRET_FIRST_IAS=xxx
RAZORPAY_WEBHOOK_SECRET_FIRST_IAS=xxx

# Knowledge Nation
RAZORPAY_KEY_ID_KNOWLEDGE_NATION=rzp_live_xxx
RAZORPAY_KEY_SECRET_KNOWLEDGE_NATION=xxx
RAZORPAY_WEBHOOK_SECRET_KNOWLEDGE_NATION=xxx
```

#### Client Implementation

Frontend must send `x-app-identifier` header:

```javascript
// For First IAS
headers: { 'x-app-identifier': 'first-ias' }

// For Knowledge Nation
headers: { 'x-app-identifier': 'knowledge-nation' }
```

#### Payment Flow

**Create Order:**
```bash
POST /api/payments/create-order
Headers: {
  Authorization: Bearer <token>,
  x-app-identifier: knowledge-nation
}
Body: { planId: "plan_id_here" }
```

**Verify Payment:**
```bash
POST /api/payments/verify-payment
Headers: {
  Authorization: Bearer <token>,
  x-app-identifier: knowledge-nation
}
Body: {
  razorpay_order_id: "...",
  razorpay_payment_id: "...",
  razorpay_signature: "...",
  planId: "plan_id_here"
}
```

#### Webhook Configuration

Configure webhook in each Razorpay dashboard:
- URL: `https://api.yourdomain.com/api/payments/razorpay-webhook`
- Events: `payment.captured`, `order.paid`

---

## 🔌 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.yourdomain.com/api
```

### Authentication

Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Core Endpoints

#### Auth Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email OTP
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `PATCH /api/auth/reset-password/:token` - Reset password

#### Mobile OTP
- `POST /api/auth/mobile/send-otp` - Send mobile OTP
- `POST /api/auth/mobile/verify-otp` - Verify mobile OTP
- `POST /api/auth/mobile/login` - Login with mobile
- `POST /api/auth/mobile/register` - Register with mobile

#### Google OAuth
- `GET /api/auth/google` - Get Google OAuth URL
- `GET /api/auth/google/callback` - Google callback
- `POST /api/auth/link-google` - Link Google account
- `DELETE /api/auth/unlink-google` - Unlink Google account

#### User Management
- `GET /api/users/me` - Get user profile
- `PATCH /api/users/me` - Update user profile

#### Daily Content
- `GET /api/daily-content` - Get daily content
- `GET /api/daily-content/type/:type` - Get content by type
- `GET /api/daily-quote` - Get daily quote

#### Submissions
- `POST /api/submit-sentence` - Submit word sentence
- `POST /api/submit-story-summary` - Submit story summary
- `POST /api/submit-vocab-sentences` - Submit vocabulary sentences
- `POST /api/submit-puzzle` - Submit puzzle answers
- `POST /api/submit-scene-description` - Submit scene description
- `POST /api/submit-speech-description` - Submit speech description

#### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify-payment` - Verify payment
- `POST /api/payments/razorpay-webhook` - Razorpay webhook

#### Admin Endpoints
- `POST /api/admin/notifications/trigger-daily` - Trigger daily notifications
- `GET /api/admin/sentence-validation` - View all submissions
- All daily content management endpoints

---

## 🚢 Deployment

### Docker Deployment

#### Option 1: Services Only (Development)

Run MongoDB and Redis in Docker, backend locally:

```bash
# Start MongoDB and Redis
docker compose -f docker-compose.services.yml up -d

# Check status
docker compose -f docker-compose.services.yml ps

# Run backend locally
npm run dev

# Stop services
docker compose -f docker-compose.services.yml down
```

#### Option 2: Full Stack (Production)

Run everything in Docker:

```bash
# Start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop all
docker compose down

# Remove volumes (clean slate)
docker compose down -v
```

### VPS Deployment

Deploy backend + frontend + MongoDB + Redis as one Docker stack on a single port.

**Prerequisites:**
- Docker and Docker Compose on VPS
- Free port (default 3000)

**Quick Deploy:**

```bash
# 0. One-command deploy (after first-time setup)
./scripts/ready-to-deploy.sh

# 1. Clone and prepare
cd /path/to/Verble
cp coaching-platform-backend/.env.example coaching-platform-backend/.env

# 2. Generate secrets
node coaching-platform-backend/scripts/generate-secrets.js

# 3. Configure .env
nano coaching-platform-backend/.env
# Set BASE_URL, email, Razorpay, etc.

# 4. Build and start
docker compose -f docker-compose.vps.yml build
docker compose -f docker-compose.vps.yml up -d

# 5. Check status
docker compose -f docker-compose.vps.yml ps
```

**Expose via Reverse Proxy:**

Add to your existing Nginx/Caddy:

```nginx
# Nginx example
server {
    listen 80;
    server_name verble.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```text
# Caddy example
verble.yourdomain.com { reverse_proxy localhost:3000 }
```

**If port 3000 is in use**, change it in `docker-compose.vps.yml`:
```yaml
ports:
  - "3001:80"  # Use any free port
```

**Useful Commands:**
```bash
# View logs
docker compose -f docker-compose.vps.yml logs -f

# Restart
docker compose -f docker-compose.vps.yml restart

# Update after code changes
docker compose -f docker-compose.vps.yml build
docker compose -f docker-compose.vps.yml up -d
```

### Coolify Deployment

Install Coolify on Ubuntu 22.04 VPS.

**Transfer and run installation script:**

```bash
# Transfer script
scp install-coolify.sh root@your-server-ip:/root/

# SSH into VPS
ssh root@your-server-ip

# Run installation
chmod +x install-coolify.sh
sudo ./install-coolify.sh
```

**What the script does:**
1. Updates system packages
2. Installs Docker Engine
3. Installs Docker Compose
4. Configures UFW firewall (ports 22, 80, 443, 8000)
5. Installs Coolify

**Access Coolify:**
- URL: `http://your-server-ip:8000`
- Follow setup wizard

**Useful commands:**
```bash
# Check Docker
docker ps

# Check Coolify
docker logs coolify

# Check firewall
ufw status
```

---

## ✨ Features & Implementation Status

### Implemented Features ✅

**Backend Foundation:**
- ✅ User model with gamification (points, coins, levels, streaks)
- ✅ DailyContent model (10 content types)
- ✅ GamificationService with level progression
- ✅ Sentence submission tracking
- ✅ Daily content API endpoints

**Authentication:**
- ✅ Email + password authentication
- ✅ Email OTP verification
- ✅ Mobile OTP login/register
- ✅ Google OAuth integration

**Content Types:**
- ✅ Word of the Day
- ✅ Phrase of the Day
- ✅ Story (One Minute Read)
- ✅ Weekly Vocabulary Set
- ✅ Puzzles (2 types)
- ✅ Scene/Situation
- ✅ Famous Speeches
- ✅ Song Lyrics
- ✅ Instagram Feeds
- ✅ Professional Conversations
- ✅ AI Prompts Section

**Gamification:**
- ✅ Points system
- ✅ Level unlocking (70% rule + streaks)
- ✅ Leaderboards
- ✅ Daily progress tracking

**Full Course:**
- ✅ Module structure
- ✅ Video sequential unlocking
- ✅ Module tests/quizzes
- ✅ Certificate assessment
- ✅ E-certificate generation

**Payment & Subscriptions:**
- ✅ Razorpay integration
- ✅ Multi-app support
- ✅ Subscription expiration logic

**Other Features:**
- ✅ Daily notifications system
- ✅ Help/Knowledge Base
- ✅ Sentence validation (AI + manual)
- ✅ Screen recording protection

### Overall Readiness: ~95%

### Pending/Future Work

- SMS provider integration (DLT verification pending)
- Additional content refinement
- Performance optimizations
- Advanced analytics

---

## 🛠️ Development

### Daily Notifications Setup

Automated daily notifications for puzzles and challenge reminders.

**Install dependency:**
```bash
npm install node-cron
```

**Configuration:**
```env
ENABLE_DAILY_NOTIFICATIONS=true
DAILY_NOTIFICATION_SCHEDULE=0 9 * * *  # 9 AM daily
TZ=Asia/Kolkata
```

**Manual Testing (Admin only):**
```bash
# Trigger all daily notifications
POST /api/admin/notifications/trigger-daily

# Trigger puzzle/task notifications
POST /api/admin/notifications/trigger-puzzle-tasks

# Trigger challenge reminders
POST /api/admin/notifications/trigger-reminders
```

**Cron Schedule Format:**
- `0 9 * * *` - Every day at 9:00 AM
- `0 8 * * 1-5` - Weekdays at 8:00 AM
- `0 9,18 * * *` - Twice daily at 9 AM and 6 PM

### Development Patterns

Follow these patterns when building features:

**1. User Schema Updates:**
Add gamification fields (points, coins, streaks, etc.)

**2. Daily Content Creation:**
Create content with proper type, level, and metadata

**3. Gamification Integration:**
Use `GamificationService` to record activity and check level-ups

**4. API Endpoint Structure:**
- Public routes: `/api/resource`
- Protected routes: Require JWT authentication
- Admin routes: `/api/admin/resource`

### Code Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
└── server.js        # Entry point
```

---

## 🔧 Troubleshooting

### MongoDB Connection Issues

**Problem:** `Unable to connect to the database`

**Solutions:**
```bash
# Check if MongoDB is running
brew services list

# For local MongoDB
brew services start mongodb-community

# For Atlas: Check IP whitelist and credentials
# Verify connection string in .env
```

### Redis Connection Issues

**Problem:** Redis connection errors

**Solutions:**
```bash
# Redis is optional - app works without it
# If you want Redis:
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

### Email Authentication Error

**Problem:** `535-5.7.8 Username and Password not accepted`

**Solution:**
Gmail requires App Passwords (not regular passwords):

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use 16-character password in `.env`:
   ```env
   EMAIL_PASS=abcdefghijklmnop  # No spaces
   ```
4. Restart backend

### Port Conflicts

**Problem:** Port already in use

**Solutions:**
```bash
# Check what's using the port
lsof -i :27017  # MongoDB
lsof -i :6379   # Redis
lsof -i :5000   # Backend

# Stop local services
brew services stop mongodb-community
brew services stop redis

# Or change ports in .env
PORT=5001
```

### Docker Issues

**Problem:** Services not starting

**Solutions:**
```bash
# Check Docker is running
docker ps

# View logs
docker compose logs

# Rebuild
docker compose up -d --build --force-recreate

# Clean slate
docker compose down -v
docker compose up -d --build
```

### Payment Issues

**Problem:** Razorpay signature verification fails

**Solutions:**
1. Check `RAZORPAY_KEY_SECRET` is correct
2. Verify `x-app-identifier` header is sent
3. Check webhook secret matches Razorpay dashboard
4. Review server logs for detailed error

### Google OAuth Issues

**Problem:** OAuth redirect fails

**Solutions:**
1. Verify redirect URIs in Google Cloud Console
2. Check `GOOGLE_WEB_REDIRECT_URI` in `.env`
3. Ensure frontend URL is whitelisted
4. Review backend logs for OAuth errors

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check environment variables
4. Verify all services are running

---

## 📄 License

This project is proprietary software.

---

**Last Updated:** February 2026
