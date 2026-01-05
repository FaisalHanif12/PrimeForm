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

// ✅ CRITICAL: Prevent web bundling from importing native modules
// Web builds should never import react-native-google-mobile-ads
let mobileAdsModule: any = null;

if (Platform.OS !== 'web') {
  // Native platform only - safe to import
  try {
    mobileAdsModule = require('react-native-google-mobile-ads').default;
  } catch (error) {
    // Module not available (e.g., in Expo Go)
    if (__DEV__) {
      console.log('ℹ️ [ADMOB] MobileAds module not available (requires EAS build)');
    }
  }
} else {
  // Web platform - log once
  if (__DEV__) {
    console.log('ℹ️ [ADMOB] Web platform detected - MobileAds not available');
  }
}

export default function RootLayout() {
  useEffect(() => {
    // Check for Expo Updates when app comes to foreground
    const checkForUpdates = async () => {
      if (__DEV__ || !Updates.isEnabled) {
        // Skip in development or if updates are disabled
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
        // Silently fail - updates will be checked on next app launch
        if (__DEV__) {
          console.log('Update check failed:', error);
        }
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
      // Skip AdMob initialization if module is not available (web or Expo Go)
      if (!mobileAdsModule) {
        return;
      }

      try {
        await mobileAdsModule().initialize();
        
        // ✅ PRODUCTION: AdMob SDK initialized successfully
        // Ads will now work in production builds
        if (__DEV__) {
          console.log('✅ AdMob initialized successfully (Development Mode)');
        } else {
          console.log('✅ AdMob initialized successfully (Production Mode - Real Ads Active)');
        }
      } catch (error: any) {
        // Log errors for debugging - expected in Expo Go, but should work in EAS builds
        if (error?.message?.includes('TurboModuleRegistry') || 
            error?.message?.includes('RNGoogleMobileAdsModule')) {
          // This is expected in Expo Go - native modules require EAS build
          if (__DEV__) {
            console.log('ℹ️ AdMob not available (expected in Expo Go - requires EAS build)');
          } else {
            // In production build, this should not happen - log as warning
            console.warn('⚠️ AdMob module not found in EAS build. Check native module compilation.');
          }
        } else {
          // Unexpected error - log full error for debugging
          console.error('❌ AdMob initialization error:', {
            message: error?.message,
            error: error,
            stack: error?.stack
          });
        }
      }
    };

    initializeAds();

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
