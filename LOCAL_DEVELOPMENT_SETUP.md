# Local Development Setup Guide

## Overview
This project is configured for **local development by default**, with Docker as an optional deployment method.

## Configuration Priority

### Database (MongoDB)
- **Local Development**: Uses `MONGODB_URI` from `.env`
- **Docker**: Uses `MONGODB_URI_DOCKER` (only if `MONGODB_URI` is not set)

### Redis
- **Local Development**: Defaults to `redis://localhost:6379`
- **Docker**: Set `REDIS_URL=redis://redis:6379` in `.env` when using Docker Compose

## Local Development Setup

### 1. MongoDB
Install MongoDB locally or use MongoDB Atlas (cloud):
```bash
# Option 1: Install MongoDB locally (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Option 2: Use MongoDB Atlas (recommended)
# Sign up at https://www.mongodb.com/cloud/atlas
# Get connection string and use it as MONGODB_URI
```

### 2. Redis (Optional)
Redis is optional for local development. The app works without it:
```bash
# Install Redis (macOS)
brew install redis
brew services start redis
```

### 3. Environment Variables
Create `.env` file in `coaching-platform-backend/`:
```env
# MongoDB - Use local or Atlas connection string
MONGODB_URI=mongodb://localhost:27017/verble
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/verble

# Redis (optional for local dev)
REDIS_URL=redis://localhost:6379

# Other required variables...
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-here
# ... (see .env.example for full list)
```

## Docker Setup (Optional)

If you want to use Docker for local development:

1. Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
  
  redis:
    image: redis:latest
    ports:
      - "6379:6379"
  
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI_DOCKER=mongodb://mongo:27017/verble
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

volumes:
  mongo-data:
```

2. Update `.env`:
```env
# For Docker, use these:
MONGODB_URI_DOCKER=mongodb://mongo:27017/verble
REDIS_URL=redis://redis:6379
```

3. Run:
```bash
docker-compose up
```

## Why This Setup?

The configuration prioritizes **local development** because:
1. **Faster iteration**: No Docker overhead
2. **Easier debugging**: Direct access to services
3. **Better IDE integration**: Direct file access
4. **Simpler setup**: No Docker knowledge required

Docker is available as an option for:
- Production-like environment testing
- Team consistency
- CI/CD pipelines

## Quick Start (Local)

```bash
# 1. Install dependencies
cd coaching-platform-backend
npm install

# 2. Set up .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your MongoDB URI

# 3. Start MongoDB (if using local MongoDB)
brew services start mongodb-community

# 4. Start Redis (optional)
brew services start redis

# 5. Start backend
npm run dev
```

## Troubleshooting

### MongoDB Connection Issues
- Check if MongoDB is running: `brew services list`
- Verify connection string in `.env`
- For Atlas: Check IP whitelist and credentials

### Redis Connection Issues
- Redis is optional - app works without it
- If you want Redis: `brew services start redis`
- Check Redis is running: `redis-cli ping` (should return "PONG")

### Port Conflicts
- MongoDB: Default port 27017
- Redis: Default port 6379
- Backend: Default port 5000
- Change ports in `.env` if needed
