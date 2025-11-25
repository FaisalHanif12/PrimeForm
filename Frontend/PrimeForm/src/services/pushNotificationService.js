import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.isCleanedUp = false;
  }

  // Initialize push notifications
  async initialize() {
    try {
      // Reset cleanup flag
      this.isCleanedUp = false;
      
      // Register for push notifications
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.expoPushToken = token;
        await this.savePushTokenToServer(token);
        console.log('✅ Push notifications initialized with token:', token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();
      
      return token;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return null;
    }
  }

  // Register for push notifications and get Expo push token
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return null;
      }
      
      try {
        // Get projectId from app configuration
        const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.projectId;
        
        if (!projectId) {
          console.error('❌ No projectId found in app configuration');
          return null;
        }
        
        console.log('🔑 Using projectId:', projectId);
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('📱 Expo Push Token:', token);
      } catch (error) {
        console.error('❌ Error getting Expo push token:', error);
        // Handle specific validation errors
        if (error.message && error.message.includes('Invalid uuid')) {
          console.error('❌ Invalid projectId UUID format. Please check your app.json configuration.');
        }
        return null;
      }
    } else {
      console.log('❌ Must use physical device for Push Notifications');
    }

    return token;
  }

  // Save push token to server
  async savePushTokenToServer(token) {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('❌ No auth token found, cannot save push token');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user-profile/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ pushToken: token }),
      });

      if (response.ok) {
        console.log('✅ Push token saved to server');
      } else {
        console.error('❌ Failed to save push token to server');
      }
    } catch (error) {
      console.error('❌ Error saving push token to server:', error);
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    try {
      // Listener for notifications received while app is in foreground
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('📱 Notification received in foreground:', notification);
        // You can handle the notification here (e.g., show custom UI)
      });

      // Listener for when user taps on notification
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('📱 Notification tapped:', response);
        // Handle notification tap (e.g., navigate to specific screen)
        this.handleNotificationTap(response.notification);
      });
    } catch (error) {
      console.error('❌ Error setting up notification listeners:', error);
    }
  }

  // Handle notification tap
  handleNotificationTap(notification) {
    const { data } = notification.request.content;
    
    // You can add navigation logic here based on notification data
    console.log('📱 Handling notification tap with data:', data);
    
    // Example: Navigate to specific screen based on notification type
    if (data?.type === 'diet_plan_created') {
      // Navigate to diet plan screen
    } else if (data?.type === 'workout_plan_created') {
      // Navigate to workout plan screen
    }
  }

  // Send a local notification (for testing)
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
      console.log('✅ Local notification sent');
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  // Send a notification to the server (only when explicitly requested)
  async sendNotification(notificationData) {
    try {
      if (!this.expoPushToken) {
        console.log('❌ No push token available');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          pushToken: this.expoPushToken,
          ...notificationData
        }),
      });

      if (response.ok) {
        console.log('✅ Notification sent to server');
        return true;
      } else {
        console.error('❌ Failed to send notification to server');
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  }

  // Get current push token
  getPushToken() {
    return this.expoPushToken;
  }

  // Clean up listeners
  cleanup() {
    if (this.isCleanedUp) {
      return; // Prevent multiple cleanup calls
    }
    
    try {
      if (this.notificationListener && typeof this.notificationListener.remove === 'function') {
        this.notificationListener.remove();
        this.notificationListener = null;
      }
      if (this.responseListener && typeof this.responseListener.remove === 'function') {
        this.responseListener.remove();
        this.responseListener = null;
      }
      this.isCleanedUp = true;
    } catch (error) {
      console.error('❌ Error cleaning up notification listeners:', error);
    }
  }
}

// Create and export singleton instance
const pushNotificationService = new PushNotificationService();
export default pushNotificationService;