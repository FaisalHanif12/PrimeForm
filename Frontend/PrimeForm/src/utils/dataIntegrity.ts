import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserId, getUserCacheKey, validateCachedData } from './cacheKeys';

/**
 * ✅ CRITICAL: Account-specific data integrity wrapper
 * Ensures all data operations are validated and account-specific
 */

interface DataIntegrityOptions {
  userId?: string | null;
  validateOnRead?: boolean;
  validateOnWrite?: boolean;
  preserveOnError?: boolean;
}

/**
 * Safely get item from AsyncStorage with account-specific validation
 * @param baseKey - Base cache key (will be prefixed with user ID)
 * @param options - Data integrity options
 * @returns Parsed data or null
 */
export async function getAccountSpecificData<T = any>(
  baseKey: string,
  options: DataIntegrityOptions = {}
): Promise<T | null> {
  try {
    const { userId, validateOnRead = true } = options;
    
    // Get current user ID
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId || currentUserId.startsWith('device_') || currentUserId.startsWith('temp_')) {
      // No valid user ID, return null
      return null;
    }

    // Get user-specific cache key
    const userCacheKey = await getUserCacheKey(baseKey, currentUserId);
    
    // Get data from storage
    const data = await AsyncStorage.getItem(userCacheKey);
    if (!data) {
      return null;
    }

    // Parse data
    const parsed = JSON.parse(data);

    // ✅ CRITICAL: Validate data belongs to current user
    if (validateOnRead && !validateCachedData(parsed, currentUserId)) {
      console.warn(`⚠️ Data integrity violation: ${baseKey} does not belong to user ${currentUserId}`);
      // Remove invalid data
      await AsyncStorage.removeItem(userCacheKey);
      return null;
    }

    // Ensure userId is set in data for future validation
    if (parsed && typeof parsed === 'object' && !('userId' in parsed)) {
      parsed.userId = currentUserId;
      // Update storage with userId field
      await AsyncStorage.setItem(userCacheKey, JSON.stringify(parsed));
    }

    return parsed as T;
  } catch (error) {
    console.error(`❌ Error getting account-specific data for ${baseKey}:`, error);
    return null;
  }
}

/**
 * Safely set item in AsyncStorage with account-specific validation
 * @param baseKey - Base cache key (will be prefixed with user ID)
 * @param data - Data to store
 * @param options - Data integrity options
 * @returns true if successful, false otherwise
 */
export async function setAccountSpecificData<T = any>(
  baseKey: string,
  data: T,
  options: DataIntegrityOptions = {}
): Promise<boolean> {
  try {
    const { userId, validateOnWrite = true, preserveOnError = true } = options;
    
    // Get current user ID
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId || currentUserId.startsWith('device_') || currentUserId.startsWith('temp_')) {
      // No valid user ID, cannot store data
      console.warn(`⚠️ Cannot store ${baseKey}: No valid user ID`);
      return false;
    }

    // ✅ CRITICAL: Ensure data has userId field for validation
    const dataToStore = data && typeof data === 'object' 
      ? { ...data as any, userId: currentUserId }
      : data;

    // Validate data before storing
    if (validateOnWrite && dataToStore && typeof dataToStore === 'object') {
      if (!validateCachedData(dataToStore, currentUserId)) {
        console.warn(`⚠️ Data integrity violation: Cannot store ${baseKey} for user ${currentUserId}`);
        return false;
      }
    }

    // Get user-specific cache key
    const userCacheKey = await getUserCacheKey(baseKey, currentUserId);
    
    // Store data
    await AsyncStorage.setItem(userCacheKey, JSON.stringify(dataToStore));
    
    return true;
  } catch (error) {
    console.error(`❌ Error setting account-specific data for ${baseKey}:`, error);
    if (options.preserveOnError) {
      // Try to preserve existing data on error
      try {
        const existing = await getAccountSpecificData(baseKey, { userId: options.userId, validateOnRead: false });
        if (existing) {
          console.log(`✅ Preserved existing data for ${baseKey} after error`);
        }
      } catch (preserveError) {
        // Ignore preserve errors
      }
    }
    return false;
  }
}

/**
 * Safely remove account-specific data
 * @param baseKey - Base cache key (will be prefixed with user ID)
 * @param options - Data integrity options
 * @returns true if successful, false otherwise
 */
