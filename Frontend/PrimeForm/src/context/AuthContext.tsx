import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const PROFILE_CACHE_KEY = 'cached_user_profile';
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
      const isAuth = await authService.isAuthenticated();
      
      if (isAuth) {
        // ✅ CRITICAL: Check cache first before making API call
        try {
          const cachedProfileJson = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
          if (cachedProfileJson) {
            const cachedProfile: CachedProfile = JSON.parse(cachedProfileJson);
            const cacheAge = Date.now() - cachedProfile.timestamp;
            
            // Use cached profile if it's still fresh (less than 5 minutes old)
            if (cacheAge < PROFILE_CACHE_EXPIRY_MS && cachedProfile.user) {
              console.log('✅ Using cached user profile (age:', Math.round(cacheAge / 1000), 'seconds)');
              setUser(cachedProfile.user);
              setIsLoading(false);
              return; // Exit early - no API call needed
            }
          }
        } catch (cacheError) {
          // Cache read failed, proceed to API call
          console.log('⚠️ Cache read failed, fetching from API');
        }

        // Cache miss or expired - fetch from API
        const response = await authService.getProfile();
        if (response.success && response.data?.user) {
          const userData = response.data.user;
          setUser(userData);
          
          // ✅ CRITICAL: Cache the profile data
          try {
            const cacheData: CachedProfile = {
              user: userData,
              timestamp: Date.now()
            };
            await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
            console.log('✅ Cached user profile');
          } catch (cacheError) {
            // Cache write failed, but user data is still set
            console.warn('⚠️ Failed to cache profile, but user data loaded');
          }
        } else {
          // Token might be invalid, clear it and cache
          await authService.clearToken();
          await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
          setUser(null);
        }
      } else {
        // Not authenticated - clear cache
        await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      await authService.clearToken();
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
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
      // ✅ CRITICAL: Clear cached profile on logout
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      setUser(null);
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
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
