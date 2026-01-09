const pushNotificationService = require('./pushNotificationService');
const User = require('../models/User');
const DietPlan = require('../models/DietPlan');
const WorkoutPlan = require('../models/WorkoutPlan');

const reminderTranslations = {
  en: {
    diet: {
      title: 'Pure Body - Diet Reminder 🥗',
      body: 'Time to check your diet plan! Stay on track with your nutrition goals today.'
    },
    workout: {
      title: 'Pure Body - Workout Reminder 💪',
      body: 'Your workout is waiting! Let\'s crush your fitness goals today.'
    },
    gym: {
      title: 'Pure Body - Gym Exercise Reminder 🏋️',
      body: 'Ready for your gym session? Explore exercises and build your strength!'
    },
    streak_broken: {
      title: 'Pure Body - Streak Alert ⚠️',
      body: 'Don\'t let your streak break! Complete your daily tasks to maintain your progress.'
    }
  },
  ur: {
    diet: {
      title: 'پیور باڈی - ڈائٹ یاد دہانی 🥗',
      body: 'اپنے ڈائٹ پلان کو چیک کرنے کا وقت! آج اپنے غذائی اہداف پر قائم رہیں۔'
    },
    workout: {
      title: 'پیور باڈی - ورکاؤٹ یاد دہانی 💪',
      body: 'آپ کی ورکاؤٹ انتظار کر رہی ہے! آج اپنے فٹنس اہداف کو حاصل کریں۔'
    },
    gym: {
      title: 'پیور باڈی - جم ورزش یاد دہانی 🏋️',
      body: 'اپنے جم سیشن کے لیے تیار؟ ورزشیں دریافت کریں اور اپنی طاقت بنائیں!'
    },
    streak_broken: {
      title: 'پیور باڈی - سٹریک الرٹ ⚠️',
      body: 'اپنے سٹریک کو ٹوٹنے نہ دیں! اپنی پیش رفت برقرار رکھنے کے لیے اپنے روزانہ کام مکمل کریں۔'
    }
  }
};

// Helper function to get user language preference
const getUserLanguage = async (userId) => {
  try {
    const user = await User.findById(userId).select('language');
    return user?.language || 'en';
  } catch (error) {
    console.error('Error getting user language:', error);
    return 'en';
  }
};

// Helper function to get translated reminder content
const getTranslatedReminder = (type, language) => {
  const translations = reminderTranslations[language] || reminderTranslations.en;
  return translations[type] || translations.diet;
};

class DailyReminderService {
  /**
   * Send diet reminder notification
   * @param {string} userId - The user ID
   */
  static async sendDietReminder(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return { success: false, reason: 'No push token' };
      }

      // Check user notification preferences
      const notificationSettings = user.notificationSettings || {
        pushNotifications: true,
        workoutReminders: true,
        dietReminders: true
      };

      // If push notifications are disabled, don't send any notification
      if (!notificationSettings.pushNotifications) {
        console.log(`Push notifications disabled for user ${userId}, skipping diet reminder`);
        return { success: false, reason: 'Push notifications disabled' };
      }

      // If diet reminders are disabled, don't send diet notification
      if (!notificationSettings.dietReminders) {
        console.log(`Diet reminders disabled for user ${userId}, skipping diet reminder`);
        return { success: false, reason: 'Diet reminders disabled' };
      }

      // Check if user has an active diet plan
      const dietPlan = await DietPlan.getActiveDietPlan(userId);
      if (!dietPlan) {
        console.log(`No active diet plan for user ${userId}, skipping diet reminder`);
        return { success: false, reason: 'No active diet plan' };
      }

      const userLanguage = await getUserLanguage(userId);
      const reminder = getTranslatedReminder('diet', userLanguage);

