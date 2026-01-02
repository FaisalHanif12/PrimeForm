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

        // ✅ PERFORMANCE: Load all AsyncStorage items in parallel
        const [hasEverSignedUp, isFirstLaunch] = await Promise.all([
          AsyncStorage.getItem('primeform_has_ever_signed_up'),
          AsyncStorage.getItem('primeform_first_launch')
        ]);
        
        // ✅ CRITICAL: ALWAYS check if user has ever signed up FIRST (this flag should NEVER be cleared)
        // This is the PRIMARY gate - if user has signed up, they MUST go to login if not authenticated
        // ✅ CRITICAL: If user has ever signed up, they should NEVER see guest mode
        // Always redirect to login if not authenticated - NO EXCEPTIONS
        if (hasEverSignedUp === 'true') {
          // Ensure language modal never shows for users who have ever signed up (non-blocking)
          AsyncStorage.setItem('primeform_device_language_selected', 'true').catch(() => {});
          
          // ✅ CRITICAL: Check authentication status
          // If authenticated (token exists and valid), go to dashboard
          // If not authenticated but token exists, wait for auth check to complete
          // Only redirect to login if truly no token or token is invalid
          if (isAuthenticated) {
            // User has valid token - go to dashboard
            router.replace('/(dashboard)');
            return;
          } else {
            // User has signed up but isAuthenticated is false
            // This could mean:
            // 1. Token doesn't exist (user logged out or token was cleared)
            // 2. Token exists but is invalid (401 - will be handled by AuthContext)
            // 3. App is still loading (isLoading = true) - wait for it to complete
            
            // ✅ CRITICAL: If app is still loading, wait for auth check to complete
            // AuthContext will handle token validation and logout only on 401
            if (isLoading) {
              // Still loading - wait for auth check to complete
              // AuthContext will set isAuthenticated once token is validated
              return;
            }
            
            // ✅ CRITICAL: App finished loading but user is not authenticated
            // This means either:
            // - Token doesn't exist (user logged out)
            // - Token was invalid and AuthContext already cleared it (401)
            // In both cases, redirect to login
            // Do NOT clear token here - AuthContext already handles 401 cases
            router.replace('/auth/login');
            return;
          }
        }

        // ✅ CRITICAL: Only reach here if user has NEVER signed up
        // User has NEVER signed up - check if this is first launch
        
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
        // ✅ CRITICAL: Fallback - ALWAYS check if user has ever signed up first
        try {
          const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
          if (hasEverSignedUp === 'true') {
            // User has signed up before - ALWAYS redirect to login, never guest mode
            router.replace('/auth/login');
          } else {
            // Guest user - redirect to dashboard
            router.replace('/(dashboard)');
          }
        } catch (fallbackError) {
          // Ultimate fallback - check one more time for has_ever_signed_up
          try {
            const hasEverSignedUp = await AsyncStorage.getItem('primeform_has_ever_signed_up');
            if (hasEverSignedUp === 'true') {
              router.replace('/auth/login');
            } else {
              router.replace('/(dashboard)');
            }
          } catch (finalError) {
            // Last resort - if we can't check, assume guest mode (but this should never happen)
            router.replace('/(dashboard)');
          }
        }
      } finally {
        setIsCheckingUserState(false);
      }
    };

    // ✅ CRITICAL: Run when loading completes OR when auth state changes
    // This ensures we catch token expiration immediately
    if (!isLoading) {
      checkUserState();
    }
  }, [isLoading, isAuthenticated]); // ✅ Respond to both loading and auth state changes

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
