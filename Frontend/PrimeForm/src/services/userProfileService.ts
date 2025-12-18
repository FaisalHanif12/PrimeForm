import { api } from '../config/api';
import Storage from '../utils/storage';
import { getUserCacheKey, getCurrentUserId, validateCachedData } from '../utils/cacheKeys';

export interface UserInfo {
  country: string;
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
  targetWeight: string;
  bodyGoal: string;
  medicalConditions: string;
  occupationType: string;
  availableEquipment: string;
  dietPreference: string;
}

export interface UserProfile {
  _id: string;
  userId: string;
  country: string;
  age: number;
  gender: string;
  height: string;
  currentWeight: string;
  targetWeight: string;
  bodyGoal: string;
  medicalConditions: string;
  occupationType: string;
  availableEquipment: string;
  dietPreference: string;
  isProfileComplete: boolean;
  badges: string[];
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  badges: string[];
  profile?: UserProfile;
}

class UserProfileService {
  private cache: { data: any; timestamp: number; userId?: string } | null = null;
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes cache - profile rarely changes
  private isLoading = false;
  private pendingCall: Promise<any> | null = null;
  private hasInitialized = false;
  private baseStorageKey = 'cached_user_profile';
  // ✅ CRITICAL: Track current user ID to ensure data integrity across account switches
  private currentUserId: string | null = null;

  // Initialize: Load from AsyncStorage on service creation
  private async initializeCache() {
    if (this.hasInitialized) {
      // ✅ CRITICAL: Re-check user ID on each initialization to handle account switches
      const userId = await getCurrentUserId();
      if (this.currentUserId && this.currentUserId !== userId) {
        // User ID changed, reset cache
        this.cache = null;
        this.hasInitialized = false;
      } else {
        return; // Same user, skip re-initialization
      }
    }
    
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        this.currentUserId = null;
        this.hasInitialized = true;
        return; // No user ID, skip cache initialization
      }

      // ✅ CRITICAL: If user ID changed, reset in-memory state first
      if (this.currentUserId && this.currentUserId !== userId) {
        this.cache = null;
      }

      // Update tracked user ID
      this.currentUserId = userId;

