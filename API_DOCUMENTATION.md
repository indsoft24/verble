# API Documentation

## Base URL
```
Production: https://api.verble.app/api
Development: http://localhost:5000/api
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Mobile OTP Authentication](#mobile-otp-authentication)
3. [User Management](#user-management)
4. [Daily Content](#daily-content)
5. [Submissions](#submissions)
6. [Sentence Validation](#sentence-validation)
7. [Subscriptions](#subscriptions)
8. [Leaderboard](#leaderboard)
9. [Courses & Modules](#courses--modules)
10. [Notifications](#notifications)
11. [Admin Endpoints](#admin-endpoints)

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user with email and password.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+919876543210"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Registration successful. Please verify your email.",
  "data": {
    "email": "john@example.com"
  }
}
```

---

### Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "points": 0,
      "membershipLevel": "FREE"
    }
  }
}
```

**Error Response (Email Not Verified):**
```json
{
  "status": "fail",
  "code": "EMAIL_NOT_VERIFIED",
  "message": "Your email is not verified. An OTP has been sent to your email address.",
  "data": {
    "email": "john@example.com",
    "requiresVerification": true
  }
}
```

---

### Verify Email
**POST** `/auth/verify-email`

Verify email with OTP and automatically login.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Email verified successfully. You are now logged in.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": { /* user object */ }
  }
}
```

---

### Resend Verification Email
**POST** `/auth/resend-verification-email`

Resend OTP to email address.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Verification email sent successfully."
}
```

---

### Get Current User
**GET** `/auth/me`

Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+919876543210",
      "role": "user",
      "points": 150,
      "coins": 50,
      "membershipLevel": "BRONZE",
      "unlockedLevels": ["FREE", "BRONZE"],
      "streaks": {
        "free": { "current": 5, "max": 10 },
        "bronze": { "current": 3, "max": 3 }
      },
      "subscriptions": []
    }
  }
}
```

---

### Logout
**POST** `/auth/logout`

Logout current user and invalidate session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### Forgot Password
**POST** `/auth/forgot-password`

Request password reset OTP.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "An OTP has been sent to your email address."
}
```

---

### Reset Password
**PATCH** `/auth/reset-password/:token`

Reset password using reset token.

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

---

## Mobile OTP Authentication

### Send Mobile OTP
**POST** `/auth/mobile/send-otp`

Send OTP to mobile number (currently delivered via email).

**Request Body:**
```json
{
  "mobile": "+919876543210"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "OTP has been sent to your registered email address.",
  "data": {
    "mobile": "+91****3210",
    "email": "jo****@example.com",
    "expiresIn": 600,
    "deliveryMethod": "email"
  }
}
```

**Error Response (Cooldown):**
```json
{
  "status": "fail",
  "message": "Please wait 25 seconds before requesting a new OTP.",
  "cooldownRemaining": 25
}
```

---

### Verify Mobile OTP
**POST** `/auth/mobile/verify-otp`

Verify mobile OTP and login/register user.

**Request Body:**
```json
{
  "mobile": "+919876543210",
  "otp": "123456",
  "name": "John Doe"  // Optional, for new registrations
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Mobile verified successfully. You are now logged in.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": { /* user object */ }
  }
}
```

---

### Login with Mobile
**POST** `/auth/mobile/login`

Login with mobile number (sends OTP).

**Request Body:**
```json
{
  "mobile": "+919876543210"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "OTP has been sent to your registered email address.",
  "data": {
    "mobile": "+91****3210",
    "email": "jo****@example.com",
    "expiresIn": 600,
    "deliveryMethod": "email"
  }
}
```

**Error Response (User Not Found):**
```json
{
  "status": "fail",
  "code": "USER_NOT_FOUND",
  "message": "No account found with this mobile number. Please register first."
}
```

---

### Register with Mobile
**POST** `/auth/mobile/register`

Register with mobile number (sends OTP).

**Request Body:**
```json
{
  "mobile": "+919876543210",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "OTP has been sent to your email address.",
  "data": {
    "mobile": "+91****3210",
    "email": "jo****@example.com",
    "expiresIn": 600,
    "deliveryMethod": "email"
  }
}
```

---

## User Management

### Get User Profile
**GET** `/users/me`

Get current user's profile with subscription expiration check.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": { /* user object with updated subscription status */ }
  }
}
```

---

