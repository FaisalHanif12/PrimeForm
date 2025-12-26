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

const PROFILE_CACHE_BASE_KEY = 'cached_user_profile';
// No expiry time needed - cache is valid forever until user logs out

interface CachedProfile {
  user: User;
  timestamp: number;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false); // Track if token exists separately

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await authService.getToken();
      
      if (!token) {
        // No token exists - user is not authenticated
        setHasToken(false); // Update token state
        const userId = await getCurrentUserId();
        if (userId) {
          const cacheKey = await getUserCacheKey(PROFILE_CACHE_BASE_KEY, userId);
          await AsyncStorage.removeItem(cacheKey);
        }
        setUser(null);
        setIsLoading(false);
        return;
      }

      // ✅ FITNESS APP: Token exists = user is logged in! No questions asked.
      // Stay logged in until user explicitly logs out or gets 401
      setHasToken(true);

      // Get user ID for account-specific cache
      const userId = await getCurrentUserId();
      const cacheKey = await getUserCacheKey(PROFILE_CACHE_BASE_KEY, userId);

      // ✅ FITNESS APP: Check cache FIRST - if profile exists, use it forever!
      // No expiry check - cached profile is always valid until user logs out
      try {
        const cachedProfileJson = await AsyncStorage.getItem(cacheKey);
        if (cachedProfileJson) {
          const cachedProfile: CachedProfile = JSON.parse(cachedProfileJson);
          
          // ✅ FITNESS APP: Cache always valid - no time check!
          // User stays logged in with cached profile forever
          if (cachedProfile.user) {
            setUser(cachedProfile.user);
            
            // Initialize completion services
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
            return; // ✅ User stays logged in forever with cached profile!
          }
        }
      } catch (cacheError) {
        // Cache read failed - but still don't logout! Just try to fetch profile
        console.warn('⚠️ AuthContext: Cache read failed, will try to fetch profile');
      }

      // ✅ FITNESS APP: No cached profile - try to fetch (optional)
      // This only runs on first login or if cache was cleared
      // If fetch fails for any reason except 401, user STILL stays logged in with token
      try {
        const response = await authService.getProfile();
        
        // ✅ FITNESS APP: ONLY logout on explicit 401 (token truly expired/invalid)
        // Everything else = user stays logged in
        if (response.tokenExpired || response.statusCode === 401) {
          // Token is definitely invalid - this is the ONLY case we logout
          console.warn('🔒 AuthContext: Token expired (401) - logging out');
          setHasToken(false);
          await authService.clearToken();
          if (userId) {
            await AsyncStorage.removeItem(cacheKey);
          }
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // ✅ FITNESS APP: Profile fetch succeeded - update cache
        if (response.success && response.data?.user) {
          const userData = response.data.user;
          setUser(userData);
          
          // Cache the fresh profile data
          try {
            const cacheData: CachedProfile = {
              user: userData,
              timestamp: Date.now()
            };
            if (userId) {
              await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
            }
          } catch (cacheError) {
            // Cache write failed, but user is still logged in
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
          // ✅ FITNESS APP: Profile fetch returned unexpected response
          // But NOT a 401, so DON'T logout - just log warning
          console.warn('⚠️ AuthContext: Profile fetch returned non-success, but keeping user logged in');
          // Keep hasToken true, keep user logged in
          // They can still use the app even if profile fetch fails
        }
      } catch (profileError: any) {
        // ✅ FITNESS APP: Profile fetch threw error - check if it's 401
        if (profileError?.statusCode === 401 || profileError?.message?.includes('401')) {
          // Explicit 401 - token is invalid
          console.warn('🔒 AuthContext: 401 error - logging out');
          setHasToken(false);
          await authService.clearToken();
          if (userId) {
            await AsyncStorage.removeItem(cacheKey);
          }
          setUser(null);
        } else {
          // ✅ FITNESS APP: Network error, backend down, etc - STAY LOGGED IN!
          console.warn('⚠️ AuthContext: Profile fetch failed (not 401) - keeping user logged in:', profileError?.message);
          // Token still valid, just couldn't reach server
          // User stays authenticated with existing token
        }
      }
    } catch (error) {
      // ✅ FITNESS APP: Top-level catch - something went very wrong
      // But still don't logout unless we know token is invalid
      console.warn('⚠️ AuthContext: Unexpected error in auth check - keeping user logged in:', error);
      // Keep token and authentication state
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
      setHasToken(false); // Clear token state
      setUser(null);
      // ✅ CRITICAL: Profile cache is PRESERVED on logout (like all other user data)
      // Profile data persists in storage with user-specific key: user_<userId>_cached_user_profile
      // This allows faster loading when user logs back in
      // Only in-memory state is cleared via userProfileService.resetInMemoryState()
      // No need to clear storage - it's preserved in clearUserCache() preservedKeyFragments
    } catch (error) {
      // Clear local state even if API call fails
      setHasToken(false); // Clear token state
      setUser(null);
      // Profile cache still preserved in storage
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user || hasToken, // Authenticated if user exists OR token exists
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
