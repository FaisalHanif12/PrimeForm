import AsyncStorage from '@react-native-async-storage/async-storage';

class Storage {
  // Get item from storage
  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  // Set item in storage
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  }

  // Remove item from storage
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  }

  // Clear all storage
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Get multiple items
  static async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    try {
      const values = await AsyncStorage.multiGet(keys);
      const result: Record<string, string | null> = {};
      values.forEach(([key, value]) => {
        result[key] = value;
      });
      return result;
    } catch (error) {
      console.error('Error getting multiple items from storage:', error);
      return {};
    }
  }

  // Set multiple items
  static async setMultiple(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
    } catch (error) {
      console.error('Error setting multiple items in storage:', error);
    }
  }
}

export default Storage;
