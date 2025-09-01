const Notification = require('../models/Notification');
const User = require('../models/User');
const pushNotificationService = require('./pushNotificationService');

// Notification translations
const notificationTranslations = {
  en: {
    welcome: {
      title: 'Welcome to PrimeForm! 🎉',
      message: (name) => `Hi ${name}! Welcome to PrimeForm - your AI-powered fitness companion. Start your journey by creating your personalized diet and workout plans.`
    },
    diet_plan: {
      title: 'AI Diet Plan Created! 🥗',
      message: 'Your personalized AI diet plan has been successfully created. Check it out and start your nutrition journey!'
    },
    workout_plan: {
      title: 'AI Workout Plan Created! 💪',
      message: 'Your personalized AI workout plan is ready! Time to crush your fitness goals with your new routine.'
    },
    general: {
      title: 'Notification',
      message: 'You have a new notification from PrimeForm.'
    },
    profile_completion_badge: {
      title: 'Profile Completion Badge Earned! 🏆',
      message: (name) => `Congratulations ${name}! You've earned the Profile Completion Badge! Your profile is now complete and ready for personalized plans.`
    }
  },
  ur: {
    welcome: {
      title: 'پرائم فارم میں خوش آمدید! 🎉',
      message: (name) => `سلام ${name}! پرائم فارم میں خوش آمدید - آپ کا AI سے چلنے والا فٹنس ساتھی۔ اپنی ذاتی ڈائٹ اور ورکاؤٹ پلان بنا کر اپنا سفر شروع کریں۔`
    },
    diet_plan: {
      title: 'AI ڈائٹ پلان تیار! 🥗',
      message: 'آپ کا ذاتی AI ڈائٹ پلان کامیابی سے تیار ہو گیا ہے۔ اسے دیکھیں اور اپنا غذائی سفر شروع کریں!'
    },
    workout_plan: {
      title: 'AI ورکاؤٹ پلان تیار! 💪',
      message: 'آپ کا ذاتی AI ورکاؤٹ پلان تیار ہے! اپنے نئے روٹین کے ساتھ اپنے فٹنس اہداف کو حاصل کرنے کا وقت ہے۔'
    },
    general: {
      title: 'اطلاع',
      message: 'آپ کو پرائم فارم سے ایک نئی اطلاع ہے۔'
    },
    profile_completion_badge: {
      title: 'پروفائل مکمل کرنے کا بیج حاصل! 🏆',
      message: (name) => `مبارک ہو ${name}! آپ نے پروفائل مکمل کرنے کا بیج حاصل کیا ہے! آپ کا پروفائل اب مکمل ہے اور ذاتی منصوبوں کے لیے تیار ہے۔`
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

// Helper function to get translated notification content
const getTranslatedContent = (type, language, userName = null) => {
  const translations = notificationTranslations[language] || notificationTranslations.en;
  const content = translations[type] || translations.general;
  
  return {
    title: content.title,
    message: typeof content.message === 'function' ? content.message(userName) : content.message
  };
};

class NotificationService {
  // Create a welcome notification for new users
  static async createWelcomeNotification(userId, userFullName) {
    try {
      const userLanguage = await getUserLanguage(userId);
      const { title, message } = getTranslatedContent('welcome', userLanguage, userFullName);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'welcome',
        title,
        message,
        priority: 'high',
        metadata: {
          hasAppLogo: true,
          actionType: 'welcome',
          language: userLanguage
        }
      });

      // Don't send push notification immediately - let sendPendingNotifications handle it
      // when push token is available to avoid duplicates
      console.log('✅ Welcome notification created in database, will be sent when push token is available');

      return notification;
    } catch (error) {
      console.error('Error creating welcome notification:', error);
      throw error;
    }
  }

  // Create notification for diet plan creation
  static async createDietPlanNotification(userId, planDetails = {}) {
    try {
      const userLanguage = await getUserLanguage(userId);
      const { title, message } = getTranslatedContent('diet_plan', userLanguage);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'diet_plan_created',
        title,
        message,
        priority: 'medium',
        metadata: {
          hasAppLogo: true,
          actionType: 'diet_plan',
          planDetails,
          language: userLanguage
        }
      });

      // Send push notification
      await pushNotificationService.sendToUser(userId, {
        title,
        body: message,
        data: { type: 'diet_plan_created', notificationId: notification._id.toString(), language: userLanguage }
      });

      return notification;
    } catch (error) {
      console.error('Error creating diet plan notification:', error);
      throw error;
    }
  }

  // Create notification for workout plan creation
  static async createWorkoutPlanNotification(userId, planDetails = {}) {
    try {
      const userLanguage = await getUserLanguage(userId);
      const { title, message } = getTranslatedContent('workout_plan', userLanguage);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'workout_plan_created',
        title,
        message,
        priority: 'medium',
        metadata: {
          hasAppLogo: true,
          actionType: 'workout_plan',
          planDetails,
          language: userLanguage
        }
      });

      // Send push notification
      await pushNotificationService.sendToUser(userId, {
        title,
        body: message,
        data: { type: 'workout_plan_created', notificationId: notification._id.toString(), language: userLanguage }
      });

      return notification;
    } catch (error) {
      console.error('Error creating workout plan notification:', error);
      throw error;
    }
  }

  // Get all notifications for a user
  static async getUserNotifications(userId, options = {}) {
    try {
      const notifications = await Notification.getUserNotifications(userId, options);
      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, updatedAt: new Date() },
        { new: true }
      );
      
      if (!notification) {
        throw new Error('Notification not found or unauthorized');
      }
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      return await Notification.markAllAsRead(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete a notification
  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId
      });
      
      if (!notification) {
        throw new Error('Notification not found or unauthorized');
      }
      
      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Create a general notification
  static async createGeneralNotification(userId, title, message, options = {}) {
    try {
      const {
        priority = 'medium',
        metadata = {},
        useTranslation = false
      } = options;
      
      let finalTitle = title;
      let finalMessage = message;
      let userLanguage = 'en';
      
      // Use translation if requested and no custom title/message provided
      if (useTranslation || (!title || !message)) {
        userLanguage = await getUserLanguage(userId);
        const translated = getTranslatedContent('general', userLanguage);
        finalTitle = title || translated.title;
        finalMessage = message || translated.message;
      }
      
      const notification = await Notification.createNotification({
        userId,
        type: 'general',
        title: finalTitle,
        message: finalMessage,
        priority,
        metadata: {
          hasAppLogo: true,
          language: userLanguage,
          ...metadata
        }
      });

      // Send push notification
      await pushNotificationService.sendToUser(userId, {
        title: finalTitle,
        body: finalMessage,
        data: { type: 'general', notificationId: notification._id.toString(), language: userLanguage }
      });

      return notification;
    } catch (error) {
      console.error('Error creating general notification:', error);
      throw error;
    }
  }

  // Create profile completion badge notification
  static async createProfileCompletionBadgeNotification(userId, userFullName) {
    try {
      const userLanguage = await getUserLanguage(userId);
      const { title, message } = getTranslatedContent('profile_completion_badge', userLanguage, userFullName);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'badge_earned',
        title,
        message,
        priority: 'high',
        metadata: {
          hasAppLogo: true,
          actionType: 'badge_earned',
          badgeType: 'profile_completion',
          language: userLanguage
        }
      });

      // Send push notification
      await pushNotificationService.sendToUser(userId, {
        title,
        body: message,
        data: { 
          type: 'badge_earned', 
          notificationId: notification._id.toString(), 
          badgeType: 'profile_completion',
          language: userLanguage 
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating profile completion badge notification:', error);
      throw error;
    }
  }

  // Get notification statistics for a user
  static async getNotificationStats(userId) {
    try {
      const [total, unread, byType] = await Promise.all([
        Notification.countDocuments({ userId }),
        Notification.countDocuments({ userId, isRead: false }),
        Notification.aggregate([
          { $match: { userId: userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ])
      ]);
      
      return {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true
      });
      
      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  // Send pending notifications when push token is saved
  static async sendPendingNotifications(userId) {
    try {
      // Get unread notifications for the user
      const notifications = await Notification.find({
        userId,
        isRead: false
      }).sort({ createdAt: -1 }).limit(5); // Send only the 5 most recent

      if (notifications.length === 0) {
        console.log(`No pending notifications for user ${userId}`);
        return;
      }

      console.log(`📱 Sending ${notifications.length} pending notifications to user ${userId}`);

      // Send each notification
      for (const notification of notifications) {
        try {
          await pushNotificationService.sendToUser(userId, {
            title: notification.title,
            body: notification.message,
            data: {
              type: notification.type,
              notificationId: notification._id.toString(),
              language: notification.metadata?.language || 'en'
            }
          });
          console.log(`✅ Sent pending notification: ${notification.title}`);
        } catch (error) {
          console.error(`❌ Failed to send pending notification ${notification._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending pending notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;