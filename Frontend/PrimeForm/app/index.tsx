import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, fonts } from '../src/theme/colors';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [isCheckingUserState, setIsCheckingUserState] = useState(true);

  useEffect(() => {
    const checkUserState = async () => {
      try {
        // Check if this is the very first launch of the app
        const isFirstLaunch = await AsyncStorage.getItem('primeform_first_launch');
        console.log('🔍 App State Check:', { isFirstLaunch, isAuthenticated });
        
        if (!isFirstLaunch) {
          // This is the very first time the app is launched
          // Set first launch flag and redirect to dashboard for guest mode
          console.log('🚀 First time user - redirecting to dashboard for guest mode');
          await AsyncStorage.setItem('primeform_first_launch', 'true');
          router.replace('/(dashboard)');
          return;
        }

        // Check if user has ever completed signup (even if currently logged out)
        const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
        const hasCompletedSignup = await AsyncStorage.getItem('primeform_signup_completed');
        console.log('🔍 User History:', { hasEverSignedUp, hasCompletedSignup, isAuthenticated });
        
        // CRITICAL: Ensure language modal never shows for users who have ever signed up
        if (hasEverSignedUp === 'true' || hasCompletedSignup === 'true') {
          await AsyncStorage.setItem('primeform_device_language_selected', 'true');
        }
        
        if (hasEverSignedUp === 'true' || hasCompletedSignup === 'true') {
          // User has either signed up before OR completed signup in current session
          if (isAuthenticated) {
            // User has valid token - always go to dashboard
            console.log('✅ Returning authenticated user - redirecting to dashboard');
            router.replace('/(dashboard)');
          } else {
            // User has no valid token - check if they recently completed signup
            if (hasCompletedSignup === 'true') {
              // User completed signup but token might be expired/invalid
              // Check if token is truly expired by trying to validate it
              try {
                const { authService } = await import('../src/services/authService');
                const isStillValid = await authService.isAuthenticated();
                
                if (isStillValid) {
                  // Token is still valid, redirect to dashboard
                  console.log('🎯 User completed signup recently and token is valid - redirecting to dashboard');
                  router.replace('/(dashboard)');
                } else {
                  // Token is expired, user needs to login again
                  console.log('🔐 User completed signup but token expired - redirecting to login');
                  router.replace('/auth/login');
                }
              } catch (error) {
                // If we can't check token validity, assume it's expired and redirect to login
                console.log('🔐 Cannot verify token - redirecting to login');
                router.replace('/auth/login');
              }
            } else {
              // User has signed up before but is currently logged out
              console.log('🔐 Returning user (logged out) - redirecting to login');
              router.replace('/auth/login');
            }
          }
        } else {
          // User has launched the app before but never completed signup
          // This is a returning guest user - redirect to dashboard
          console.log('👤 Returning guest user - redirecting to dashboard');
          router.replace('/(dashboard)');
        }
      } catch (error) {
        console.error('❌ Error checking user state:', error);
        // Fallback to dashboard for guest mode
        router.replace('/(dashboard)');
      } finally {
        setIsCheckingUserState(false);
      }
    };

    if (!isLoading) {
      checkUserState();
    }
  }, [isAuthenticated, isLoading]);

  // Show loading while checking user state
  if (isLoading || isCheckingUserState) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // This component should never render content, it only handles routing
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.white,
    fontSize: typography.body,
    fontFamily: fonts.body,
    marginTop: spacing.md,
  },
});
