# Daily Reminder Notifications Setup Guide

## Overview
This document explains how to set up daily push notification reminders for Pure Body app users.

## Features Implemented

### 1. In-App Notifications (Saved in Database)
- ✅ Account created notification
- ✅ Profile completed notification  
- ✅ Diet plan generated notification
- ✅ Workout plan generated notification

### 2. Daily Push Notifications (Mobile Alerts - Not Saved)
- ✅ Diet reminder
- ✅ Workout reminder
- ✅ Gym exercise reminder
- ✅ Streak broken reminder

## API Endpoints

### Send Daily Reminders to All Users
```
POST /api/reminders/send-daily
```
This endpoint should be called by a cron job daily.

**Note:** For production, add API key authentication:
```javascript
// In dailyReminderController.js, uncomment:
const apiKey = req.headers['x-api-key'];
if (apiKey !== process.env.CRON_API_KEY) {
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}
```

### Send Individual Reminders
```
POST /api/reminders/diet/:userId
POST /api/reminders/workout/:userId
POST /api/reminders/gym/:userId
POST /api/reminders/streak/:userId
```

## Setting Up Cron Job

### ✅ Option 1: Node-Cron (FREE - Already Implemented! 🎉)

**This is the BEST free solution!** No external services needed.

The cron job is **already implemented** in `server.js`. It will automatically run daily at 9:00 AM when:
- `NODE_ENV=production` OR
- `ENABLE_CRON=true` in your `.env` file

**To Enable:**
1. Add to your `.env` file:
```env
ENABLE_CRON=true
TIMEZONE=Asia/Karachi  # Change to your timezone
```

2. Restart your server - that's it! The cron job will run automatically.

**To Change Schedule:**
Edit the cron schedule in `server.js`:
```javascript
// Current: Daily at 9:00 AM
cron.schedule('0 9 * * *', ...)

// Examples:
// '0 8 * * *' = 8:00 AM daily
// '0 9,18 * * *' = 9:00 AM and 6:00 PM daily
// '0 */6 * * *' = Every 6 hours
// '30 9 * * 1-5' = 9:30 AM on weekdays only
```

**Cron Format:** `minute hour day month day-of-week`
- `*` = every
- `0 9 * * *` = 9:00 AM every day
- `0 9,18 * * *` = 9:00 AM and 6:00 PM daily

### Option 2: External Cron Services (If Server Goes Down)

**Free Options:**
- **cron-job.org** - FREE (up to 2 jobs) - https://cron-job.org
- **EasyCron** - FREE tier available - https://www.easycron.com
- **GitHub Actions** - FREE for public repos - Use workflow with schedule

**Paid Options (if you need more):**
- **AWS EventBridge** - Pay per execution
- **Google Cloud Scheduler** - Free tier available
- **Vercel Cron** - If using Vercel hosting

**Example External Cron Configuration:**
- **URL:** `https://your-api-domain.com/api/reminders/send-daily`
- **Method:** POST
- **Headers:** `x-api-key: YOUR_CRON_API_KEY`
- **Schedule:** Daily at 9:00 AM
- **Timezone:** Your server timezone

**Note:** External cron services are only needed if:
- Your server might go down/restart frequently
- You want redundancy (backup scheduling)
- You're using serverless hosting (Vercel, Netlify, etc.)

## Notification Customization

### Custom Branding
All push notifications include:
- **App Name:** Pure Body
- **Icon:** PrimeIcon.png (configured in app.json)
- **Color:** #6366F1 (Pure Body primary color)
- **Channel:** primeform-notifications

### Notification Content
Notifications are automatically translated based on user's language preference:
- **English:** Default messages
- **Urdu:** Fully translated messages

## Notification Navigation
When users tap on notifications, they are automatically navigated to:
- **Diet reminder** → Diet plan screen
- **Workout reminder** → Workout plan screen
- **Gym reminder** → Gym exercises screen
- **Streak reminder** → Streak tracker screen

## Testing

### Test Individual Reminders
```bash
# Test diet reminder for a specific user
curl -X POST http://localhost:5000/api/reminders/diet/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test workout reminder
curl -X POST http://localhost:5000/api/reminders/workout/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Push Notification (Recommended for Testing)
```bash
# Test push notification with branding
curl -X POST http://localhost:5000/api/reminders/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This will send a test notification to verify:
- ✅ Push notifications are working
- ✅ Pure Body branding is correct
- ✅ Notification appears on your device

### Test All Daily Reminders
```bash
curl -X POST http://localhost:5000/api/reminders/send-daily \
  -H "x-api-key: YOUR_CRON_API_KEY"
```

## Environment Variables

**See `ENV_VARIABLES.md` for complete documentation.**

Add to your `.env` file:
```env
# Enable cron job (set to 'true' to enable daily reminders)
ENABLE_CRON=true

# Timezone for cron schedule (optional, defaults to Asia/Karachi)
TIMEZONE=Asia/Karachi

# API key for external cron services (optional - only if using external cron)
CRON_API_KEY=your-secure-api-key-here
```

**Common Timezones:**
- `Asia/Karachi` - Pakistan
- `America/New_York` - US Eastern
- `Europe/London` - UK
- `Asia/Dubai` - UAE
- `UTC` - Coordinated Universal Time

## Notification Schedule

The cron jobs are configured to send:
- **9:00 AM**: Diet reminder + Workout reminder (2 notifications)
- **6:00 PM**: Gym reminder + Streak reminder (2 notifications)

This ensures users don't receive all 4 notifications at once, spreading them throughout the day.

## Notes

1. **Push Token Required:** Reminders are only sent to users who have registered push tokens
2. **Active Plans Check:** Diet and workout reminders only send if user has active plans
3. **No Duplicate Storage:** Daily reminders are push notifications only, not saved in-app
4. **Language Support:** All reminders support English and Urdu based on user preference

## Troubleshooting

### Reminders Not Sending
1. Check if users have push tokens registered
2. Verify push notification service is configured correctly
3. Check server logs for errors
4. Ensure Expo push notification credentials are set up

### Navigation Not Working
1. Verify notification data includes `navigateTo` field
2. Check NotificationHandler is properly set up in frontend
3. Ensure router is available in NotificationHandler component