      const storageKey = await getUserCacheKey(this.baseStorageKey, userId);
      const stored = await Storage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that cached data belongs to current user
        if (validateCachedData(parsed.data, userId) && Date.now() - parsed.timestamp < this.cacheTimeout) {
          this.cache = { ...parsed, userId };
        }
      }
      this.hasInitialized = true;
    } catch (error) {
      // Ignore storage errors on initialization
      this.hasInitialized = true;
    }
  }

  // Reset only in-memory state (does NOT clear storage)
  // Used during logout to clear current session data without deleting user's cached profile
  resetInMemoryState(): void {
    this.cache = null;
    this.hasInitialized = false;
    this.isLoading = false;
    this.pendingCall = null;
    this.currentUserId = null; // Clear tracked user ID
  }

  // Clear cache when user changes (called from auth service)
  // ✅ NOTE: This method is kept for explicit cache clearing if needed
  // For logout, use resetInMemoryState() instead to preserve cached profile
  async clearCache() {
    this.cache = null;
    this.hasInitialized = false;
    this.isLoading = false;
    this.pendingCall = null;
    try {
      // Clear both old global key and user-specific keys
      const userId = await getCurrentUserId();
      if (userId) {
        const storageKey = await getUserCacheKey(this.baseStorageKey, userId);
        await Storage.removeItem(storageKey);
      }
      // Also clear old global key for migration
      await Storage.removeItem(this.baseStorageKey);
    } catch (error) {
      // Ignore storage errors
    }
  }

  // Get user profile with caching and debouncing
  async getUserProfile(forceRefresh = false): Promise<{ success: boolean; data: UserProfile | null; message: string }> {
    // Initialize cache from AsyncStorage if not already done
    await this.initializeCache();

    // ✅ CRITICAL: Validate current user ID matches cached user ID
    const userId = await getCurrentUserId();
    if (userId && this.currentUserId && this.currentUserId !== userId) {
      // User ID changed, reset and reinitialize
      this.cache = null;
      this.hasInitialized = false;
      await this.initializeCache();
    }

    // Helper function to extract profile data from cache (handles both old and new formats)
    const extractProfileData = (cachedData: any): UserProfile | null => {
      if (!cachedData) return null;
      // If cached data is a response object (old format), extract the data field
      if (cachedData && typeof cachedData === 'object' && 'success' in cachedData && 'data' in cachedData) {
        return cachedData.data;
      }
      // Otherwise, it's already the profile data (new format)
      return cachedData;
    };

    // PERFORMANCE: Check AsyncStorage first (instant, no API call)
    if (!forceRefresh) {
      // Check in-memory cache first (fastest) - validate user ID matches
      if (this.cache && this.cache.userId === userId && Date.now() - this.cache.timestamp < this.cacheTimeout) {
        // Extract profile data (handles both formats for backward compatibility)
        const profileData = extractProfileData(this.cache.data);
        // Validate cached data belongs to current user
        if (profileData && validateCachedData(profileData, userId)) {
          // ✅ CRITICAL: Return consistent response format
          return {
            success: true,
            data: profileData,
            message: 'Profile loaded from cache'
          };
        } else {
          // Invalid cache, clear it
          this.cache = null;
        }
      }

      // Check AsyncStorage (instant, no network)
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const storageKey = await getUserCacheKey(this.baseStorageKey, userId);
          const stored = await Storage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            // Extract profile data (handles both formats for backward compatibility)
            const profileData = extractProfileData(parsed.data);
            // Validate that cached data belongs to current user
            if (profileData && validateCachedData(profileData, userId) && Date.now() - parsed.timestamp < this.cacheTimeout) {
              // Restore to memory cache (normalize to new format - store just profile data)
              this.cache = { data: profileData, timestamp: parsed.timestamp, userId };
              // ✅ CRITICAL: Return consistent response format
              return {
                success: true,
                data: profileData,
                message: 'Profile loaded from storage'
              };
            }
          }
        }
      } catch (error) {
        // If AsyncStorage read fails, continue to API call
      }
    }

    // If already loading, return the pending call
    if (this.isLoading && this.pendingCall) {
      return this.pendingCall;
    }

    // Set loading state
    this.isLoading = true;
    
    // Create the API call (only if cache is empty or stale)
    this.pendingCall = this._getUserProfile();
    
    try {
      const result = await this.pendingCall;
      // Cache the successful result in both memory and AsyncStorage
      const userId = await getCurrentUserId();
      if (userId) {
        // ✅ CRITICAL: Validate user ID matches before saving (prevents data leakage)
        if (this.currentUserId && this.currentUserId !== userId) {
          console.error('❌ CRITICAL: User ID mismatch in profile service! Current:', this.currentUserId, 'Expected:', userId);
          console.error('❌ Aborting save to prevent data leakage. Reinitializing service...');
          // Reinitialize to load correct user's data
          this.cache = null;
          this.hasInitialized = false;
          await this.initializeCache();
          return result; // Return result but don't cache it
        }

        // Update tracked user ID if not set
        if (!this.currentUserId) {
          this.currentUserId = userId;
        }

        // ✅ CRITICAL: Store only the profile data (not the response object) for consistency
        // Extract profile data from response object if needed
        const profileData = (result && typeof result === 'object' && 'data' in result) ? result.data : result;
        
        const cacheEntry = { data: profileData, timestamp: Date.now(), userId };
        this.cache = cacheEntry;
        
        // Persist to AsyncStorage with user-specific key (non-blocking)
        const storageKey = await getUserCacheKey(this.baseStorageKey, userId);
        Storage.setItem(storageKey, JSON.stringify(cacheEntry)).catch(() => {
          // Ignore storage errors
        });
      }
      
      return result;
    } finally {
      this.isLoading = false;
      this.pendingCall = null;
    }
  }

  // Check if we have cached data without making API call
  async hasCachedData(): Promise<boolean> {
    await this.initializeCache();
    
    const userId = await getCurrentUserId();
    if (!userId) return false;
    
    // Check memory cache
    if (this.cache && this.cache.userId === userId && Date.now() - this.cache.timestamp < this.cacheTimeout) {
      if (validateCachedData(this.cache.data, userId)) {
        return true;
      }
    }
    
    // Check AsyncStorage
    try {
      const storageKey = await getUserCacheKey(this.baseStorageKey, userId);
      const stored = await Storage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (validateCachedData(parsed.data, userId) && Date.now() - parsed.timestamp < this.cacheTimeout) {
          // Restore to memory
          this.cache = { ...parsed, userId };
          return true;
        }
      }
    } catch (error) {
      // Ignore storage errors
    }
    
    return false;
  }

  // Get cached data without API call (synchronous check of memory only)
  async getCachedData(): Promise<{ success: boolean; data: UserProfile | null; message: string } | null> {
    // ✅ CRITICAL: Initialize cache first to ensure we load from storage if needed
    await this.initializeCache();
    
    const userId = await getCurrentUserId();
    if (!userId) {
      // No user ID, clear any cached data
      this.cache = null;
      return null;
    }
    
    // ✅ CRITICAL: Validate current user ID matches cached user ID
    if (this.currentUserId && this.currentUserId !== userId) {
      // User ID changed, reset and reload
      this.cache = null;
      this.hasInitialized = false;
      await this.initializeCache();
    }
    
    // Helper function to extract profile data from cache (handles both old and new formats)
    const extractProfileData = (cachedData: any): UserProfile | null => {
      if (!cachedData) return null;
      // If cached data is a response object (old format), extract the data field
      if (cachedData && typeof cachedData === 'object' && 'success' in cachedData && 'data' in cachedData) {
        return cachedData.data;
      }
      // Otherwise, it's already the profile data (new format)
      return cachedData;
    };
    
    // Check memory cache - must match current user ID
    if (this.cache && this.cache.userId === userId && Date.now() - this.cache.timestamp < this.cacheTimeout) {
      // Extract profile data (handles both formats)
      const profileData = extractProfileData(this.cache.data);
      // Validate cached data belongs to current user
      if (profileData && validateCachedData(profileData, userId)) {
        return {
          success: true,
          data: profileData,
          message: 'Profile loaded from cache'
        };
      } else {
        // Cached data doesn't belong to current user, clear it
        this.cache = null;
        return null;
      }
    } else if (this.cache && this.cache.userId !== userId) {
      // Cache belongs to different user, clear it
      this.cache = null;
      return null;
    }
    
    // Try loading from AsyncStorage
    try {
      const storageKey = await getUserCacheKey(this.baseStorageKey, userId);
      const stored = await Storage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Extract profile data (handles both formats)
        const profileData = extractProfileData(parsed.data);
        // Validate cached data belongs to current user
        if (profileData && validateCachedData(profileData, userId) && Date.now() - parsed.timestamp < this.cacheTimeout) {
          // Restore to memory cache (normalize to new format - store just profile data)
          this.cache = { data: profileData, timestamp: parsed.timestamp, userId };
          // Update tracked user ID
          if (!this.currentUserId) {
            this.currentUserId = userId;
          }
          return {
            success: true,
            data: profileData,
            message: 'Profile loaded from storage'
          };
        }
      }
    } catch (error) {
      // Ignore storage errors
    }
    
    return null;
  }

  // Private method for actual API call with retry logic
  private async _getUserProfile(retryCount = 0): Promise<{ success: boolean; data: UserProfile | null; message: string }> {
    try {
      const response = await api.get('/user-profile');
      
      // Check if response exists and has data
      if (response && response.success) {
        return response;
      } else {
        // Return a proper response object for new users without profiles
        return {
          success: true,
          data: null,
          message: 'No profile found for this user'
        };
      }
    } catch (error: any) {
      // Check if it's a rate limiting error and we can retry
      if (error.message && error.message.includes('Too many requests') && retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._getUserProfile(retryCount + 1);
      }
      
      // Check if it's a rate limiting error
      if (error.message && error.message.includes('Too many requests')) {
        // Return cached data if available, otherwise return error
        if (this.cache) {
          return this.cache.data;
        }
        return {
          success: false,
          data: null,
          message: 'Too many requests. Please wait a moment and try again.'
        };
      }
      
      // Check if it's a 404 (no profile found) or other error
      if (error.response?.status === 404) {
        // New user without profile - return success with null data
        return {
          success: true,
          data: null,
          message: 'No profile found for this user'
        };
      }
      
      // For other errors, return error response
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to get user profile'
      };
    }
  }

  // Create or update user profile
  async createOrUpdateProfile(userInfo: UserInfo | { age: number } & Omit<UserInfo, 'age'>): Promise<{ success: boolean; data: UserProfile | null; message: string }> {
    try {
      // Ensure age is a number for backend compatibility
      const processedUserInfo = {
        ...userInfo,
        age: typeof userInfo.age === 'string' ? parseInt(userInfo.age, 10) : userInfo.age
      };
      
      // Validate age
      if (isNaN(processedUserInfo.age) || processedUserInfo.age < 13 || processedUserInfo.age > 120) {
        return {
          success: false,
          data: null,
          message: 'Age must be between 13 and 120'
        };
      }
      
      const response = await api.post('/user-profile', processedUserInfo);
      
      if (response && response.success) {
        // Clear cache when profile is updated and cache new data
        await this.clearCache();
        const userId = await getCurrentUserId();
        if (userId) {
          // ✅ CRITICAL: Store only the profile data (not the response object) for consistency
          const profileData = (response && typeof response === 'object' && 'data' in response) ? response.data : response;
          const cacheEntry = { data: profileData, timestamp: Date.now(), userId };
          this.cache = cacheEntry;
          const storageKey = await getUserCacheKey(this.baseStorageKey, userId);
          Storage.setItem(storageKey, JSON.stringify(cacheEntry)).catch(() => {});
        }
        return response;
      } else {
        return {
          success: false,
          data: null,
          message: response?.message || 'Invalid response from server'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Failed to create/update user profile'
      };
    }
  }

  // Update specific profile field
  async updateProfileField(field: string, value: string): Promise<{ success: boolean; data: UserProfile | null; message: string }> {
    try {
      const response = await api.patch('/user-profile/field', { field, value });
      
      if (response && response.success) {
        return response;
      } else {
        return {
          success: false,
          data: null,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to update profile field'
      };
    }
  }

  // Delete user profile
  async deleteProfile(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete('/user-profile');
      
      if (response && response.success) {
        return response;
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete user profile'
      };
    }
  }

  // Check profile completion status
  async checkProfileCompletion(): Promise<{ success: boolean; data: ProfileCompletionStatus | null; message: string }> {
    try {
      const response = await api.get('/user-profile/completion');
      
      if (response && response.success) {
        return response;
      } else {
        return {
          success: false,
          data: null,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to check profile completion'
      };
    }
  }

  // Get user badges
  async getUserBadges(): Promise<{ success: boolean; data: { badges: string[]; hasProfileCompletionBadge: boolean } | null; message: string }> {
    try {
      const response = await api.get('/user-profile/badges');
      
      if (response && response.success) {
        return response;
      } else {
        return {
          success: false,
          data: null,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to get user badges'
      };
    }
  }


}

export default new UserProfileService();
