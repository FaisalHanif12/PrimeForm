# Environment Variables for Daily Push Notifications

## Required Environment Variables

Add these to your `.env` file in the `PrimeForm/Backend` directory:

```env
# ============================================
# DAILY PUSH NOTIFICATION SETTINGS
# ============================================

# Enable/Disable daily reminder cron jobs
# Set to 'true' to enable automatic daily reminders
# Set to 'false' or leave empty to disable
ENABLE_CRON=true

# Timezone for cron schedule
# Common timezones:
# - Asia/Karachi (Pakistan)
# - America/New_York (US Eastern)
# - Europe/London (UK)
# - Asia/Dubai (UAE)
# - UTC (Coordinated Universal Time)
TIMEZONE=Asia/Karachi

# API key for external cron services (optional - only if using external cron)
# Generate a secure random string for this
CRON_API_KEY=your-secure-random-api-key-here
```

## Complete .env File Example

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/primeform?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-complex
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# Gmail Configuration for OTP and Password Reset
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Frontend URL (for redirects and CORS)
FRONTEND_URL=https://your-frontend-domain.com

# OTP Configuration
OTP_EXPIRES_IN=10

# ============================================
# DAILY PUSH NOTIFICATION SETTINGS
# ============================================
ENABLE_CRON=true
TIMEZONE=Asia/Karachi
CRON_API_KEY=your-secure-random-api-key-here
```

## Notification Schedule

With the current implementation:
- **9:00 AM**: Diet reminder + Workout reminder
- **6:00 PM**: Gym reminder + Streak reminder

## Testing Push Notifications

### Test Endpoint
After setting up your environment variables, you can test push notifications:

```bash
# Test push notification (requires authentication)
POST /api/reminders/test
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

This will send a test notification to your device to verify:
- ✅ Push notifications are working
- ✅ Pure Body branding is correct
- ✅ Notification navigation works

### Manual Testing
1. Make sure your app is running and you're logged in
2. Ensure push notifications are enabled in your device settings
3. Call the test endpoint from Postman or your API client
4. Check your device for the test notification

## Important Notes

1. **ENABLE_CRON**: Must be set to `'true'` (as a string) to enable daily reminders
2. **TIMEZONE**: Use IANA timezone database names (e.g., `Asia/Karachi`, not `PKT`)
3. **CRON_API_KEY**: Only needed if you plan to use external cron services as backup
4. **Push Token**: Users must have push tokens registered for notifications to work
5. **Production**: Set `NODE_ENV=production` for production environment

## Verification

After setting environment variables, restart your server and check logs:

```
⏰ [CRON] Daily reminder jobs scheduled:
   - 9:00 AM: Diet & Workout reminders
   - 6:00 PM: Gym & Streak reminders
   - Timezone: Asia/Karachi
```

If you see this message, cron jobs are enabled and will run automatically!

