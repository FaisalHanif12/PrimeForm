import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { extractUserIdFromToken, setCurrentUserId, clearCurrentUserId, clearUserCache, validateCacheOnLogin, cleanupOrphanedCache, getCurrentUserId } from '../utils/cacheKeys';

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    user: any;
  };
  showSignupButton?: boolean;
}

interface SignupResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    user: any;
  };
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

interface DashboardResponse {
  success: boolean;
  message: string;
  data: any;
}

class AuthService {
  // Helper method for API calls
  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    try {
      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Add authorization header if token exists
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      }

      // Add body for POST/PUT requests
      if (body && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(body);
      }

      const controller = new AbortController();
      const timeoutMs = 10000; // 10s timeout so UI doesn't hang on bad network
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // ✅ CRITICAL: Handle 401 Unauthorized (expired/invalid token)
        if (response.status === 401) {
          // Clear token immediately when we get 401
          await this.clearToken();
          // Return error with a flag to indicate token expired
          return {
            ...data,
            tokenExpired: true,
            statusCode: 401
          };
        }
        
        // Return the error data instead of throwing
        return data;
      }

      return data;
    } catch (error) {
      // Normalize network / timeout errors to a friendly message
      if ((error as any)?.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      }

      if (error instanceof Error) {
        // React Native fetch usually throws TypeError('Network request failed') on connectivity issues
        if (error.message === 'Network request failed') {
          throw new Error('Unable to reach the server. Please check your internet connection and try again.');
        }

        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Store auth token and extract user ID
  private async storeToken(token: string): Promise<void> {
    await AsyncStorage.setItem('authToken', token);
    
    // Extract and store user ID from token for cache key management
    const userId = extractUserIdFromToken(token);
    if (userId) {
      await setCurrentUserId(userId);
    }
  }

  // Get stored token
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  // Clear auth token and user ID
  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await clearCurrentUserId();
  }

  // Clear all user-related data
  async clearAllUserData(): Promise<void> {
    try {
      // Get current user ID before clearing token
      const currentUserId = await AsyncStorage.getItem('current_user_id');

      // Clear all user-specific cache using the utility
      if (currentUserId) {
        await clearUserCache(currentUserId);
      }

      // Clear auth token and user ID (this must happen after clearing cache)
      await this.clearToken();

      // Clear any cached user profile data (legacy keys)
      await AsyncStorage.removeItem('userProfileData');
      await AsyncStorage.removeItem('userProfileImage'); // Clear profile image
      await AsyncStorage.removeItem('primeform_user_info_completed');
      await AsyncStorage.removeItem('primeform_user_info_cancelled');
      await AsyncStorage.removeItem('primeform_permission_modal_seen');
      
      // ✅ CRITICAL: DO NOT clear 'primeform_has_ever_signed_up' - this is a permanent record
      // that ensures users who have signed up never see guest mode again on this device.
      // This flag should ONLY be set when user signs up and NEVER cleared, even on logout.
      // Only clear session-specific flags like 'primeform_signup_completed'
      await AsyncStorage.removeItem('primeform_signup_completed');

      // ✅ CRITICAL: Reset user profile service in-memory state only (preserve cached profile)
      // Profile cache should persist across logout/login for faster loading
      try {
        const { default: userProfileService } = await import('./userProfileService');
        userProfileService.resetInMemoryState();
      } catch (error) {
        // Ignore if service not available
      }

      // Clear AI services cache (both in-memory and persistent)
      try {
        const { default: aiDietService } = await import('./aiDietService');
        aiDietService.clearInMemoryCache(); // Clear in-memory cache first
        await aiDietService.clearDietPlanFromDatabase(); // Then clear persistent cache
      } catch (error) {
        // Ignore if service not available
      }

      try {
        const { default: aiWorkoutService } = await import('./aiWorkoutService');
        aiWorkoutService.clearInMemoryCache(); // Clear in-memory cache first
        await aiWorkoutService.clearWorkoutPlanFromDatabase(); // Then clear persistent cache
      } catch (error) {
        // Ignore if service not available
      }

      // ✅ CRITICAL: Clear progress service cache (user-specific)
      try {
        const { default: progressService } = await import('./progressService');
        const currentUserId = await AsyncStorage.getItem('current_user_id');
        if (currentUserId) {
          await progressService.clearUserCaches(currentUserId);
        } else {
          progressService.invalidateCaches(); // Clear all if no user ID
        }
      } catch (error) {
        // Ignore if service not available
      }

      // ✅ CRITICAL: DO NOT clear completion data from storage during logout
      // Completion data (meals, exercises, water intake) is user-specific and should persist
      // across logout/login cycles. Only reset in-memory state, storage is preserved.
      // The completion services will reload the correct user's data on next login via reinitialize()
      try {
        const { default: mealCompletionService } = await import('./mealCompletionService');
        // Only reset in-memory state, DO NOT clear storage
        mealCompletionService.resetInMemoryState();
      } catch (error) {
        // Ignore if service not available
      }

      try {
        const { default: exerciseCompletionService } = await import('./exerciseCompletionService');
        // Only reset in-memory state, DO NOT clear storage
        exerciseCompletionService.resetInMemoryState();
      } catch (error) {
        // Ignore if service not available
      }

    } catch (error) {
      // Error clearing user data - silently fail
    }
  }

  // Login method
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.apiCall('/auth/login', 'POST', {
        email,
        password,
      });

      if (response.success && response.token) {
        // Extract user ID from token first (before clearing)
        const newUserId = extractUserIdFromToken(response.token);
        
        // Clear any existing user data before storing new token
        await this.clearAllUserData();
        
        // Clean up any orphaned cache from other users
        if (newUserId) {
          await cleanupOrphanedCache(newUserId);
        }

        // Store new token and extract user ID
        await this.storeToken(response.token);
        
        // ✅ CRITICAL: Verify user ID is set before initializing services
        // Add small delay to ensure AsyncStorage write completes
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Double-check user ID is set
        const verifyUserId = await getCurrentUserId();
        if (!verifyUserId && newUserId) {
          // Retry setting user ID if it wasn't set
          await setCurrentUserId(newUserId);
        }
        
        // Validate and clean cache for the new user
        if (newUserId) {
          await validateCacheOnLogin(newUserId);
          
          // ✅ CRITICAL: Reinitialize completion services with guaranteed initialization
          // Ensure services are fully initialized before proceeding
          try {
            const { default: mealCompletionService } = await import('./mealCompletionService');
            await mealCompletionService.reinitialize();
            // ✅ CRITICAL: Verify initialization succeeded by checking if data loaded
            const mealData = mealCompletionService.getCompletionData();
            console.log('✅ Meal completion service initialized with', mealData.completedMeals.length, 'meals');
          } catch (error) {
            console.error('❌ Error initializing meal completion service:', error);
            // Retry initialization once
            try {
              const { default: mealCompletionService } = await import('./mealCompletionService');
              await mealCompletionService.initialize();
            } catch (retryError) {
              console.error('❌ Retry failed for meal completion service:', retryError);
            }
          }

          try {
            const { default: exerciseCompletionService } = await import('./exerciseCompletionService');
            await exerciseCompletionService.reinitialize();
            // ✅ CRITICAL: Verify initialization succeeded by checking if data loaded
            const exerciseData = exerciseCompletionService.getCompletionData();
            console.log('✅ Exercise completion service initialized with', exerciseData.completedExercises.length, 'exercises');
          } catch (error) {
            console.error('❌ Error initializing exercise completion service:', error);
            // Retry initialization once
            try {
              const { default: exerciseCompletionService } = await import('./exerciseCompletionService');
              await exerciseCompletionService.initialize();
            } catch (retryError) {
              console.error('❌ Retry failed for exercise completion service:', retryError);
            }
          }

          // ✅ CRITICAL: Reinitialize user profile service to load correct user's cached profile
          try {
            const { default: userProfileService } = await import('./userProfileService');
            // Reset in-memory state and reload from storage for new user
            userProfileService.resetInMemoryState();
            // Force reinitialize cache to load new user's profile (non-blocking)
            userProfileService.getUserProfile(false).catch(() => {
              // Ignore errors - profile will load when needed
            });
          } catch (error) {
            // Ignore if service not available
          }
        }
        
        return response;
      }

      // Handle error cases
      if (response.showSignupButton || (response.message && response.message.includes('Account not found'))) {
        return {
          success: false,
          message: response.message || 'Account not found',
          showSignupButton: true,
        };
      }

      return {
        success: false,
        message: response.message || 'Login failed. Please try again.',
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Signup method
  async signup(payload: { fullName: string; email: string; password: string }): Promise<SignupResponse> {
    try {
      const response = await this.apiCall('/auth/signup', 'POST', payload);

      if (response.success && response.token) {
        // Extract user ID from token first (before clearing)
        const newUserId = extractUserIdFromToken(response.token);
        
        // Clear any existing user data before storing new token
        await this.clearAllUserData();
        
        // Clean up any orphaned cache from other users
        if (newUserId) {
          await cleanupOrphanedCache(newUserId);
        }
        
        // Store new token and extract user ID
        await this.storeToken(response.token);
        
        // ✅ CRITICAL: Verify user ID is set before initializing services
        // Add small delay to ensure AsyncStorage write completes
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Double-check user ID is set
        const verifyUserId = await getCurrentUserId();
        if (!verifyUserId && newUserId) {
          // Retry setting user ID if it wasn't set
          await setCurrentUserId(newUserId);
        }
        
        // Validate and clean cache for the new user
        if (newUserId) {
          await validateCacheOnLogin(newUserId);
          
          // ✅ CRITICAL: Reinitialize completion services with guaranteed initialization
          // Ensure services are fully initialized before proceeding
          try {
            const { default: mealCompletionService } = await import('./mealCompletionService');
            await mealCompletionService.reinitialize();
            // ✅ CRITICAL: Verify initialization succeeded by checking if data loaded
            const mealData = mealCompletionService.getCompletionData();
            console.log('✅ Meal completion service initialized with', mealData.completedMeals.length, 'meals');
          } catch (error) {
            console.error('❌ Error initializing meal completion service:', error);
            // Retry initialization once
            try {
              const { default: mealCompletionService } = await import('./mealCompletionService');
              await mealCompletionService.initialize();
            } catch (retryError) {
              console.error('❌ Retry failed for meal completion service:', retryError);
            }
          }

          try {
            const { default: exerciseCompletionService } = await import('./exerciseCompletionService');
            await exerciseCompletionService.reinitialize();
            // ✅ CRITICAL: Verify initialization succeeded by checking if data loaded
            const exerciseData = exerciseCompletionService.getCompletionData();
            console.log('✅ Exercise completion service initialized with', exerciseData.completedExercises.length, 'exercises');
          } catch (error) {
            console.error('❌ Error initializing exercise completion service:', error);
            // Retry initialization once
            try {
              const { default: exerciseCompletionService } = await import('./exerciseCompletionService');
              await exerciseCompletionService.initialize();
            } catch (retryError) {
              console.error('❌ Retry failed for exercise completion service:', retryError);
            }
          }
        }

        // Check if this is the first time this user has signed up
        const hasSignedUpBefore = await AsyncStorage.getItem(`user_${payload.email}_has_signed_up`);

        if (!hasSignedUpBefore) {
          // This is the first time this user has signed up
          // Send welcome notification for new user
          await this.sendWelcomeNotification(payload.email);

          // Mark that this user has received their welcome notification
          await AsyncStorage.setItem(`user_${payload.email}_welcome_sent`, 'true');

          // Mark that this user has signed up before
          await AsyncStorage.setItem(`user_${payload.email}_has_signed_up`, 'true');

          // Mark that user has ever signed up (for app-wide tracking)
          await AsyncStorage.setItem('primeform_has_ever_signed_up', 'true');
        }
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: false,
        message: 'Signup failed. Please try again.',
      };
    }
  }

  // Send welcome notification for new user
  private async sendWelcomeNotification(userEmail: string): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependencies
      const { default: notificationService } = await import('./notificationService');

      await notificationService.sendWelcomeNotification(userEmail);
    } catch (error) {
      // Don't fail signup if notification fails
    }
  }

  // Forgot password method
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    try {
      const response = await this.apiCall('/auth/forgot-password', 'POST', {
        email,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: false,
        message: 'Failed to send reset email. Please try again.',
      };
    }
  }

  // Verify OTP for password reset
  async verifyResetOTP(email: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      const response = await this.apiCall('/auth/verify-reset-otp', 'POST', {
        email,
        otp,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: false,
        message: 'OTP verification failed. Please try again.',
      };
    }
  }

  // Reset password method
  async resetPassword(email: string, otp: string, newPassword: string): Promise<ResetPasswordResponse> {
    try {
      const response = await this.apiCall('/auth/reset-password', 'POST', {
        email,
        otp,
        newPassword,
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }
      return {
        success: false,
        message: 'Password reset failed. Please try again.',
      };
    }
  }

  // Get user profile
  async getProfile(): Promise<any> {
    try {
      const response = await this.apiCall('/auth/me');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get dashboard data
  async getDashboard(): Promise<DashboardResponse> {
    try {
      const response = await this.apiCall('/dashboard');
      return response;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
      return {
        success: false,
        message: 'Failed to load dashboard. Please try again.',
        data: null,
      };
    }
  }

  // Logout method
  async logout(): Promise<void> {
    try {
      await this.apiCall('/auth/logout', 'POST');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      await this.clearAllUserData();
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const authService = new AuthService();