### Update User Profile
**PATCH** `/users/me`

Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phoneNumber": "+919876543211"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": { /* updated user object */ }
  }
}
```

---

## Daily Content

### Get Daily Content
**GET** `/daily-content`

Get daily content for a specific date.

**Query Parameters:**
- `date` (optional): Date in YYYY-MM-DD format (default: today)
- `type` (optional): Filter by content type (WORD, PHRASE, STORY, etc.)

**Response:**
```json
{
  "status": "success",
  "data": {
    "content": [
      {
        "_id": "content_id",
        "type": "WORD",
        "date": "2024-01-15",
        "level": "FREE",
        "title": "Serendipity",
        "metadata": {
          "text": "serendipity",
          "meaning_en": "the occurrence of pleasant things by chance",
          "meaning_hi": "संयोग से अच्छी चीजों का होना",
          "audio": "https://...",
          "examples": [
            {
              "en": "Finding that book was pure serendipity.",
              "hi": "वह किताब मिलना एक संयोग था।",
              "audio": "https://..."
            }
          ]
        }
      }
    ]
  }
}
```

---

### Get Daily Content by Type
**GET** `/daily-content/type/:type`

Get all content of a specific type.

**Path Parameters:**
- `type`: Content type (WORD, PHRASE, STORY, VOCAB_SET, etc.)

**Query Parameters:**
- `limit` (optional): Number of results (default: 10)
- `skip` (optional): Number to skip (default: 0)

**Response:**
```json
{
  "status": "success",
  "data": {
    "content": [ /* array of content items */ ],
    "count": 10
  }
}
```

---

### Get Daily Quote
**GET** `/daily-quote`

Get today's daily quote.

**Response:**
```json
{
  "status": "success",
  "data": {
    "quote": {
      "_id": "quote_id",
      "text": "The only way to do great work is to love what you do.",
      "author": "Steve Jobs",
      "date": "2024-01-15"
    }
  }
}
```

---

## Submissions

### Submit Sentence (Word of the Day)
**POST** `/submit-sentence`

Submit a sentence using a word from daily content.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "wordId": "content_id",
  "sentence": "I found the book by serendipity."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Sentence submitted successfully",
  "data": {
    "submission": {
      "_id": "submission_id",
      "userId": "user_id",
      "wordId": "content_id",
      "sentence": "I found the book by serendipity.",
      "isCorrect": null,
      "pointsEarned": 0,
      "submittedAt": "2024-01-15T10:30:00Z"
    },
    "autoValidated": false
  }
}
```

---

### Submit Story Summary
**POST** `/submit-story-summary`

Submit a story summary (max 5 sentences).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "storyId": "content_id",
  "summary": [
    "The story is about a young boy who discovers a hidden treasure.",
    "He learns the importance of honesty and sharing.",
    "The moral teaches us that good deeds are always rewarded."
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Story summary submitted successfully",
  "data": {
    "submission": {
      "_id": "submission_id",
      "sentencesCorrect": null,
      "pointsEarned": 0
    }
  }
}
```

---

### Submit Vocabulary Sentences
**POST** `/submit-vocab-sentences`

Submit sentences using vocabulary words.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "vocabSetId": "content_id",
  "sentences": [
    {
      "word": "kitchen",
      "sentence": "I cook in the kitchen every day."
    },
    {
      "word": "dining",
      "sentence": "We eat dinner in the dining room."
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Vocabulary sentences submitted successfully",
  "data": {
    "submission": { /* submission object */ }
  }
}
```

---

### Submit Puzzle Answer
**POST** `/submit-puzzle`

Submit puzzle answers.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "puzzleId": "content_id",
  "answers": [
    { "questionIndex": 0, "selectedOption": 2 },
    { "questionIndex": 1, "selectedOption": 0 }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Puzzle submitted successfully",
  "data": {
    "submission": {
      "correctAnswers": 3,
      "totalQuestions": 5,
      "pointsEarned": 30
    }
  }
}
```

---

### Submit Scene Description
**POST** `/submit-scene-description`

Submit scene description.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sceneId": "content_id",
  "description": "The scene shows a beautiful sunset over the ocean with birds flying."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Scene description submitted successfully",
  "data": {
    "submission": { /* submission object */ }
  }
}
```

---

### Submit Speech Description
**POST** `/submit-speech-description`

