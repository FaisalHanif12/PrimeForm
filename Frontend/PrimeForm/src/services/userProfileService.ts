import { api } from '../config/api';
import Storage from '../utils/storage';

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
  private cache: { data: any; timestamp: number } | null = null;
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes cache - profile rarely changes
  private isLoading = false;
  private pendingCall: Promise<any> | null = null;
  private hasInitialized = false;
  private storageKey = 'cached_user_profile';

  // Initialize: Load from AsyncStorage on service creation
  private async initializeCache() {
    if (this.hasInitialized) return;
    
    try {
      const stored = await Storage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if cache is still valid
        if (Date.now() - parsed.timestamp < this.cacheTimeout) {
          this.cache = parsed;
        }
      }
      this.hasInitialized = true;
    } catch (error) {
      // Ignore storage errors on initialization
      this.hasInitialized = true;
    }
  }

  // Clear cache when user changes (called from auth service)
  async clearCache() {
    this.cache = null;
    try {
      await Storage.removeItem(this.storageKey);
    } catch (error) {
      // Ignore storage errors
    }
  }

  // Get user profile with caching and debouncing
  async getUserProfile(forceRefresh = false): Promise<{ success: boolean; data: UserProfile | null; message: string }> {
    // Initialize cache from AsyncStorage if not already done
    await this.initializeCache();

    // PERFORMANCE: Check AsyncStorage first (instant, no API call)
    if (!forceRefresh) {
      // Check in-memory cache first (fastest)
      if (this.cache && Date.now() - this.cache.timestamp < this.cacheTimeout) {
        return this.cache.data;
      }

      // Check AsyncStorage (instant, no network)
      try {
        const stored = await Storage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Check if cache is still valid
          if (Date.now() - parsed.timestamp < this.cacheTimeout) {
            // Restore to memory cache
            this.cache = parsed;
            return parsed.data;
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
      const cacheEntry = { data: result, timestamp: Date.now() };
      this.cache = cacheEntry;
      
      // Persist to AsyncStorage (non-blocking)
      Storage.setItem(this.storageKey, JSON.stringify(cacheEntry)).catch(() => {
        // Ignore storage errors
      });
      
      return result;
    } finally {
      this.isLoading = false;
      this.pendingCall = null;
    }
  }

  // Check if we have cached data without making API call
  async hasCachedData(): Promise<boolean> {
    await this.initializeCache();
    
    // Check memory cache
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTimeout) {
      return true;
    }
    
    // Check AsyncStorage
    try {
      const stored = await Storage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < this.cacheTimeout) {
          // Restore to memory
          this.cache = parsed;
          return true;
        }
      }
    } catch (error) {
      // Ignore storage errors
    }
    
    return false;
  }

  // Get cached data without API call (synchronous check of memory only)
  getCachedData(): { success: boolean; data: UserProfile | null; message: string } | null {
    if (this.cache && Date.now() - this.cache.timestamp < this.cacheTimeout) {
      return this.cache.data;
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
        const cacheEntry = { data: response, timestamp: Date.now() };
        this.cache = cacheEntry;
        Storage.setItem(this.storageKey, JSON.stringify(cacheEntry)).catch(() => {});
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