export async function removeAccountSpecificData(
  baseKey: string,
  options: DataIntegrityOptions = {}
): Promise<boolean> {
  try {
    const { userId } = options;
    
    // Get current user ID
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId) {
      return false;
    }

    // Get user-specific cache key
    const userCacheKey = await getUserCacheKey(baseKey, currentUserId);
    
    // Remove data
    await AsyncStorage.removeItem(userCacheKey);
    
    return true;
  } catch (error) {
    console.error(`❌ Error removing account-specific data for ${baseKey}:`, error);
    return false;
  }
}

/**
 * Validate all account-specific data for current user
 * Removes any data that doesn't belong to current user
 * @param userId - User ID (optional, will use current user if not provided)
 * @returns Number of invalid entries removed
 */
export async function validateAllAccountData(userId?: string | null): Promise<number> {
  try {
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId || currentUserId.startsWith('device_') || currentUserId.startsWith('temp_')) {
      return 0;
    }

    const allKeys = await AsyncStorage.getAllKeys();
    const userPrefix = `user_${currentUserId}_`;
    let removedCount = 0;

    // Check all keys that start with user prefix
    for (const key of allKeys) {
      if (key.startsWith(userPrefix)) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              // Validate data belongs to current user
              if (!validateCachedData(parsed, currentUserId)) {
                // Data doesn't belong to user, remove it
                await AsyncStorage.removeItem(key);
                removedCount++;
                console.warn(`⚠️ Removed invalid data: ${key}`);
              } else if (parsed && typeof parsed === 'object' && !('userId' in parsed)) {
                // Add userId field for future validation
                parsed.userId = currentUserId;
                await AsyncStorage.setItem(key, JSON.stringify(parsed));
              }
            } catch {
              // Not JSON or invalid, skip
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error validating key ${key}:`, error);
        }
      }
    }

    if (removedCount > 0) {
      console.log(`✅ Validated account data: Removed ${removedCount} invalid entries`);
    }

    return removedCount;
  } catch (error) {
    console.error('❌ Error validating all account data:', error);
    return 0;
  }
}

/**
 * Get all account-specific keys for current user
 * @param userId - User ID (optional, will use current user if not provided)
 * @returns Array of cache keys belonging to user
 */
export async function getAllAccountKeys(userId?: string | null): Promise<string[]> {
  try {
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId || currentUserId.startsWith('device_') || currentUserId.startsWith('temp_')) {
      return [];
    }

    const allKeys = await AsyncStorage.getAllKeys();
    const userPrefix = `user_${currentUserId}_`;
    
    return allKeys.filter(key => key.startsWith(userPrefix));
  } catch (error) {
    console.error('❌ Error getting all account keys:', error);
    return [];
  }
}

/**
 * Backup account-specific data (for recovery after errors)
 * @param userId - User ID (optional, will use current user if not provided)
 * @returns Backup data object
 */
export async function backupAccountData(userId?: string | null): Promise<{ [key: string]: any }> {
  try {
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId || currentUserId.startsWith('device_') || currentUserId.startsWith('temp_')) {
      return {};
    }

    const accountKeys = await getAllAccountKeys(currentUserId);
    const backup: { [key: string]: any } = {};

    for (const key of accountKeys) {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          backup[key] = JSON.parse(data);
        }
      } catch (error) {
        console.warn(`⚠️ Error backing up key ${key}:`, error);
      }
    }

    return backup;
  } catch (error) {
    console.error('❌ Error backing up account data:', error);
    return {};
  }
}

/**
 * Restore account-specific data from backup
 * @param backup - Backup data object
 * @param userId - User ID (optional, will use current user if not provided)
 * @returns Number of keys restored
 */
export async function restoreAccountData(
  backup: { [key: string]: any },
  userId?: string | null
): Promise<number> {
  try {
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId || currentUserId.startsWith('device_') || currentUserId.startsWith('temp_')) {
      return 0;
    }

    let restoredCount = 0;

    for (const [key, data] of Object.entries(backup)) {
      try {
        // Validate key belongs to user
        if (key.startsWith(`user_${currentUserId}_`)) {
          // Ensure userId is set in data
          const dataToStore = data && typeof data === 'object'
            ? { ...data, userId: currentUserId }
            : data;
          
          await AsyncStorage.setItem(key, JSON.stringify(dataToStore));
          restoredCount++;
        }
      } catch (error) {
        console.warn(`⚠️ Error restoring key ${key}:`, error);
      }
    }

    if (restoredCount > 0) {
      console.log(`✅ Restored ${restoredCount} account data entries`);
    }

    return restoredCount;
  } catch (error) {
    console.error('❌ Error restoring account data:', error);
    return 0;
  }
}

