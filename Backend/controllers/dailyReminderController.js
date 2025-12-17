const dailyReminderService = require('../services/dailyReminderService');
const asyncHandler = require('../middleware/asyncHandler');
const pushNotificationService = require('../services/pushNotificationService');
const User = require('../models/User');

// @desc    Send daily reminders to all users (called by cron job)
// @route   POST /api/reminders/send-daily
// @access  Private (should be protected with API key or admin auth)
const sendDailyReminders = asyncHandler(async (req, res) => {
  try {
    // Optional: Add API key check here for security
    // const apiKey = req.headers['x-api-key'];
    // if (apiKey !== process.env.CRON_API_KEY) {
    //   return res.status(401).json({ success: false, message: 'Unauthorized' });
    // }

    const result = await dailyReminderService.sendDailyRemindersToAllUsers();

    res.status(200).json({
      success: result.success,
      message: `Daily reminders sent to ${result.totalUsers} users`,
      data: result
    });
  } catch (error) {
    console.error('Error in sendDailyReminders controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending daily reminders',
      error: error.message
    });
  }
});

// @desc    Send diet reminder to specific user
// @route   POST /api/reminders/diet/:userId
// @access  Private
const sendDietReminder = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await dailyReminderService.sendDietReminder(userId);

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Diet reminder sent' : result.reason || 'Failed to send reminder',
      data: result
    });
  } catch (error) {
    console.error('Error in sendDietReminder controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending diet reminder',
      error: error.message
    });
  }
});

// @desc    Send workout reminder to specific user
// @route   POST /api/reminders/workout/:userId
// @access  Private
const sendWorkoutReminder = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await dailyReminderService.sendWorkoutReminder(userId);

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Workout reminder sent' : result.reason || 'Failed to send reminder',
      data: result
    });
  } catch (error) {
    console.error('Error in sendWorkoutReminder controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending workout reminder',
      error: error.message
    });
  }
});

// @desc    Send gym reminder to specific user
// @route   POST /api/reminders/gym/:userId
// @access  Private
const sendGymReminder = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await dailyReminderService.sendGymReminder(userId);

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Gym reminder sent' : result.reason || 'Failed to send reminder',
      data: result
    });
  } catch (error) {
    console.error('Error in sendGymReminder controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending gym reminder',
      error: error.message
    });
  }
});

// @desc    Send streak broken reminder to specific user
// @route   POST /api/reminders/streak/:userId
// @access  Private
const sendStreakBrokenReminder = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await dailyReminderService.sendStreakBrokenReminder(userId);

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Streak reminder sent' : result.reason || 'Failed to send reminder',
      data: result
    });
  } catch (error) {
    console.error('Error in sendStreakBrokenReminder controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending streak reminder',
      error: error.message
    });
  }
});

// @desc    Test push notification (for testing branding and functionality)
// @route   POST /api/reminders/test
// @access  Private
const testPushNotification = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id?.toString() || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.pushToken) {
      return res.status(400).json({
        success: false,
        message: 'No push token found. Please ensure push notifications are enabled in the app.'
      });
    }

    // Send a test notification with Pure Body branding
    const testResult = await pushNotificationService.sendToUser(userId, {
      title: 'Pure Body - Test Notification 🎉',
      body: 'This is a test notification to verify push notifications are working correctly with Pure Body branding!',
      data: {
        type: 'test',
        actionType: 'test',
        language: user.language || 'en',
        navigateTo: 'dashboard'
      }
    });

    if (testResult.success) {
      res.status(200).json({
        success: true,
        message: 'Test notification sent successfully! Check your device.',
        data: {
          userId: userId,
          pushToken: user.pushToken.substring(0, 20) + '...',
          result: testResult
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: testResult.reason || testResult.error
      });
    }
  } catch (error) {
    console.error('Error in testPushNotification controller:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
});

module.exports = {
  sendDailyReminders,
  sendDietReminder,
  sendWorkoutReminder,
  sendGymReminder,
  sendStreakBrokenReminder,
  testPushNotification
};