Submit speech description.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "speechId": "content_id",
  "description": "The speech was about the importance of education and perseverance."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Speech description submitted successfully",
  "data": {
    "submission": { /* submission object */ }
  }
}
```

---

## Sentence Validation

### Get Pending Submissions
**GET** `/validate-sentence/pending`

Get all pending submissions awaiting validation (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `type` (optional): Filter by submission type (sentence, story, vocab, scene, speech)
- `limit` (optional): Number of results (default: 50)

**Response:**
```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "_id": "submission_id",
        "submissionType": "sentence",
        "userId": { "name": "John Doe", "email": "john@example.com" },
        "wordId": { "title": "Serendipity", "type": "WORD" },
        "sentence": "I found the book by serendipity.",
        "isCorrect": null,
        "submittedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "count": 10,
    "stats": {
      "total": 50,
      "pending": 10,
      "correct": 30,
      "incorrect": 10
    }
  }
}
```

---

### Get All Submissions
**GET** `/validate-sentence/all`

Get all submissions with filtering options (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `type` (optional): Filter by submission type
- `status` (optional): Filter by status (all, pending, reviewed)
- `limit` (optional): Number of results (default: 100)

**Response:**
```json
{
  "status": "success",
  "data": {
    "submissions": [ /* array of submissions */ ],
    "count": 50,
    "stats": {
      "total": 100,
      "pending": 20,
      "correct": 60,
      "incorrect": 20
    }
  }
}
```

---

### Validate Submission
**POST** `/validate-sentence/:submissionId`

Validate a submission (mark as correct/incorrect) (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Path Parameters:**
- `submissionId`: Submission ID

**Request Body:**
```json
{
  "isCorrect": true,
  "feedback": "Great sentence! Well done.",
  "pointsEarned": 10
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Submission validated successfully",
  "data": {
    "submission": {
      "_id": "submission_id",
      "isCorrect": true,
      "feedback": "Great sentence! Well done.",
      "pointsEarned": 10,
      "reviewedBy": "admin_id",
      "reviewedAt": "2024-01-15T11:00:00Z"
    }
  }
}
```

---

### Validate Story Sentences
**POST** `/validate-sentence/story/:submissionId`

Validate individual sentences in a story summary (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "sentences": [
    { "index": 0, "isCorrect": true },
    { "index": 1, "isCorrect": true },
    { "index": 2, "isCorrect": false }
  ],
  "feedback": "Two out of three sentences are correct."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Story sentences validated successfully",
  "data": {
    "submission": {
      "sentencesCorrect": 2,
      "pointsEarned": 14  // 10 base + 2 per correct sentence
    }
  }
}
```

---

## Subscriptions

### Get Subscription Plans
**GET** `/subscription-plans`

Get all available subscription plans.

**Response:**
```json
{
  "status": "success",
  "data": {
    "plans": [
      {
        "_id": "plan_id",
        "name": "Gold Subscription",
        "description": "1 year access to all content",
        "price": 999,
        "duration": 365,
        "features": ["All content access", "Priority support"]
      }
    ]
  }
}
```

---

### Subscribe to Plan
**POST** `/subscriptions/subscribe/:planId`

Subscribe to a subscription plan.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `planId`: Subscription plan ID

**Response:**
```json
{
  "status": "success",
  "message": "Subscription successful",
  "data": {
    "subscription": {
      "_id": "subscription_id",
      "planId": "plan_id",
      "planName": "Gold Subscription",
      "status": "active",
      "startDate": "2024-01-15T00:00:00Z",
      "endDate": "2025-01-15T00:00:00Z"
    },
    "user": { /* updated user object with unlocked levels */ }
  }
}
```

---

### Get My Subscription
**GET** `/subscriptions/my-subscription`

Get current user's active subscription.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "subscription": { /* subscription object */ }
  }
}
```

---

### Check My Subscription Expiration
**POST** `/subscriptions/check-my-expiration`

Manually trigger subscription expiration check for current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Subscription expiration check completed",
  "data": {
    "expiredCount": 0,
    "updatedLevels": ["FREE", "BRONZE"]
  }
}
```

---

### Update My Unlocked Levels
**POST** `/subscriptions/update-levels`

Manually update unlocked levels based on current subscriptions.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Unlocked levels updated successfully",
  "data": {
    "unlockedLevels": ["FREE", "BRONZE", "SILVER", "GOLD"],
    "membershipLevel": "GOLD"
  }
}
```

---

## Leaderboard

### Get Leaderboard
**GET** `/leaderboard`

Get leaderboard rankings.

**Query Parameters:**
- `type` (optional): Leaderboard type (free, paid, all) - default: "all"
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "status": "success",
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": {
          "_id": "user_id",
          "name": "John Doe",
          "points": 5000
        },
        "points": 5000
      }
    ],
    "myRank": 25,
    "myPoints": 1500,
    "totalUsers": 1000
  }
}
```

