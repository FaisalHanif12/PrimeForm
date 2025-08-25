import { api } from '../config/api';

export interface UserInfo {
  country: string;
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
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
  bodyGoal: string;
  medicalConditions: string;
  occupationType: string;
  availableEquipment: string;
  dietPreference: string;
  isProfileComplete: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  profile?: UserProfile;
}

class UserProfileService {
  // Get user profile
  async getUserProfile(): Promise<{ success: boolean; data: UserProfile | null; message: string }> {
    try {
      const response = await api.get('/user-profile');
      
      // Check if response exists and has data
      if (response && response.data) {
        return response.data;
      } else {
        // Return a proper response object for new users without profiles
        return {
          success: true,
          data: null,
          message: 'No profile found for this user'
        };
      }
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      
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
      
      const response = await api.post('/user-profile', processedUserInfo);
      
      if (response && response.data) {
        return response.data;
      } else {
        return {
          success: false,
          data: null,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      console.error('Error creating/updating user profile:', error);
      
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to create/update user profile'
      };
    }
  }

  // Update specific profile field
  async updateProfileField(field: string, value: string): Promise<{ success: boolean; data: UserProfile | null; message: string }> {
    try {
      const response = await api.patch('/user-profile/field', { field, value });
      
      if (response && response.data) {
        return response.data;
      } else {
        return {
          success: false,
          data: null,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      console.error('Error updating profile field:', error);
      
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
      
      if (response && response.data) {
        return response.data;
      } else {
        return {
          success: false,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      console.error('Error deleting user profile:', error);
      
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
      
      if (response && response.data) {
        return response.data;
      } else {
        return {
          success: false,
          data: null,
          message: 'Invalid response from server'
        };
      }
    } catch (error: any) {
      console.error('Error checking profile completion:', error);
      
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to check profile completion'
      };
    }
  }
}

export default new UserProfileService();
