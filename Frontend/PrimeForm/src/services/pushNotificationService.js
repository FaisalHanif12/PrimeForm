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
      console.log('🔔 [PUSH INIT] Starting push notification initialization...');
      console.log('🔔 [PUSH INIT] Platform:', Platform.OS);
      console.log('🔔 [PUSH INIT] Device.isDevice:', Device.isDevice);
      
      // Reset cleanup flag
      this.isCleanedUp = false;
      
      // Register for push notifications
      const token = await this.registerForPushNotificationsAsync();
      if (token) {
        this.expoPushToken = token;
        console.log('✅ [PUSH INIT] Token generated successfully');
        console.log('✅ [PUSH INIT] Token (first 30 chars):', token.substring(0, 30) + '...');
        
        await this.savePushTokenToServer(token);
        console.log('✅ [PUSH INIT] Push notifications initialized successfully');
      } else {
        console.error('❌ [PUSH INIT] Failed to generate push token');
      }

      // Set up notification listeners
      this.setupNotificationListeners();
      console.log('✅ [PUSH INIT] Notification listeners set up');
      
      return token;
    } catch (error) {
      console.error('❌ [PUSH INIT] Error initializing push notifications:', error);
      console.error('❌ [PUSH INIT] Error message:', error.message);
      console.error('❌ [PUSH INIT] Error stack:', error.stack);
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
        // ✅ CRITICAL FIX: Get native FCM token for Firebase Admin SDK compatibility
        // Backend now uses Firebase Admin SDK which requires native FCM tokens, not Expo tokens
        console.log('🔔 [PUSH TOKEN] === Push Token Registration (FCM Native) ===');
        console.log('🔔 [PUSH TOKEN] Device.isDevice:', Device.isDevice);
        console.log('🔔 [PUSH TOKEN] Platform.OS:', Platform.OS);
        
        if (Platform.OS === 'android') {
          // For Android: Get native FCM token directly (required for Firebase Admin SDK)
          console.log('🔑 [PUSH TOKEN] Getting native FCM token for Android...');
          const fcmToken = await Notifications.getDevicePushTokenAsync();
          token = fcmToken.data;
          console.log('✅ [PUSH TOKEN] Native FCM token obtained');
          console.log('📱 [PUSH TOKEN] Token type:', fcmToken.type); // Should be "fcm"
        } else if (Platform.OS === 'ios') {
          // For iOS: Get APNs token (will be handled by Firebase Admin SDK)
          console.log('🔑 [PUSH TOKEN] Getting APNs token for iOS...');
          const apnsToken = await Notifications.getDevicePushTokenAsync();
          token = apnsToken.data;
          console.log('✅ [PUSH TOKEN] Native APNs token obtained');
          console.log('📱 [PUSH TOKEN] Token type:', apnsToken.type); // Should be "apns"
        } else {
          console.error('❌ [PUSH TOKEN] Unsupported platform:', Platform.OS);
          return null;
        }
        
        // ✅ ENHANCED LOGGING: Mask token for security but show enough to verify
        const maskedToken = token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : 'null';
        console.log('📱 [PUSH TOKEN] Native token generated (masked):', maskedToken);
        console.log('📱 [PUSH TOKEN] Token length:', token?.length || 0);
        console.log('✅ [PUSH TOKEN] Token compatible with Firebase Admin SDK');
      } catch (error) {
        console.error('❌ [PUSH TOKEN] Error getting native push token:', error);
        console.error('❌ [PUSH TOKEN] Error message:', error.message);
        console.error('❌ [PUSH TOKEN] This may indicate missing google-services.json or Firebase configuration');
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
        console.log('⚠️ [PUSH SERVICE] No auth token found, cannot save push token (user not logged in)');
        console.log('⚠️ [PUSH SERVICE] Token will be saved automatically after login');
        return;
      }

      // ✅ ENHANCED LOGGING: Mask token for security
      const maskedToken = token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : 'null';
      console.log('📤 [PUSH SERVICE] Saving push token to server (masked):', maskedToken);
      console.log('📤 [PUSH SERVICE] Token length:', token?.length || 0);
      console.log('📤 [PUSH SERVICE] API endpoint:', `${API_BASE_URL}/user-profile/push-token`);
      console.log('📤 [PUSH SERVICE] Auth token present:', !!authToken);

      const response = await fetch(`${API_BASE_URL}/user-profile/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ pushToken: token }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log('✅ [PUSH SERVICE] Push token saved to server successfully');
        console.log('📥 [PUSH SERVICE] Server response:', responseData);
      } else {
        console.error('❌ [PUSH SERVICE] Failed to save push token to server');
        console.error('📥 [PUSH SERVICE] Response status:', response.status);
        console.error('📥 [PUSH SERVICE] Response data:', responseData);
      }
    } catch (error) {
      console.error('❌ [PUSH SERVICE] Error saving push token to server:', {
        message: error.message,
        error: error,
        stack: error.stack
      });
    }
  }

  // Utility function to test push notification (for debugging)
  async testPushNotification() {
    const token = this.expoPushToken || await this.registerForPushNotificationsAsync();
    if (!token) {
      console.error('❌ No push token available for testing');
      return;
    }
    
    console.log('🧪 TEST: Push token for testing:', token);
    console.log('🧪 TEST: Use this token with Expo Push Notification Tool:');
    console.log('🧪 TEST: https://expo.dev/notifications');
    console.log('🧪 TEST: Or call backend endpoint to send test notification');
    
    return token;
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