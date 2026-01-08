import Storage from '../utils/storage';
import * as Notifications from 'expo-notifications';

export interface NotificationSettings {
  pushNotifications: boolean;
  workoutReminders: boolean;
  dietReminders: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  pushNotifications: true,
  workoutReminders: true,
  dietReminders: true,
};

const SETTINGS_KEY = 'notificationSettings';

class NotificationSettingsService {
  /**
   * Get notification settings from storage
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await Storage.getItem(SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save notification settings to storage
   */
  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await Storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      
      // Update notification handler based on settings
      await this.updateNotificationHandler(settings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      throw error;
    }
  }

  /**
   * Update notification handler based on settings
   */
  private async updateNotificationHandler(settings: NotificationSettings): Promise<void> {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // If push notifications are completely disabled, don't show anything
        if (!settings.pushNotifications) {
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }

        // Check notification type and apply specific settings
        const notificationType = notification.request.content.data?.type as string;

        // Diet reminders
        if (notificationType?.includes('diet') || notificationType?.includes('meal')) {
          return {
            shouldShowAlert: settings.dietReminders,
            shouldPlaySound: settings.dietReminders,
            shouldSetBadge: settings.dietReminders,
          };
        }

        // Workout reminders
        if (notificationType?.includes('workout') || notificationType?.includes('exercise')) {
          return {
            shouldShowAlert: settings.workoutReminders,
            shouldPlaySound: settings.workoutReminders,
            shouldSetBadge: settings.workoutReminders,
          };
        }

        // Default: show notification if push notifications are enabled
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });
  }

  /**
   * Check if a specific notification type should be shown
   */
  async shouldShowNotification(type: 'workout' | 'diet' | 'general'): Promise<boolean> {
    const settings = await this.getSettings();
    
    // If push notifications are disabled, don't show any notifications
    if (!settings.pushNotifications) {
      return false;
    }

    // Check specific notification type
    switch (type) {
      case 'workout':
        return settings.workoutReminders;
      case 'diet':
        return settings.dietReminders;
      case 'general':
        return true; // General notifications always shown if push is enabled
      default:
        return true;
    }
  }

  /**
   * Initialize notification settings (call on app start)
   */
  async initialize(): Promise<void> {
    const settings = await this.getSettings();
    await this.updateNotificationHandler(settings);
  }
}

export default new NotificationSettingsService();
