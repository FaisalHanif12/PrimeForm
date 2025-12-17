import React, { useState, useEffect, useRef } from 'react';
import { Text, View, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import pushNotificationService from '../services/pushNotificationService';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationHandlerProps {
  children: React.ReactNode;
}

// Moved handleRegistrationError inside component to access showToast

const NotificationHandler: React.FC<NotificationHandlerProps> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();

  const handleRegistrationError = (errorMessage: string) => {
    console.error('Push notification registration failed:', errorMessage);
    
    // Check if running in Expo Go and provide specific guidance
    if (errorMessage.includes('Must use physical device') || Constants.appOwnership === 'expo') {
      showToast('warning', t('notification.push.require.device'));
    } else {
      showToast('error', t('notification.push.setup.failed'));
    }
  };

  useEffect(() => {
    // Check if running in Expo Go and show warning
    if (Constants.appOwnership === 'expo') {
      console.warn('⚠️ Running in Expo Go - Push notifications will not work');
      showToast('warning', t('notification.push.expo.go'));
      return;
    }
    
    registerForPushNotificationsAsync(handleRegistrationError)
      .then(token => {
        setExpoPushToken(token);
        if (token) {
          console.log('✅ Push notification token registered:', token);
          showToast('success', t('notification.push.enabled'));
        }
      })
      .catch((error: any) => {
        console.error('❌ Failed to register for push notifications:', error);
        showToast('error', t('notification.push.setup.failed'));
      });

    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      try {
        console.log('📱 Notification received:', notification);
        const notificationLanguage = notification.request.content.data?.language;
        console.log(`📱 Notification language: ${notificationLanguage}, App language: ${language}`);
        setNotification(notification);
        
        // Show a toast for the received notification
        const title = notification.request.content.title;
        const body = notification.request.content.body;
        if (title && body) {
          showToast('info', `${title}: ${body}`);
        }
      } catch (error) {
        console.error('❌ Error handling received notification:', error);
        showToast('error', t('notification.error.processing'));
      }
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      try {
        console.log('📱 Notification response:', response);
        const notificationLanguage = response.notification.request.content.data?.language;
        console.log(`📱 Notification tap - Language: ${notificationLanguage}, App language: ${language}`);
        // Handle notification tap here
        handleNotificationResponse(response);
      } catch (error) {
        console.error('❌ Error handling notification response:', error);
        showToast('error', t('notification.error.handling'));
      }
    });

    return () => {
      if (notificationListener.current) {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    try {
      const { notification } = response;
      const { data } = notification.request.content;
      const notificationLanguage = data?.language || 'en';
      
      console.log('🔔 Handling notification response:', {
        type: data?.type,
        notificationLanguage,
        appLanguage: language
      });
      
      // Handle different notification types with language awareness and navigation
      if (data?.type || data?.navigateTo) {
        const navigateTo = data?.navigateTo || data?.actionType;
        
        // Navigate based on notification type
        switch (data.type) {
          case 'welcome':
            console.log(`📱 Welcome notification tapped (${notificationLanguage})`);
            showToast('success', t('notification.action.welcome'));
            router.push('/(dashboard)');
            break;
          case 'diet_plan_created':
          case 'diet_reminder':
            console.log(`📱 Diet notification tapped (${notificationLanguage})`);
            showToast('info', t('notification.action.diet.plan'));
            router.push('/(dashboard)/diet');
            break;
          case 'workout_plan_created':
          case 'workout_reminder':
            console.log(`📱 Workout notification tapped (${notificationLanguage})`);
            showToast('info', t('notification.action.workout.plan'));
            router.push('/(dashboard)/workout');
            break;
          case 'gym_reminder':
            console.log(`📱 Gym notification tapped (${notificationLanguage})`);
            showToast('info', t('notification.action.gym'));
            router.push('/(dashboard)/gym');
            break;
          case 'streak_broken_reminder':
            console.log(`📱 Streak notification tapped (${notificationLanguage})`);
            showToast('info', t('notification.action.streak'));
            router.push('/(dashboard)/streak');
            break;
          case 'general':
            console.log(`📱 General notification tapped (${notificationLanguage})`);
            showToast('info', t('notification.action.general'));
            // Navigate to notifications screen or dashboard
            router.push('/(dashboard)');
            break;
          default:
            // Try to navigate based on navigateTo field
            if (navigateTo) {
              console.log(`📱 Navigating to: ${navigateTo}`);
              try {
                router.push(`/(dashboard)/${navigateTo}` as any);
              } catch (navError) {
                console.error('Navigation error:', navError);
                router.push('/(dashboard)');
              }
            } else {
              console.log(`📱 Unknown notification type tapped (${notificationLanguage})`);
              showToast('warning', t('notification.action.unknown'));
              router.push('/(dashboard)');
            }
        }
      }
    } catch (error) {
      console.error('❌ Error in handleNotificationResponse:', error);
      showToast('error', t('notification.error.handling'));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
    </View>
  );
};

async function registerForPushNotificationsAsync(handleRegistrationError?: (errorMessage: string) => void): Promise<string | undefined> {
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
      handleRegistrationError?.('Permission not granted to get push token for push notification!');
      return;
    }
    
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || (Constants.expoConfig as any)?.projectId;
      
      if (!projectId) {
        handleRegistrationError?.('Project ID not found in app configuration');
        return;
      }
      
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      console.log('📱 Expo Push Token:', pushTokenString);
      
      // Save token to server via push notification service
      await pushNotificationService.savePushTokenToServer(pushTokenString);
      
      return pushTokenString;
    } catch (error: any) {
      console.error('❌ Error getting push token:', error);
      if (error.message && error.message.includes('Invalid uuid')) {
        handleRegistrationError?.('Invalid project ID format. Please check your app.json configuration.');
      } else {
        handleRegistrationError?.(`Failed to get push token: ${error.message}`);
      }
    }
  } else {
    handleRegistrationError?.('Must use physical device for push notifications');
  }
}

export default NotificationHandler;