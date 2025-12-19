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
    // Safely initialize AdMob only if native module is available
    // This prevents errors in Expo Go (where native modules aren't available)
    const initializeAds = async () => {
      try {
        // Dynamically import to avoid errors if module doesn't exist
        const mobileAds = require('react-native-google-mobile-ads').default;
        await mobileAds().initialize();
        console.log('✅ AdMob initialized successfully');
      } catch (error: any) {
        // Silently handle errors - expected in Expo Go or if module not available
        if (error?.message?.includes('TurboModuleRegistry') || 
            error?.message?.includes('RNGoogleMobileAdsModule')) {
          console.log('ℹ️ AdMob not available (expected in Expo Go - requires EAS build)');
        } else {
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
              }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/signup" />
                <Stack.Screen name="auth/forgot" />
                <Stack.Screen name="auth/otp-verification" />
                <Stack.Screen name="auth/reset-password" />
                <Stack.Screen name="(dashboard)" />
                <Stack.Screen
                  name="gym-exercises"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                  }}
                />
                <Stack.Screen
                  name="exercise-workout"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'slide_from_bottom',
                  }}
                />
                <Stack.Screen
                  name="workout-player"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'slide_from_bottom',
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
