const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendDailyReminders,
  sendDietReminder,
  sendWorkoutReminder,
  sendGymReminder,
  sendStreakBrokenReminder,
  testPushNotification
} = require('../controllers/dailyReminderController');

// Send daily reminders to all users (for cron job - can be protected with API key)
router.post('/send-daily', sendDailyReminders);

// Send specific reminders (protected routes)
router.use(protect);
router.post('/diet/:userId', sendDietReminder);
router.post('/workout/:userId', sendWorkoutReminder);
router.post('/gym/:userId', sendGymReminder);
router.post('/streak/:userId', sendStreakBrokenReminder);
router.post('/test', testPushNotification); // Test push notification endpoint

module.exports = router;

