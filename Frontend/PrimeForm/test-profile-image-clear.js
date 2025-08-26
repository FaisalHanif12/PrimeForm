// Test script to clear profile image and test data isolation
// Run this in your React Native app to test the fix

import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to clear all user data including profile image
export const clearAllUserData = async () => {
  try {
    console.log('🧹 Starting user data cleanup...');
    
    // Clear specific keys
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userProfileData');
    await AsyncStorage.removeItem('userProfileImage'); // This is the key causing the issue!
    await AsyncStorage.removeItem('primeform_user_info_completed');
    await AsyncStorage.removeItem('primeform_user_info_cancelled');
    await AsyncStorage.removeItem('primeform_permission_modal_seen');
    
    // Get all keys and clear any user-related ones
    const keys = await AsyncStorage.getAllKeys();
    console.log('🔍 Current AsyncStorage keys:', keys);
    
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
      console.log('✅ Cleared user data keys:', userDataKeys);
    }
    
    console.log('✅ All user data cleared successfully!');
    
    // Verify cleanup
    const remainingKeys = await AsyncStorage.getAllKeys();
    console.log('🔍 Remaining keys after cleanup:', remainingKeys);
    
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
};

// Function to check what's currently stored
export const checkStorageContents = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('🔍 Current AsyncStorage contents:');
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`  ${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
    }
  } catch (error) {
    console.error('❌ Error checking storage:', error);
  }
};

// Usage instructions:
// 1. Import these functions in your component
// 2. Call clearAllUserData() when logging out or switching accounts
// 3. Call checkStorageContents() to verify cleanup
// 4. Test by creating two different accounts and verifying no data leaks

