import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

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

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        console.log('API Error Response:', data);
        // Return the error data instead of throwing
        return data;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Store auth token
  private async storeToken(token: string): Promise<void> {
    await AsyncStorage.setItem('authToken', token);
  }

  // Get stored token
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }

  // Clear auth token
  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
  }

  // Clear all user-related data
  async clearAllUserData(): Promise<void> {
    try {
      // Clear auth token
      await this.clearToken();
      
      // Clear any cached user profile data
      await AsyncStorage.removeItem('userProfileData');
      await AsyncStorage.removeItem('userProfileImage'); // Clear profile image
      await AsyncStorage.removeItem('primeform_user_info_completed');
      await AsyncStorage.removeItem('primeform_user_info_cancelled');
      await AsyncStorage.removeItem('primeform_permission_modal_seen');
      
      // Clear any other user-specific data
      const keys = await AsyncStorage.getAllKeys();
      const userDataKeys = keys.filter(key => 
        key.includes('user') || 
        key.includes('profile') || 
        key.includes('primeform') ||
        key.includes('image') ||
        key.includes('avatar') ||
        key.includes('photo')
      );
      
      if (userDataKeys.length > 0) {
        await AsyncStorage.multiRemove(userDataKeys);
        console.log('Cleared user data keys:', userDataKeys);
      }
      
      // Clear user profile service cache
      try {
        const { default: userProfileService } = await import('./userProfileService');
        userProfileService.clearCache();
        console.log('✅ User profile service cache cleared');
      } catch (error) {
        console.log('User profile service not available for cache clearing');
      }
      
      console.log('✅ All user data cleared successfully');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Login method
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.apiCall('/auth/login', 'POST', {
        email,
        password,
      });

      console.log('Login API Response:', response);

      if (response.success && response.token) {
        // Clear any existing user data before storing new token
        await this.clearAllUserData();
        
        // Store new token
        await this.storeToken(response.token);
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
      console.error('Login service error:', error);
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
        // Clear any existing user data before storing new token
        await this.clearAllUserData();
        await this.storeToken(response.token);
        
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
      
      const result = await notificationService.sendWelcomeNotification(userEmail);
      if (result.success) {
        console.log('✅ Welcome notification sent for new user:', userEmail);
      } else {
        console.log('❌ Failed to send welcome notification:', result.error);
      }
    } catch (error) {
      console.error('Error sending welcome notification:', error);
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
      console.warn('Logout API call failed:', error);
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


