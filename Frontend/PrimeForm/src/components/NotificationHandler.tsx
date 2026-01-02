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
      showToast('warning', t('notification.push.expo.go'));
      return;
    }
    
    // ✅ CRITICAL: Register push token on mount (will only save to server if authenticated)
    registerForPushNotificationsAsync(handleRegistrationError)
      .then(token => {
        setExpoPushToken(token);
        if (token) {
          showToast('success', t('notification.push.enabled'));
        }
      })
      .catch((error: any) => {
        showToast('error', t('notification.push.setup.failed'));
      });
  }, []);

  // ✅ CRITICAL: Re-register push token when authentication state changes
  // This ensures token is sent to backend immediately after login
  // Note: This effect runs once on mount and when authToken changes (via polling)
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const checkAuthAndRegister = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const authToken = await AsyncStorage.getItem('authToken');
        
        if (!mounted) return;
        
        if (authToken && !expoPushToken) {
          // User is authenticated but no push token yet - register now
          console.log('🔔 [PUSH] User authenticated, registering push token...');
          const token = await registerForPushNotificationsAsync(handleRegistrationError);
          if (token && mounted) {
            setExpoPushToken(token);
          }
        } else if (authToken && expoPushToken) {
          // User is authenticated and has token - ensure it's saved to server
          console.log('🔔 [PUSH] User authenticated with existing token, ensuring server sync...');
          await pushNotificationService.savePushTokenToServer(expoPushToken);
        }
      } catch (error) {
        console.error('❌ [PUSH] Error checking auth and registering:', error);
      }
    };

    // Check auth status after a short delay to ensure token is stored
    timeoutId = setTimeout(checkAuthAndRegister, 1000);
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Run once on mount - authService.login will trigger push registration

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      try {
        const notificationLanguage = notification.request.content.data?.language;
        setNotification(notification);
        
        // Show a toast for the received notification
        const title = notification.request.content.title;
        const body = notification.request.content.body;
        if (title && body) {
          showToast('info', `${title}: ${body}`);
        }
      } catch (error) {
        showToast('error', t('notification.error.processing'));
      }
    });

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      try {
        // Handle notification tap here
        handleNotificationResponse(response);
      } catch (error) {
        showToast('error', t('notification.error.handling'));
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
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
      
      // Handle different notification types with language awareness and navigation
      if (data?.type || data?.navigateTo) {
        const navigateTo = data?.navigateTo || data?.actionType;
        
        // Navigate based on notification type
        switch (data.type) {
          case 'welcome':
            showToast('success', t('notification.action.welcome'));
            router.push('/(dashboard)');
            break;
          case 'diet_plan_created':
          case 'diet_reminder':
            showToast('info', t('notification.action.diet.plan'));
            router.push('/(dashboard)/diet');
            break;
          case 'workout_plan_created':
          case 'workout_reminder':
            showToast('info', t('notification.action.workout.plan'));
            router.push('/(dashboard)/workout');
            break;
          case 'gym_reminder':
            showToast('info', t('notification.action.gym'));
            router.push('/(dashboard)/gym');
            break;
          case 'streak_broken_reminder':
            showToast('info', t('notification.action.streak'));
            router.push('/(dashboard)/streak');
            break;
          case 'general':
            showToast('info', t('notification.action.general'));
            // Navigate to notifications screen or dashboard
            router.push('/(dashboard)');
            break;
          default:
            // Try to navigate based on navigateTo field
            if (navigateTo) {
              try {
                router.push(`/(dashboard)/${navigateTo}` as any);
              } catch (navError) {
                router.push('/(dashboard)');
              }
            } else {
              showToast('warning', t('notification.action.unknown'));
              router.push('/(dashboard)');
            }
        }
      }
    } catch (error) {
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
  // Create Android notification channel
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
      });
      console.log('✅ Android notification channel created');
    } catch (error) {
      console.error('❌ Error creating Android notification channel:', error);
    }
  }

  if (Device.isDevice) {
    // Request notification permissions (Android 13+ compatible)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📱 Notification permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📱 Notification permission requested, new status:', status);
    }
    
    if (finalStatus !== 'granted') {
      const errorMsg = 'Permission not granted to get push token for push notification!';
      console.error('❌', errorMsg);
      handleRegistrationError?.(errorMsg);
      return;
    }
    
    try {
      // ✅ CRITICAL: Get projectId from app configuration (required for EAS builds)
      // Expo SDK 54: Check Constants.easConfig?.projectId first, then fallback to expoConfig
      const projectId = Constants.easConfig?.projectId || 
                       Constants.expoConfig?.extra?.eas?.projectId || 
                       (Constants.expoConfig as any)?.projectId;
      
      // ✅ ENHANCED LOGGING: Log all relevant info for debugging
      if (__DEV__) {
        console.log('🔔 [PUSH] === Push Token Registration Debug ===');
        console.log('🔔 [PUSH] Device.isDevice:', Device.isDevice);
        console.log('🔔 [PUSH] Platform.OS:', Platform.OS);
        console.log('🔔 [PUSH] Constants.appOwnership:', Constants.appOwnership);
        console.log('🔑 [PUSH] Project ID (easConfig):', Constants.easConfig?.projectId);
        console.log('🔑 [PUSH] Project ID (expoConfig.extra.eas):', Constants.expoConfig?.extra?.eas?.projectId);
        console.log('🔑 [PUSH] Project ID (final selected):', projectId);
      }
      
      if (!projectId) {
        const errorMsg = 'Project ID not found in app configuration';
        console.error('❌ [PUSH]', errorMsg);
        console.error('❌ [PUSH] Available Constants.easConfig:', Constants.easConfig);
        console.error('❌ [PUSH] Available Constants.expoConfig.extra:', Constants.expoConfig?.extra);
        handleRegistrationError?.(errorMsg);
        return;
      }
      
      // Get Expo push token
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const pushTokenString = tokenResponse.data;
      
      // ✅ ENHANCED LOGGING: Mask token for security but show enough to verify
      const maskedToken = pushTokenString ? `${pushTokenString.substring(0, 20)}...${pushTokenString.substring(pushTokenString.length - 10)}` : 'null';
      console.log('📱 [PUSH] Expo Push Token generated (masked):', maskedToken);
      console.log('📱 [PUSH] Token length:', pushTokenString?.length || 0);
      
      // Save token to server via push notification service
      await pushNotificationService.savePushTokenToServer(pushTokenString);
      
      return pushTokenString;
    } catch (error: any) {
      console.error('❌ Error getting Expo push token:', {
        message: error.message,
        error: error,
        stack: error.stack
      });
      
      if (error.message && error.message.includes('Invalid uuid')) {
        handleRegistrationError?.('Invalid project ID format. Please check your app.json configuration.');
      } else {
        handleRegistrationError?.(`Failed to get push token: ${error.message}`);
      }
    }
  } else {
    const errorMsg = 'Must use physical device for push notifications';
    console.warn('⚠️', errorMsg);
    handleRegistrationError?.(errorMsg);
  }
}

export default NotificationHandler;