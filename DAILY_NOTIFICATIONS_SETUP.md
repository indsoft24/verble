# Daily Notifications Setup Guide

## Overview
This system automatically sends daily notifications to users for:
1. **Daily Puzzle/Task Notifications** - Notifies users about new puzzles and learning tasks available
2. **Daily Challenge Reminders** - Reminds users who haven't completed today's activities

## Installation

### 1. Install node-cron
```bash
cd coaching-platform-backend
npm install node-cron
```

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Enable/disable daily notifications (default: enabled)
ENABLE_DAILY_NOTIFICATIONS=true

# Schedule for daily notifications (cron format)
# Default: '0 9 * * *' (Every day at 9:00 AM)
DAILY_NOTIFICATION_SCHEDULE=0 9 * * *

# Timezone for scheduler (default: Asia/Kolkata)
TZ=Asia/Kolkata
```

### Cron Schedule Format
The schedule follows standard cron format: `minute hour day month dayOfWeek`

Examples:
- `0 9 * * *` - Every day at 9:00 AM
- `0 8 * * 1-5` - Weekdays at 8:00 AM
- `30 10 * * *` - Every day at 10:30 AM
- `0 9,18 * * *` - Twice daily at 9:00 AM and 6:00 PM

## How It Works

### 1. Daily Puzzle/Task Notifications
- Runs automatically at the scheduled time
- Checks for today's puzzles (PUZZLE type content)
- Checks for today's tasks (WORD, PHRASE, STORY, VOCAB_SET)
- Filters by user's unlocked levels
- Sends notifications only to users with available content

### 2. Daily Challenge Reminders
- Runs automatically at the scheduled time
- Checks if user has completed any activity today
- Sends reminder if no activity completed
- Includes streak information in reminder message

## Manual Testing

### Admin Endpoints
All endpoints require admin authentication:

1. **Trigger All Daily Notifications**
   ```
   POST /api/admin/notifications/trigger-daily
   ```

2. **Trigger Puzzle/Task Notifications Only**
   ```
   POST /api/admin/notifications/trigger-puzzle-tasks
   ```

3. **Trigger Challenge Reminders Only**
   ```
   POST /api/admin/notifications/trigger-reminders
   ```

### Example Request
```bash
curl -X POST http://localhost:5000/api/admin/notifications/trigger-daily \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Notification Categories

Notifications are categorized for better organization:
- `daily_challenges` - Daily Challenges (puzzles and reminders)
- `daily_tasks` - Daily Tasks (word, phrase, story, vocab)

## Notification Types

- `new_content` - For puzzle/task availability
- `default` - For challenge reminders

## Files Structure

```
coaching-platform-backend/
├── src/
│   ├── services/
│   │   └── dailyNotificationService.js      # Core notification logic
│   ├── utils/
│   │   └── dailyNotificationScheduler.js    # Cron scheduler setup
│   ├── controllers/
│   │   └── dailyNotificationController.js   # Admin endpoints
│   └── routes/
│       └── dailyNotificationAdminRoutes.js  # Admin routes
```

## Troubleshooting

### Scheduler Not Starting
1. Check if `node-cron` is installed: `npm list node-cron`
2. Check server logs for scheduler startup messages
3. Verify `ENABLE_DAILY_NOTIFICATIONS` is not set to `false`

### Notifications Not Sending
1. Check if there's content scheduled for today
2. Verify users have unlocked levels matching the content
3. Check database connection
4. Review server logs for error messages

### Testing in Development
1. Use admin endpoints to manually trigger notifications
2. Check notification collection in database
3. Verify notifications appear in user's notification list

## Notes

- Notifications are only sent to verified users (`isEmailVerified: true`)
- Notifications respect user's unlocked levels
- Duplicate notifications are prevented by checking today's progress
- Scheduler runs in the server's timezone (configurable via TZ env var)
