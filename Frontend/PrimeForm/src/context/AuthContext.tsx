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
          await authService.clearToken();
          if (userId) {
            await AsyncStorage.removeItem(cacheKey);
          }
          setUser(null);
          setIsLoading(false);
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

          // ✅ CRITICAL: Initialize user profile service to load cached profile data
          // This ensures profile data is available immediately after login
          try {
            const { default: userProfileService } = await import('../services/userProfileService');
            // Initialize cache (loads from storage if available)
            await userProfileService.getCachedData();
            console.log('✅ User profile service initialized on app start');
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
          if (userId) {
            await AsyncStorage.removeItem(cacheKey);
          }
          setUser(null);
        } else {
          // Other errors - still clear token to be safe
          await authService.clearToken();
          if (userId) {
            await AsyncStorage.removeItem(cacheKey);
          }
          setUser(null);
        }
      }
    } catch (error) {
      setUser(null);
      // Only clear token if there's an error, but preserve user history
      try {
        await authService.clearToken();
        const userId = await getCurrentUserId();
        if (userId) {
          const cacheKey = await getUserCacheKey(PROFILE_CACHE_BASE_KEY, userId);
          await AsyncStorage.removeItem(cacheKey);
        }
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
      // ✅ CRITICAL: Clear cached profile on logout (account-specific)
      const userId = await getCurrentUserId();
      if (userId) {
        const cacheKey = await getUserCacheKey(PROFILE_CACHE_BASE_KEY, userId);
        await AsyncStorage.removeItem(cacheKey);
      }
    } catch (error) {
      // Clear local state even if API call fails
      setUser(null);
      const userId = await getCurrentUserId();
      if (userId) {
        const cacheKey = await getUserCacheKey(PROFILE_CACHE_BASE_KEY, userId);
        await AsyncStorage.removeItem(cacheKey);
      }
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
