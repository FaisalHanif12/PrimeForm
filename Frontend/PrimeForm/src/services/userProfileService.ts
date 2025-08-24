import { api } from '../config/api';

export interface UserInfo {
  country: string;
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
  goalWeight: string;
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
  goalWeight: string;
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
      return response.data;
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to get user profile');
    }
  }

  // Create or update user profile
  async createOrUpdateProfile(userInfo: UserInfo): Promise<{ success: boolean; data: UserProfile; message: string }> {
    try {
      const response = await api.post('/user-profile', userInfo);
      return response.data;
    } catch (error: any) {
      console.error('Error creating/updating user profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to create/update user profile');
    }
  }

  // Update specific profile field
  async updateProfileField(field: string, value: string): Promise<{ success: boolean; data: UserProfile; message: string }> {
    try {
      const response = await api.patch('/user-profile/field', { field, value });
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile field:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile field');
    }
  }

  // Delete user profile
  async deleteProfile(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete('/user-profile');
      return response.data;
    } catch (error: any) {
      console.error('Error deleting user profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user profile');
    }
  }

  // Check profile completion status
  async checkProfileCompletion(): Promise<{ success: boolean; data: ProfileCompletionStatus; message: string }> {
    try {
      const response = await api.get('/user-profile/completion');
      return response.data;
    } catch (error: any) {
      console.error('Error checking profile completion:', error);
      throw new Error(error.response?.data?.message || 'Failed to check profile completion');
    }
  }
}

export default new UserProfileService();
