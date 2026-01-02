import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserCacheKey, getCurrentUserId, validateCachedData } from '../utils/cacheKeys';

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
            
            // ✅ PERFORMANCE: Initialize completion services in background (non-blocking)
            // Don't wait for initialization - show UI immediately
            Promise.all([
              import('../services/mealCompletionService').then(m => m.default.initialize()).catch(() => {}),
              import('../services/exerciseCompletionService').then(e => e.default.initialize()).catch(() => {})
            ]).catch(() => {}); // Ignore errors - services will initialize when needed
            
            setIsLoading(false);
            return; // ✅ User stays logged in forever with cached profile!
          }
        }
      } catch (cacheError) {
        // Cache read failed - but still don't logout! Just try to fetch profile
        console.warn('⚠️ AuthContext: Cache read failed, will try to fetch profile');
      }

      // ✅ PERFORMANCE: Set loading to false immediately - don't wait for profile fetch
      // User can use the app with token, profile will load in background
      setIsLoading(false);
      
      // ✅ FITNESS APP: No cached profile - try to fetch (optional, non-blocking)
      // This only runs on first login or if cache was cleared
      // If fetch fails for any reason except 401, user STILL stays logged in with token
      // ✅ PERFORMANCE: Fetch profile in background - don't block UI
      // ✅ CRITICAL FIX: Add retry logic for slow API responses (common after app restart)
      (async () => {
        try {
          let retryCount = 0;
          const maxRetries = 2;
          let response: any = null;
          
          // Retry logic for slow/unreliable API responses
          while (retryCount <= maxRetries) {
            try {
              response = await authService.getProfile();
              break; // Success - exit retry loop
            } catch (retryError: any) {
              retryCount++;
              if (retryCount > maxRetries) {
                // All retries failed - throw error to be caught by outer catch
                throw retryError;
              }
              // Wait before retry (exponential backoff: 1s, 2s)
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              console.log(`🔄 AuthContext: Retrying profile fetch (attempt ${retryCount}/${maxRetries})`);
            }
          }
          
          // ✅ FITNESS APP: ONLY logout on explicit 401 (token truly expired/invalid)
          // Everything else = user stays logged in
          if (response.tokenExpired || response.statusCode === 401) {
          // Token is definitely invalid - this is the ONLY case we logout
          console.warn('🔒 AuthContext: Token expired (401) - logging out');
          setHasToken(false);
          authService.clearToken().catch(() => {});
          if (userId) {
            AsyncStorage.removeItem(cacheKey).catch(() => {});
          }
          setUser(null);
          return; // Exit background fetch
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

          // ✅ PERFORMANCE: Initialize completion services in background (non-blocking)
          // Don't wait for initialization - show UI immediately, services will initialize when needed
          Promise.all([
            import('../services/mealCompletionService').then(m => m.default.initialize()).catch(() => {}),
            import('../services/exerciseCompletionService').then(e => e.default.initialize()).catch(() => {}),
            import('../services/userProfileService').then(u => u.default.getCachedData()).catch(() => {})
          ]).catch(() => {}); // Ignore errors - services will initialize when needed
        } else {
          // ✅ CRITICAL FIX: Profile fetch returned unexpected response
          // Try to use cached user data as fallback to prevent "User" display issue
          console.warn('⚠️ AuthContext: Profile fetch returned non-success, trying cached data as fallback');
          try {
            const cachedProfileJson = await AsyncStorage.getItem(cacheKey);
            if (cachedProfileJson) {
              const cachedProfile: CachedProfile = JSON.parse(cachedProfileJson);
              if (cachedProfile.user && validateCachedData(cachedProfile.user, userId)) {
                // Use cached user data to prevent showing "User" instead of actual name
                setUser(cachedProfile.user);
                console.log('✅ AuthContext: Using cached user data as fallback');
              }
            }
          } catch (cacheError) {
            // Cache read failed - user will show as "User" but still logged in
            console.warn('⚠️ AuthContext: Could not load cached user data');
          }
          // Keep hasToken true, keep user logged in
          // They can still use the app even if profile fetch fails
        }
      } catch (profileError: any) {
        // ✅ FITNESS APP: Profile fetch threw error - check if it's 401
        if (profileError?.statusCode === 401 || profileError?.message?.includes('401')) {
          // Explicit 401 - token is invalid
          console.warn('🔒 AuthContext: 401 error - logging out');
          setHasToken(false);
          authService.clearToken().catch(() => {});
          if (userId) {
            AsyncStorage.removeItem(cacheKey).catch(() => {});
          }
          setUser(null);
        } else {
          // ✅ FITNESS APP: Network error, backend down, etc - STAY LOGGED IN!
          console.warn('⚠️ AuthContext: Profile fetch failed (not 401) - keeping user logged in:', profileError?.message);
          // ✅ CRITICAL FIX: Try to use cached user data as fallback when network fails
          // This prevents showing "User" instead of actual name when API is slow/unavailable
          try {
            const cachedProfileJson = await AsyncStorage.getItem(cacheKey);
            if (cachedProfileJson) {
              const cachedProfile: CachedProfile = JSON.parse(cachedProfileJson);
              if (cachedProfile.user && validateCachedData(cachedProfile.user, userId)) {
                // Use cached user data to prevent showing "User" instead of actual name
                setUser(cachedProfile.user);
                console.log('✅ AuthContext: Using cached user data after network error');
              }
            }
          } catch (cacheError) {
            // Cache read failed - user will show as "User" but still logged in
            console.warn('⚠️ AuthContext: Could not load cached user data after network error');
          }
          // Token still valid, just couldn't reach server
          // User stays authenticated with existing token
        }
      }
      })(); // End of background profile fetch
    } catch (error) {
      // ✅ FITNESS APP: Top-level catch - something went very wrong
      // But still don't logout unless we know token is invalid
      console.warn('⚠️ AuthContext: Unexpected error in auth check - keeping user logged in:', error);
      // Keep token and authentication state
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
