import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserCacheKey, getCurrentUserId } from '../utils/cacheKeys';

interface User {
  fullName: string;
  email: string;
  isEmailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// ✅ CRITICAL: Cache profile data to avoid unnecessary API calls
// Using account-specific cache keys via getUserCacheKey utility
const PROFILE_CACHE_BASE_KEY = 'cached_user_profile';
const PROFILE_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes cache expiry

interface CachedProfile {
  user: User;
  timestamp: number;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await authService.getToken();
      
      if (!token) {
        // No token exists - user is not authenticated
        const userId = await getCurrentUserId();
        if (userId) {
          const cacheKey = await getUserCacheKey(PROFILE_CACHE_BASE_KEY, userId);
          await AsyncStorage.removeItem(cacheKey);
        }
        setUser(null);
        setIsLoading(false);
        return;
      }

      // ✅ CRITICAL: Get user ID for account-specific cache
      const userId = await getCurrentUserId();
      const cacheKey = await getUserCacheKey(PROFILE_CACHE_BASE_KEY, userId);

      // Token exists - validate it by fetching profile
      // ✅ CRITICAL: Check cache first before making API call
      try {
        const cachedProfileJson = await AsyncStorage.getItem(cacheKey);
        if (cachedProfileJson) {
          const cachedProfile: CachedProfile = JSON.parse(cachedProfileJson);
          const cacheAge = Date.now() - cachedProfile.timestamp;
          
          // Use cached profile if it's still fresh (less than 5 minutes old)
          if (cacheAge < PROFILE_CACHE_EXPIRY_MS && cachedProfile.user) {
            setUser(cachedProfile.user);
            
            // ✅ CRITICAL: Initialize completion services when using cached profile
            // This ensures completion data is loaded when app starts with cached session
            try {
              const { default: mealCompletionService } = await import('../services/mealCompletionService');
              await mealCompletionService.initialize();
            } catch (error) {
              // Ignore if service not available
            }

            try {
              const { default: exerciseCompletionService } = await import('../services/exerciseCompletionService');
              await exerciseCompletionService.initialize();
            } catch (error) {
              // Ignore if service not available
            }
            
            setIsLoading(false);
            return; // Exit early - no API call needed
          }
        }
      } catch (cacheError) {
        // Cache read failed, proceed to API call
      }

      // Cache miss or expired - fetch from API to validate token
      try {
        const response = await authService.getProfile();
        
        // ✅ CRITICAL: Check if token expired (401 response)
        if (response.tokenExpired || response.statusCode === 401 || !response.success) {
          // Token is invalid/expired - clear it and cache
          // ✅ CRITICAL: DO NOT clear 'primeform_has_ever_signed_up' - preserve user history
          // This ensures users who have signed up are redirected to login, not guest mode
          await authService.clearToken();
          if (userId) {
            await AsyncStorage.removeItem(cacheKey);
          }
          setUser(null);
          setIsLoading(false);
          // ✅ CRITICAL: Don't return here - let the component handle navigation
          // The app/index.tsx will check primeform_has_ever_signed_up and redirect to login
          return;
        }
        
        if (response.success && response.data?.user) {
          const userData = response.data.user;
          setUser(userData);
          
          // ✅ CRITICAL: Cache the profile data with account-specific key
          try {
            const cacheData: CachedProfile = {
              user: userData,
              timestamp: Date.now()
            };
            if (userId) {
              await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
            }
          } catch (cacheError) {
            // Cache write failed, but user data is still set
          }

          // ✅ CRITICAL: Initialize completion services for logged-in user
          // This ensures completion data is loaded when app starts with existing session
          // Add small delay to ensure user ID is set
          await new Promise(resolve => setTimeout(resolve, 50));
          
          try {
            const { default: mealCompletionService } = await import('../services/mealCompletionService');
            await mealCompletionService.initialize();
            // ✅ CRITICAL: Verify initialization succeeded
            const mealData = mealCompletionService.getCompletionData();
            console.log('✅ AuthContext: Meal completion service initialized with', mealData.completedMeals.length, 'meals');
          } catch (error) {
            console.error('❌ AuthContext: Error initializing meal completion service:', error);
            // Retry once
            try {
              const { default: mealCompletionService } = await import('../services/mealCompletionService');
              await mealCompletionService.initialize();
            } catch (retryError) {
              console.error('❌ AuthContext: Retry failed for meal completion service:', retryError);
            }
          }

          try {
            const { default: exerciseCompletionService } = await import('../services/exerciseCompletionService');
            await exerciseCompletionService.initialize();
            // ✅ CRITICAL: Verify initialization succeeded
            const exerciseData = exerciseCompletionService.getCompletionData();
            console.log('✅ AuthContext: Exercise completion service initialized with', exerciseData.completedExercises.length, 'exercises');
          } catch (error) {
            console.error('❌ AuthContext: Error initializing exercise completion service:', error);
            // Retry once
            try {
              const { default: exerciseCompletionService } = await import('../services/exerciseCompletionService');
              await exerciseCompletionService.initialize();
            } catch (retryError) {
              console.error('❌ AuthContext: Retry failed for exercise completion service:', retryError);
            }
          }

          // ✅ CRITICAL: Initialize user profile service to load cached profile data
          // This ensures profile data is available immediately after login
          try {
            const { default: userProfileService } = await import('../services/userProfileService');
            // Initialize cache (loads from storage if available)
            await userProfileService.getCachedData();
          } catch (error) {
            // Ignore if service not available
          }
        } else {
          // Token is invalid/expired - clear it and cache
          // ✅ CRITICAL: DO NOT clear 'primeform_has_ever_signed_up' - preserve user history
          await authService.clearToken();
          if (userId) {
            await AsyncStorage.removeItem(cacheKey);
          }
          setUser(null);
        }
      } catch (profileError: any) {
        // Profile fetch failed - token might be invalid
        // Check if it's a 401 error
        if (profileError?.statusCode === 401 || profileError?.message?.includes('401') || profileError?.message?.includes('expired')) {
          await authService.clearToken();

          setUser(null);
        } else {
          // Other errors - still clear token to be safe
          await authService.clearToken();
          // ✅ CRITICAL: Profile cache is PRESERVED even on errors
          // Profile data persists in storage with user-specific key
          setUser(null);
        }
      }
    } catch (error) {
      setUser(null);
      // Only clear token if there's an error, but preserve user data
      try {
        await authService.clearToken();
    
      } catch (clearError) {
        // Ignore clear errors
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      // ✅ CRITICAL: Profile cache is PRESERVED on logout (like all other user data)
      // Profile data persists in storage with user-specific key: user_<userId>_cached_user_profile
      // This allows faster loading when user logs back in
      // Only in-memory state is cleared via userProfileService.resetInMemoryState()
      // No need to clear storage - it's preserved in clearUserCache() preservedKeyFragments
    } catch (error) {
      // Clear local state even if API call fails
      setUser(null);
      // Profile cache still preserved in storage
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