      return await pushNotificationService.sendToUser(userId, {
        title: reminder.title,
        body: reminder.body,
        data: {
          type: 'diet_reminder',
          actionType: 'diet',
          language: userLanguage,
          navigateTo: 'diet'
        }
      });
    } catch (error) {
      console.error('Error sending diet reminder:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Send workout reminder notification
   * @param {string} userId - The user ID
   */
  static async sendWorkoutReminder(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return { success: false, reason: 'No push token' };
      }

      // Check user notification preferences
      const notificationSettings = user.notificationSettings || {
        pushNotifications: true,
        workoutReminders: true,
        dietReminders: true
      };
      // If push notifications are disabled, don't send any notification
      if (!notificationSettings.pushNotifications) {
        console.log(`Push notifications disabled for user ${userId}, skipping workout reminder`);
        return { success: false, reason: 'Push notifications disabled' };
      }

      // If workout reminders are disabled, don't send workout notification
      if (!notificationSettings.workoutReminders) {
        console.log(`Workout reminders disabled for user ${userId}, skipping workout reminder`);
        return { success: false, reason: 'Workout reminders disabled' };
      }

      // Check if user has an active workout plan
      const workoutPlan = await WorkoutPlan.getActiveWorkoutPlan(userId);
      if (!workoutPlan) {
        console.log(`No active workout plan for user ${userId}, skipping workout reminder`);
        return { success: false, reason: 'No active workout plan' };
      }

      const userLanguage = await getUserLanguage(userId);
      const reminder = getTranslatedReminder('workout', userLanguage);

      return await pushNotificationService.sendToUser(userId, {
        title: reminder.title,
        body: reminder.body,
        data: {
          type: 'workout_reminder',
          actionType: 'workout',
          language: userLanguage,
          navigateTo: 'workout'
        }
      });
    } catch (error) {
      console.error('Error sending workout reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send gym exercise reminder notification
   * @param {string} userId - The user ID
   */
  static async sendGymReminder(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return { success: false, reason: 'No push token' };
      }

      // Check user notification preferences
      const notificationSettings = user.notificationSettings || {
        pushNotifications: true,
        workoutReminders: true,
        dietReminders: true
      };

      // If push notifications are disabled, don't send any notification
      if (!notificationSettings.pushNotifications) {
        console.log(`Push notifications disabled for user ${userId}, skipping gym reminder`);
        return { success: false, reason: 'Push notifications disabled' };
      }

      // Gym reminders are considered workout-related, so check workoutReminders
      if (!notificationSettings.workoutReminders) {
        console.log(`Workout reminders disabled for user ${userId}, skipping gym reminder`);
        return { success: false, reason: 'Workout reminders disabled' };
      }

      const userLanguage = await getUserLanguage(userId);
      const reminder = getTranslatedReminder('gym', userLanguage);

      return await pushNotificationService.sendToUser(userId, {
        title: reminder.title,
        body: reminder.body,
        data: {
          type: 'gym_reminder',
          actionType: 'gym',
          language: userLanguage,
          navigateTo: 'gym'
        }
      });
    } catch (error) {
      console.error('Error sending gym reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send streak broken reminder notification
   * @param {string} userId - The user ID
   */
  static async sendStreakBrokenReminder(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return { success: false, reason: 'No push token' };
      }

      // Check user notification preferences
      const notificationSettings = user.notificationSettings || {
        pushNotifications: true,
        workoutReminders: true,
        dietReminders: true
      };

      // If push notifications are disabled, don't send any notification
      if (!notificationSettings.pushNotifications) {
        console.log(`Push notifications disabled for user ${userId}, skipping streak reminder`);
        return { success: false, reason: 'Push notifications disabled' };
      }

      const userLanguage = await getUserLanguage(userId);
      const reminder = getTranslatedReminder('streak_broken', userLanguage);

      return await pushNotificationService.sendToUser(userId, {
        title: reminder.title,
        body: reminder.body,
        data: {
          type: 'streak_broken_reminder',
          actionType: 'streak',
          language: userLanguage,
          navigateTo: 'streak'
        }
      });
    } catch (error) {
      console.error('Error sending streak broken reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send all daily reminders to a user
   * @param {string} userId - The user ID
   */
  static async sendAllDailyReminders(userId) {
    try {
      const results = {
        diet: await this.sendDietReminder(userId),
        workout: await this.sendWorkoutReminder(userId),
        gym: await this.sendGymReminder(userId)
      };

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Error sending daily reminders:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send daily reminders to all active users
   * This should be called by a scheduled job (cron)
   */
  static async sendDailyRemindersToAllUsers() {
    try {
      // Get all users with push tokens
      const users = await User.find({
        pushToken: { $exists: true, $ne: null }
      }).select('_id');

      console.log(`📱 Sending daily reminders to ${users.length} users`);

      const results = [];
      for (const user of users) {
        try {
          const result = await this.sendAllDailyReminders(user._id.toString());
          results.push({
            userId: user._id.toString(),
            ...result
          });
        } catch (error) {
          console.error(`Error sending reminders to user ${user._id}:`, error);
          results.push({
            userId: user._id.toString(),
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        totalUsers: users.length,
        results
      };
    } catch (error) {
      console.error('Error sending daily reminders to all users:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DailyReminderService;

