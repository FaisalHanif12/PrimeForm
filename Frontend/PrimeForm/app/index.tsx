import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, fonts } from '../src/theme/colors';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthContext();
  const [isCheckingUserState, setIsCheckingUserState] = useState(true);
  // ✅ CRITICAL: Use ref to track if we've already checked user state to prevent infinite loops
  const hasCheckedRef = useRef(false);
  const lastAuthStateRef = useRef<boolean | null>(null);

  useEffect(() => {
    const checkUserState = async () => {
      // ✅ CRITICAL: Prevent re-running if auth state hasn't meaningfully changed
      // Only check when loading completes OR when auth state changes from null/undefined to a value
      if (hasCheckedRef.current && lastAuthStateRef.current === isAuthenticated) {
        return;
      }

      try {
        // Mark that we've checked
        hasCheckedRef.current = true;
        lastAuthStateRef.current = isAuthenticated;

        // ✅ CRITICAL: First check if user has ever signed up (this flag should NEVER be cleared)
        const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
        
        // ✅ CRITICAL: If user has ever signed up, they should NEVER see guest mode
        // Always redirect to login if not authenticated
        if (hasEverSignedUp === 'true') {
          // Ensure language modal never shows for users who have ever signed up
          await AsyncStorage.setItem('primeform_device_language_selected', 'true');
          
          // Check if user is currently authenticated
          if (isAuthenticated) {
            // User has valid token - go to dashboard
            router.replace('/(dashboard)');
            return;
          } else {
            // User has signed up before but is not authenticated
            // Check if token exists but might be invalid
            try {
              const { authService } = await import('../src/services/authService');
              const tokenExists = await authService.getToken();
              
              if (tokenExists) {
                // Token exists but user is not authenticated - might be expired
                // Try to validate by checking profile
                try {
                  const profileResponse = await authService.getProfile();
                  
                  // ✅ CRITICAL: Check if token expired (401 response)
                  if (profileResponse.tokenExpired || profileResponse.statusCode === 401) {
                    // Token is expired - clear it and redirect to login
                    await authService.clearToken();
                    router.replace('/auth/login');
                    return;
                  }
                  
                  if (profileResponse.success && profileResponse.data?.user) {
                    // Token is valid, user should be authenticated
                    router.replace('/(dashboard)');
                    return;
                  } else {
                    // Token is invalid/expired - clear it and redirect to login
                    await authService.clearToken();
                    router.replace('/auth/login');
                    return;
                  }
                } catch (profileError: any) {
                  // Profile check failed - token might be invalid
                  await authService.clearToken();
                  router.replace('/auth/login');
                  return;
                }
              } else {
                // No token exists - user needs to login
                router.replace('/auth/login');
                return;
              }
            } catch (error) {
              // Error checking token - redirect to login to be safe
              router.replace('/auth/login');
              return;
            }
          }
        }

        // User has NEVER signed up - check if this is first launch
        const isFirstLaunch = await AsyncStorage.getItem('primeform_first_launch');
        
        if (!isFirstLaunch) {
          // This is the very first time the app is launched
          // Set first launch flag and redirect to dashboard for guest mode
          await AsyncStorage.setItem('primeform_first_launch', 'true');
          router.replace('/(dashboard)');
          return;
        }

        // User has launched the app before but never completed signup
        // This is a returning guest user - redirect to dashboard
        router.replace('/(dashboard)');
      } catch (error) {
        // Fallback: Check if user has ever signed up
        try {
          const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
          if (hasEverSignedUp === 'true') {
            // User has signed up before - redirect to login
            router.replace('/auth/login');
          } else {
            // Guest user - redirect to dashboard
            router.replace('/(dashboard)');
          }
        } catch (fallbackError) {
          // Ultimate fallback - dashboard for guest mode
          router.replace('/(dashboard)');
        }
      } finally {
        setIsCheckingUserState(false);
      }
    };

    // ✅ CRITICAL: Only run when loading completes (not on every auth state change)
    // This prevents infinite loops while still responding to initial auth check
    if (!isLoading) {
      checkUserState();
    }
  }, [isLoading, isAuthenticated]); // ✅ Added isAuthenticated back to respond to auth state changes

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
