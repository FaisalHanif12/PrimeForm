# Push Notification Testing Guide

## Overview
This guide explains how to test push notifications to verify they're working correctly with Pure Body branding.

## Prerequisites

1. **Backend server running** on your local machine or deployed server
2. **Mobile app installed** on a physical device (Expo Go won't work for push notifications)
3. **User logged in** to the app with push notifications enabled
4. **Environment variables set** (see `ENV_VARIABLES.md`)

## Testing Push Notifications

### Step 1: Get Your JWT Token

1. Log in to your app
2. The JWT token is stored in your app's AsyncStorage or you can get it from the login response
3. Alternatively, log in via API:
```bash
POST /api/auth/login
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```
Response will include a `token` field - save this!

### Step 2: Test Push Notification

Use the test endpoint to send a test notification:

```bash
POST http://localhost:5000/api/reminders/test
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
```

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/reminders/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Using Postman:**
1. Create new POST request
2. URL: `http://localhost:5000/api/reminders/test`
3. Headers:
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`
   - `Content-Type`: `application/json`
4. Send request

### Step 3: Check Your Device

After sending the test request:
1. Check your mobile device
2. You should see a notification: **"Pure Body - Test Notification 🎉"**
3. The notification should have:
   - ✅ Pure Body branding (app icon)
   - ✅ Correct title and message
   - ✅ Proper styling (color: #6366F1)

### Step 4: Test Notification Tap

1. Tap on the test notification
2. The app should open and navigate to the dashboard
3. Check console logs for navigation confirmation

## Expected Response

**Success Response:**
```json
{
  "success": true,
  "message": "Test notification sent successfully! Check your device.",
  "data": {
    "userId": "user_id_here",
    "pushToken": "ExponentPushToken[...",
    "result": {
      "success": true,
      "tickets": [...]
    }
  }
}
```

**Error Responses:**

**No Push Token:**
```json
{
  "success": false,
  "message": "No push token found. Please ensure push notifications are enabled in the app."
}
```

**Invalid Token:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

## Troubleshooting

### Notification Not Received

1. **Check Push Token:**
   - Ensure user has push token registered
   - Check database: `User` collection should have `pushToken` field

2. **Check Device Settings:**
   - Enable push notifications in device settings
   - Enable notifications for Pure Body app specifically

3. **Check Server Logs:**
   - Look for errors in server console
   - Check if Expo push notification service is responding

4. **Check Expo Configuration:**
   - Ensure `app.json` has correct notification configuration
   - Verify Expo project ID is correct

### Notification Received But No Branding

1. **Check app.json:**
   ```json
   {
     "notification": {
       "icon": "./assets/images/PrimeIcon.png",
       "color": "#6366F1"
     }
   }
   ```

2. **Rebuild App:**
   - Branding is set at build time
   - You may need to rebuild the app for branding to appear

### Testing in Expo Go

**Important:** Push notifications **DO NOT work in Expo Go**. You must:
1. Build a development build using EAS Build
2. Install on a physical device
3. Then test push notifications

## Testing Individual Reminders

You can also test individual reminder types:

```bash
# Test Diet Reminder
POST /api/reminders/diet/USER_ID
Headers: Authorization: Bearer YOUR_JWT_TOKEN

# Test Workout Reminder
POST /api/reminders/workout/USER_ID
Headers: Authorization: Bearer YOUR_JWT_TOKEN

# Test Gym Reminder
POST /api/reminders/gym/USER_ID
Headers: Authorization: Bearer YOUR_JWT_TOKEN

# Test Streak Reminder
POST /api/reminders/streak/USER_ID
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

## Verification Checklist

- [ ] Test notification endpoint responds successfully
- [ ] Notification appears on device
- [ ] Notification has correct title and message
- [ ] Notification has Pure Body branding (icon visible)
- [ ] Notification color is correct (#6366F1)
- [ ] Tapping notification opens app
- [ ] App navigates to correct screen
- [ ] Server logs show successful delivery
- [ ] No errors in server console

## Next Steps

Once testing is successful:
1. Set `ENABLE_CRON=true` in `.env`
2. Set `TIMEZONE` to your preferred timezone
3. Restart server
4. Cron jobs will automatically run at:
   - **9:00 AM**: Diet + Workout reminders
   - **6:00 PM**: Gym + Streak reminders

