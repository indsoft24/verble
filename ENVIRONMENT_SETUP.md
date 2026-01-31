# Environment Variables Setup Guide

## Overview
This guide explains how to set up environment variables for the English Learning App. All sensitive credentials have been removed from `.env` files and replaced with template files (`.env.example`).

## Files Created

### Backend
- **`.env.example`** - Template with all required environment variables (no secrets)
- **`.env`** - Your actual environment file (gitignored, contains secrets)

### Frontend
- **`.env.example`** - Template with all required environment variables (no secrets)
- **`.env.local`** - Your actual environment file (gitignored, contains secrets)

## Setup Instructions

### Backend Setup

1. **Copy the example file:**
   ```bash
   cd coaching-platform-backend
   cp .env.example .env
   ```

2. **Fill in your actual values:**
   - Open `.env` in a text editor
   - Replace all `your-*` placeholders with actual credentials
   - **Important**: Never commit `.env` to git

### Frontend Setup

1. **Copy the example file:**
   ```bash
   cd coaching-platform-frontend
   cp .env.example .env.local
   ```

2. **Fill in your actual values:**
   - Open `.env.local` in a text editor
   - Replace all `your-*` placeholders with actual credentials
   - **Important**: Never commit `.env.local` to git

## Required Credentials

### Critical (Must Have)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate a strong random string)
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` - SMTP email configuration

### Important (Recommended)
- `REDIS_URL` - Redis connection (optional but recommended for sessions)
- `BUNNY_STORAGE_*` - Bunny CDN storage credentials
- `BUNNY_STREAM_*` - Bunny Stream video credentials
- `RAZORPAY_*` - Payment gateway credentials

### Optional (Feature-Specific)
- `GOOGLE_*` - Google OAuth (if using Google login)
- `TWILIO_*` / `MSG91_*` - SMS provider (when DLT is ready)
- `OPENAI_API_KEY` / `GEMINI_API_KEY` - AI validation (if enabled)

## Security Notes

1. **Never commit `.env` or `.env.local` files**
2. **Use strong, unique values for `JWT_SECRET`**
3. **Rotate secrets regularly in production**
4. **Use different credentials for development and production**
5. **Store production secrets in secure secret management systems**

## Generating Secure Secrets

### JWT Secret
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Other Secrets
- Use strong, random passwords
- Minimum 32 characters for critical secrets
- Use different secrets for each environment

## Environment-Specific Configuration

### Development
- Use local MongoDB: `mongodb://localhost:27017/verble`
- Use mock SMS provider: `SMS_PROVIDER=mock`
- Disable AI validation: `ENABLE_AI_VALIDATION=false`

### Production
- Use production MongoDB URI
- Use real SMS provider credentials
- Enable AI validation if configured
- Use production frontend URLs
- Set `NODE_ENV=production`

## Verification

After setting up your `.env` files:

1. **Backend:**
   ```bash
   cd coaching-platform-backend
   npm start
   # Should connect to MongoDB and start server
   ```

2. **Frontend:**
   ```bash
   cd coaching-platform-frontend
   npm run dev
   # Should connect to backend API
   ```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify `MONGODB_URI` is correct
   - Ensure MongoDB is running
   - Check network/firewall settings

2. **Redis Connection Error**
   - Redis is optional - app works without it
   - If using Redis, verify `REDIS_URL` is correct
   - Ensure Redis server is running

3. **Email Not Sending**
   - Verify SMTP credentials
   - For Gmail, use App-Specific Password
   - Check firewall/network settings

4. **JWT Errors**
   - Ensure `JWT_SECRET` is set
   - Use a strong, random secret
   - Don't change secret after users are created

## Next Steps

1. Copy `.env.example` to `.env` (backend)
2. Copy `.env.example` to `.env.local` (frontend)
3. Fill in all required credentials
4. Test the application
5. Never commit actual `.env` files to git