---

## Courses & Modules

### Get All Courses
**GET** `/courses`

Get all available courses.

**Response:**
```json
{
  "status": "success",
  "data": {
    "courses": [
      {
        "_id": "course_id",
        "title": "Full Course",
        "description": "Complete English learning course",
        "modules": [ /* array of modules */ ]
      }
    ]
  }
}
```

---

### Get Course Details
**GET** `/courses/:courseId`

Get detailed course information.

**Path Parameters:**
- `courseId`: Course ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "course": {
      "_id": "course_id",
      "title": "Full Course",
      "modules": [ /* modules with videos */ ],
      "progress": {
        "completedModules": 2,
        "totalModules": 10,
        "percentage": 20
      }
    }
  }
}
```

---

### Get Module Details
**GET** `/modules/:moduleId`

Get module details with videos.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `moduleId`: Module ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "module": {
      "_id": "module_id",
      "title": "Module 1: Basics",
      "videos": [
        {
          "_id": "video_id",
          "title": "Introduction",
          "isUnlocked": true,
          "isCompleted": false,
          "watchProgress": 0
        }
      ]
    }
  }
}
```

---

### Mark Video as Complete
**POST** `/videos/:videoId/complete`

Mark a video as completed.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `videoId`: Video ID

**Response:**
```json
{
  "status": "success",
  "message": "Video marked as complete",
  "data": {
    "video": {
      "_id": "video_id",
      "isCompleted": true,
      "completedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

---

## Notifications

### Get My Notifications
**GET** `/notifications`

Get current user's notifications.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of results (default: 20)
- `unreadOnly` (optional): Return only unread notifications (default: false)

**Response:**
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "title": "Daily Challenge Reminder",
        "message": "Don't forget to complete today's word challenge!",
        "type": "daily_reminder",
        "isRead": false,
        "createdAt": "2024-01-15T08:00:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

---

### Mark Notification as Read
**PATCH** `/notifications/:notificationId/read`

Mark a notification as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `notificationId`: Notification ID

**Response:**
```json
{
  "status": "success",
  "message": "Notification marked as read"
}
```

---

## Admin Endpoints

### Admin: Trigger Subscription Expiration Check
**POST** `/admin/subscriptions/check-expiration`

Manually trigger system-wide subscription expiration check (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "status": "success",
  "message": "Subscription expiration check completed",
  "data": {
    "usersProcessed": 1000,
    "expiredSubscriptions": 50,
    "updatedUsers": 50
  }
}
```

---

### Admin: Get All Daily Content
**GET** `/admin/daily-content`

Get all daily content with pagination (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `date` (optional): Filter by date
- `type` (optional): Filter by type
- `limit` (optional): Number of results
- `skip` (optional): Number to skip

**Response:**
```json
{
  "status": "success",
  "data": {
    "content": [ /* array of content */ ],
    "count": 100,
    "total": 500
  }
}
```

---

### Admin: Create Daily Content
**POST** `/admin/daily-content`

Create new daily content (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "type": "WORD",
  "date": "2024-01-16",
  "level": "FREE",
  "title": "New Word",
  "metadata": {
    "text": "word",
    "meaning_en": "meaning",
    "meaning_hi": "अर्थ"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Daily content created successfully",
  "data": {
    "content": { /* created content object */ }
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "status": "fail",
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "Unauthorized. Please login."
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "status": "fail",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "status": "fail",
  "message": "Too many requests. Please try again later.",
  "cooldownRemaining": 30
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Rate Limiting

- OTP requests: 30-second cooldown between requests
- API requests: Standard rate limiting applies (check server configuration)

---

## Notes

1. **Mobile OTP Delivery**: Currently, mobile OTPs are delivered via email. SMS delivery will be enabled once DLT verification is complete.

2. **Subscription Plans**: Plan names must contain "Gold" or "Full Course" for automatic level unlocking detection.

3. **Points System**:
   - 10 points per correct sentence
   - 2 points per correct sentence in story summary (in addition to 10 base points)
   - 10 points per correct puzzle answer

4. **Level Unlocking**: Users can unlock levels through:
   - Streak-based: 30 consecutive days for BRONZE, 60 for SILVER
   - 70% completion rule: 70% completion in last 30/60/90 days

5. **Session Management**: JWT tokens expire after 7 days (configurable). Sessions are managed via Redis.

---

## Support

For API support, contact: support@verble.app
