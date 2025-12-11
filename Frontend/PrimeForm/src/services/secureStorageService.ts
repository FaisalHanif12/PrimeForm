import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Secure Storage Service
 * 
 * Intelligently stores data based on sensitivity:
 * - SENSITIVE data → SecureStore (encrypted, hardware-backed)
 * - NON-SENSITIVE data → AsyncStorage (faster, larger capacity)
 */

// Keys that should be stored securely (encrypted)
const SENSITIVE_KEYS = [
  'auth_token',
  'refresh_token',
  'user_password',
  'user_email',
  'user_phone',
  'payment_info',
  'user_health_data',
];

// Keys that can use AsyncStorage (not encrypted)
const NON_SENSITIVE_KEYS = [
  'cached_diet_plan',
  'cached_workout_plan',
  'completed_meals',
  'completed_exercises',
  'water_intake',
  'water_completed',
  'ui_preferences',
  'language',
  'theme',
  'onboarding_completed',
  'ai_generation_history',
];

class SecureStorageService {
  /**
   * Check if a key should be stored securely
   */
  private isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS.some(sensitiveKey => 
      key.includes(sensitiveKey) || key.startsWith('secure_')
    );
  }

  /**
   * Store data securely or in AsyncStorage based on sensitivity
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isSensitiveKey(key)) {
        // Use SecureStore for sensitive data
        await SecureStore.setItemAsync(key, value);
      } else {
        // Use AsyncStorage for non-sensitive data
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from secure storage or AsyncStorage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isSensitiveKey(key)) {
        // Retrieve from SecureStore
        return await SecureStore.getItemAsync(key);
      } else {
        // Retrieve from AsyncStorage
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (this.isSensitiveKey(key)) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      throw error;
    }
  }

  /**
   * Store object as JSON (automatically determines storage type)
   */
  async setObject(key: string, value: any): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.setItem(key, jsonValue);
  }

  /**
   * Retrieve object from JSON
   */
  async getObject<T = any>(key: string): Promise<T | null> {
    const jsonValue = await this.getItem(key);
    if (!jsonValue) return null;
    
    try {
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error(`Failed to parse JSON for ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear all data (DANGEROUS - use with caution)
   */
  async clearAll(): Promise<void> {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();
      
      // Clear sensitive keys from SecureStore
      for (const key of SENSITIVE_KEYS) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          // Key might not exist, ignore
        }
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  /**
   * Migrate existing AsyncStorage data to SecureStore for sensitive keys
   * Run this once during app upgrade
   */
  async migrateToSecureStore(): Promise<void> {
    try {
      for (const sensitiveKey of SENSITIVE_KEYS) {
        // Check if data exists in AsyncStorage
        const existingValue = await AsyncStorage.getItem(sensitiveKey);
        
        if (existingValue) {
          // Move to SecureStore
          await SecureStore.setItemAsync(sensitiveKey, existingValue);
          
          // Remove from AsyncStorage
          await AsyncStorage.removeItem(sensitiveKey);
          
          console.log(`Migrated ${sensitiveKey} to SecureStore`);
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
      // Don't throw - migration is best-effort
    }
  }

  /**
   * Check if SecureStore is available on this device
   */
  async isSecureStoreAvailable(): Promise<boolean> {
    try {
      await SecureStore.setItemAsync('test_key', 'test_value');
      await SecureStore.deleteItemAsync('test_key');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new SecureStorageService();
