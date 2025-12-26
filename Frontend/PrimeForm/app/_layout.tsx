import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { colors } from '../src/theme/colors';
import { AuthProvider } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';
import NotificationHandler from '../src/components/NotificationHandler';

export default function RootLayout() {
  useEffect(() => {

    const initializeAds = async () => {
      try {
        // Dynamically import to avoid errors if module doesn't exist
        const mobileAds = require('react-native-google-mobile-ads').default;
        await mobileAds().initialize();
        
        // ✅ PRODUCTION: AdMob SDK initialized successfully
        // Ads will now work in production builds
        if (__DEV__) {
          console.log('✅ AdMob initialized successfully (Development Mode)');
        } else {
          console.log('✅ AdMob initialized successfully (Production Mode - Real Ads Active)');
        }
      } catch (error: any) {
        // Silently handle errors - expected in Expo Go or if module not available
        if (error?.message?.includes('TurboModuleRegistry') || 
            error?.message?.includes('RNGoogleMobileAdsModule')) {
          // This is expected in Expo Go - native modules require EAS build
          if (__DEV__) {
            console.log('ℹ️ AdMob not available (expected in Expo Go - requires EAS build)');
          }
        } else {
          // Unexpected error - log in production for debugging
          console.warn('⚠️ AdMob initialization error:', error?.message || error);
        }
      }
    };

    initializeAds();
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
