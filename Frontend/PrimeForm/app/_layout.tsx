import { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import { Stack } from 'expo-router';
import * as Updates from 'expo-updates';
import { colors } from '../src/theme/colors';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import NotificationHandler from '../src/components/NotificationHandler';
import notificationSettingsService from '../src/services/notificationSettingsService';

let mobileAdsModule: any = null;

if (Platform.OS !== 'web') {
  // Native platform only - safe to import
  try {
    mobileAdsModule = require('react-native-google-mobile-ads').default;
  } catch (error) {
    // Module not available (e.g., in Expo Go) - silent in production
  }
}

export default function RootLayout() {
  useEffect(() => {
    // Check for Expo Updates when app comes to foreground
    const checkForUpdates = async () => {
      // Check if updates are enabled
      if (!Updates.isEnabled) {
        return;
      }

      try {
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          // Update is available, download it
          await Updates.fetchUpdateAsync();
          // Reload app to apply update
          await Updates.reloadAsync();
        }
      } catch (error) {
        // Updates will be checked on next app launch automatically
        console.error('❌ Update check failed:', error);
      }
    };
    // Check for updates on app startup
    checkForUpdates();
    // Also check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkForUpdates();
      }
    });

    // Initialize AdMob SDK once at app startup (native platforms only)
    const initializeAds = async () => {
      console.log('📱 [ADMOB SDK] Starting AdMob SDK initialization...');
      console.log('📱 [ADMOB SDK] Platform:', Platform.OS);
      console.log('📱 [ADMOB SDK] Module available:', !!mobileAdsModule);
      
      // Skip AdMob initialization if module is not available (web or Expo Go)
      if (!mobileAdsModule) {
        console.log('⚠️ [ADMOB SDK] AdMob module not available (web or Expo Go)');
        return;
      }

      try {
        console.log('📱 [ADMOB SDK] Initializing Google Mobile Ads SDK...');
        await mobileAdsModule().initialize();
        console.log('✅ [ADMOB SDK] AdMob SDK initialized successfully!');
        console.log('✅ [ADMOB SDK] Ready to show ads');
      } catch (error: any) {
        console.error('❌ [ADMOB SDK] AdMob initialization error:', error);
        console.error('❌ [ADMOB SDK] Error message:', error?.message);
        
        // AdMob initialization error - log only critical errors
        if (!error?.message?.includes('TurboModuleRegistry') && 
            !error?.message?.includes('RNGoogleMobileAdsModule')) {
          // Unexpected error - log for debugging
          console.error('❌ [ADMOB SDK] Unexpected initialization error:', error?.message);
        }
      }
    };

    initializeAds();

    // Initialize notification settings
    notificationSettingsService.initialize();

    return () => {
      subscription?.remove();
    };
  }, []);
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <NotificationHandler>
              <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
                animationDuration: 200,
                fullScreenGestureEnabled: false,
              }}>
                <Stack.Screen 
                  name="index"
                  options={{
                    animation: 'fade',
                  }}
                />
                <Stack.Screen 
                  name="auth/login"
                  options={{
                    animation: 'fade',
                  }}
                />
                <Stack.Screen 
                  name="auth/signup"
                  options={{
                    animation: 'fade',
                  }}
                />
                <Stack.Screen 
                  name="auth/forgot"
                  options={{
                    animation: 'fade',
                  }}
                />
                <Stack.Screen 
                  name="auth/otp-verification"
                  options={{
                    animation: 'fade',
                  }}
                />
                <Stack.Screen 
                  name="auth/reset-password"
                  options={{
                    animation: 'fade',
                  }}
                />
                <Stack.Screen 
                  name="(dashboard)"
                  options={{
                    animation: 'fade',
                  }}
                />
                <Stack.Screen
                  name="gym-exercises"
                  options={{
                    presentation: 'card',
                    animation: 'fade_from_bottom',
                    animationDuration: 250,
                  }}
                />
                <Stack.Screen
                  name="exercise-workout"
                  options={{
                    presentation: 'transparentModal',
                    animation: 'fade',
                    animationDuration: 250,
                  }}
                />
                <Stack.Screen
                  name="workout-player"
                  options={{
                    presentation: 'transparentModal',
                    animation: 'fade',
                    animationDuration: 250,
                  }}
                />
              </Stack>
            </NotificationHandler>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
