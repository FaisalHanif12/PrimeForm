import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

const CURRENT_USER_ID_KEY = 'current_user_id';
const DEVICE_ID_KEY = 'primeform_device_id';
const HAS_EVER_SIGNED_UP_KEY = 'primeform_has_ever_signed_up';

/**
 * Get installation ID (persists across app reinstalls)
 * This is used to create persistent keys that survive app deletion
 * 
 * Note: getInstallationIdAsync may not be available in all versions of expo-application.
 * If unavailable, the function returns null and the app will use a fallback device ID.
 */
async function getInstallationId(): Promise<string | null> {
  try {
    // Check if the method exists before calling it
    // This prevents the TypeError from appearing in console
    if (Application && typeof (Application as any).getInstallationIdAsync === 'function') {
      const installationId = await (Application as any).getInstallationIdAsync();
      return installationId;
    }
    
    // Method doesn't exist - return null silently (fallback will be used)
    return null;
  } catch (error: any) {
    // Silently fail - this is expected if the method doesn't exist or fails
    // The app will use fallback device ID generation instead
    // Only log if it's an unexpected error (not the "is not a function" error)
    if (error && error.message && !error.message.includes('is not a function')) {
      console.warn('Failed to get installation ID:', error.message);
    }
    return null;
  }
}

/**
 * Get persistent signup key based on installation ID
 * This key persists across app reinstalls because installation ID persists
 */
async function getPersistentSignupKey(): Promise<string> {
  const installationId = await getInstallationId();
  if (installationId) {
    return `${HAS_EVER_SIGNED_UP_KEY}_${installationId}`;
  }
  // Fallback to regular key if installation ID unavailable
  return HAS_EVER_SIGNED_UP_KEY;
}

/**
 * Generate a unique device identifier that persists across app reinstalls
 * This uses the device's installation ID which is unique per device
 */
async function generateDeviceId(): Promise<string> {
  try {
    // Try to get the installation ID (persists across app reinstalls on the same device)
    const installationId = await getInstallationId();
    if (installationId) {
      return `device_${installationId}`;
    }
  } catch (error) {
    console.warn('Failed to get installation ID:', error);
  }

  // Fallback: Generate a random UUID-like ID
  const randomId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  
  return `device_${randomId}`;
}

/**
 * Get or create a persistent device ID
 * This ID is generated once and persists forever (even after app reinstall)
 */
async function getOrCreateDeviceId(): Promise<string> {
  try {
    // Check if device ID already exists
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = await generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error getting/creating device ID:', error);
    // Return a temporary ID as fallback
    return `temp_${Date.now()}`;
  }
}

/**
 * Check if user has ever signed up on this device
 * ✅ PERSISTENT: Uses installation ID to survive app deletion
 * Checks both persistent key (installation-specific) and legacy key for backward compatibility
 * Also attempts to recover signup status from existing user data
 */
async function hasEverSignedUp(): Promise<boolean> {
  try {
    // ✅ CRITICAL: Check persistent key first (installation-specific, survives app deletion)
    const persistentKey = await getPersistentSignupKey();
    const persistentValue = await AsyncStorage.getItem(persistentKey);
    if (persistentValue === 'true') {
      return true;
    }
    
    // ✅ BACKWARD COMPATIBILITY: Also check legacy key for existing users
    const legacyValue = await AsyncStorage.getItem(HAS_EVER_SIGNED_UP_KEY);
    if (legacyValue === 'true') {
      // Migrate to persistent key for future app deletions
      await AsyncStorage.setItem(persistentKey, 'true');
      return true;
    }
    
    // ✅ RECOVERY: If flag doesn't exist but user has a real user ID (not device ID),
    // it means they signed up before. Reconstruct the flag.
    const currentUserId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
    if (currentUserId && !currentUserId.startsWith('device_') && !currentUserId.startsWith('temp_')) {
      // User has a real user ID, which means they signed up before
      // Reconstruct the persistent flag
      await AsyncStorage.setItem(persistentKey, 'true');
      await AsyncStorage.setItem(HAS_EVER_SIGNED_UP_KEY, 'true');
      console.log('✅ Recovered hasEverSignedUp flag from existing user ID');
      return true;
    }
    
    // ✅ RECOVERY: Check if there's any user-specific cache data that indicates previous signup
    // This helps recover signup status even after app deletion if user data still exists
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const installationId = await getInstallationId();
      
      // Check for any user-specific cache keys (format: user_<userId>_*)
      // If we find user-specific keys that aren't device IDs, user has signed up before
      const userSpecificKeys = allKeys.filter(key => 
        key.startsWith('user_') && 
        !key.includes('device_') &&
        !key.includes('temp_')
      );
      
      if (userSpecificKeys.length > 0 && installationId) {
        // Found user-specific data, reconstruct the flag
        await AsyncStorage.setItem(persistentKey, 'true');
        await AsyncStorage.setItem(HAS_EVER_SIGNED_UP_KEY, 'true');
        console.log('✅ Recovered hasEverSignedUp flag from existing user data');
        return true;
      }
    } catch (recoveryError) {
      // Recovery failed, continue with normal check
      console.warn('⚠️ Recovery check failed:', recoveryError);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking hasEverSignedUp:', error);
    return false;
  }
}

/**
 * Mark that user has signed up (permanent flag, never cleared)
 * ✅ PERSISTENT: Stores in both persistent key (installation-specific) and legacy key
 * This ensures the flag survives app deletion AND works for existing users
 */
export async function markUserSignedUp(): Promise<void> {
  try {
    // ✅ CRITICAL: Store in persistent key (survives app deletion)
    const persistentKey = await getPersistentSignupKey();
    await AsyncStorage.setItem(persistentKey, 'true');
    
    // ✅ BACKWARD COMPATIBILITY: Also store in legacy key for existing code
    await AsyncStorage.setItem(HAS_EVER_SIGNED_UP_KEY, 'true');
  } catch (error) {
    console.error('Error marking user as signed up:', error);
  }
}

/**
 * Get current user ID from storage
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    // First check if user has ever signed up
    const signedUp = await hasEverSignedUp();
    
    if (signedUp) {
      // If user has signed up, return their actual user ID (or null if logged out)
      const userId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
      return userId;
    }
    
    // If user has never signed up, check if they have an actual user ID from login
    const userId = await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
    if (userId) {
      // User is logged in, return their ID
      return userId;
    }
    
    // User is not logged in and has never signed up - return device ID as guest ID
    const deviceId = await getOrCreateDeviceId();
    return deviceId;
  } catch (error) {
    return null;
  }
}

/**
 * Set current user ID in storage
 * This also marks that the user has signed up (permanent record)
 */
export async function setCurrentUserId(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_USER_ID_KEY, userId);
    // Mark that user has signed up (permanent, never cleared)
    await markUserSignedUp();
  } catch (error) {
    // Error setting current user ID - silently fail
  }
}

/**
 * Clear current user ID from storage
 */
export async function clearCurrentUserId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_ID_KEY);
  } catch (error) {
    // Error clearing current user ID - silently fail
  }
}

/**
 * Extract user ID from JWT token
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decodedPayload = JSON.parse(atob(paddedPayload));

    // Return the user ID (stored as 'id' in the token)
    return decodedPayload.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user-specific cache key
 * @param baseKey - The base cache key (e.g., 'cached_diet_plan')
 * @param userId - Optional user ID. If not provided, will try to get from storage
 * @returns User-specific cache key (e.g., 'user_12345_cached_diet_plan')
 */
export async function getUserCacheKey(baseKey: string, userId?: string | null): Promise<string> {
  let currentUserId = userId;
  
  if (!currentUserId) {
    currentUserId = await getCurrentUserId();
  }

  // If no user ID, return a temporary key that won't match any user data
  // This ensures unauthenticated users don't see cached data
  if (!currentUserId) {
    return `temp_${baseKey}`;
  }

  return `user_${currentUserId}_${baseKey}`;
}

/**
 * Get all cache keys for a specific user
 * @param userId - User ID
 * @returns Array of cache key patterns for the user
 */
export function getUserCacheKeyPatterns(userId: string): string[] {
  return [
    `user_${userId}_cached_diet_plan`,
    `user_${userId}_cached_workout_plan`,
    `user_${userId}_cached_user_profile`,
    `user_${userId}_completed_meals`,
    `user_${userId}_completed_exercises`,
    `user_${userId}_completed_diet_days`,
    `user_${userId}_completed_workout_days`,
    `user_${userId}_water_intake`,
    `user_${userId}_water_completed`,
    `user_${userId}_ai_trainer_chat`,
    `user_${userId}_ai_trainer_conversations`,
    `user_${userId}_ai_trainer_current_conversation_id`,
    `user_${userId}_ai_trainer_usage_`, // Usage tracking (with date suffix)
    `user_${userId}_last_checked_day`,
    `user_${userId}_personalizedWorkout`,
    `user_${userId}_lastWorkoutCompletion`,
  ];
}

/**
 * Clear all cache keys for a specific user
 * @param userId - User ID (optional, will use current user if not provided)
 */
export async function clearUserCache(userId?: string | null): Promise<void> {
  try {
    const currentUserId = userId || await getCurrentUserId();
    
    if (!currentUserId) {
      return;
    }

    const cacheKeys = getUserCacheKeyPatterns(currentUserId);
    
    // ✅ CRITICAL: Preserve ALL per-account user data (do NOT delete these keys)
    // All user-specific data should persist across logout/login cycles
    // while still being fully account-specific via user-prefixed keys.
    const preservedKeyFragments = [
      // Diet & Workout Plans (preserve plans per account)
      '_cached_diet_plan',
      '_cached_workout_plan',
      // Progress & Completion Data
      '_completed_meals',
      '_completed_exercises',
      '_completed_diet_days',
      '_completed_workout_days',
      '_water_intake',
      '_water_completed',
      // Personalized Workout Data
      '_personalizedWorkout',
      '_lastWorkoutCompletion',
      // AI Trainer Chat History (preserve conversations per account)
      '_ai_trainer_chat',
      '_ai_trainer_conversations',
      '_ai_trainer_current_conversation_id',
      '_ai_trainer_usage_', // Usage tracking (preserve per account)
      // User Profile Data (preserve cached profile per account)
      '_cached_user_profile',
    ];

    // Filter out preserved keys - these should NOT be deleted on logout
    const filteredUserCacheKeys = cacheKeys.filter(key =>
      !preservedKeyFragments.some(fragment => key.includes(fragment))
    );
    
    // Also clear old global cache keys (for migration)
    const oldGlobalKeys = [
      'cached_diet_plan',
      'cached_workout_plan',
      'cached_user_profile',
      'completed_meals',
      'completed_exercises',
      'completed_diet_days',
      'completed_workout_days',
      'water_intake',
      'water_completed', // old non-account-specific keys are safe to remove
      'ai_trainer_chat',
      'ai_trainer_conversations',
      'ai_trainer_current_conversation_id',
      'last_checked_day',
      'personalizedWorkout',
      'lastWorkoutCompletion',
    ];

    const allKeysToRemove = [...filteredUserCacheKeys, ...oldGlobalKeys];
    
    await AsyncStorage.multiRemove(allKeysToRemove);
  } catch (error) {
    // Error clearing user cache - silently fail
  }
}

/**
 * Validate that cached data belongs to the current user
 * @param cachedData - The cached data object (should have userId field if applicable)
 * @param currentUserId - Current user ID
 * @returns true if data is valid for current user, false otherwise
 */
export function validateCachedData(cachedData: any, currentUserId: string | null): boolean {
  if (!currentUserId) {
    return false; // No user ID means data is invalid
  }

  // If cached data has a userId field, validate it matches
  if (cachedData && typeof cachedData === 'object' && 'userId' in cachedData) {
    return cachedData.userId === currentUserId;
  }

  // If no userId in data, assume it's valid (for backward compatibility during migration)
  // But we'll still use user-specific keys going forward
  return true;
}

/**
 * Clean up legacy/global cache keys.
 *
 * IMPORTANT: We intentionally DO NOT delete other users' `user_<id>_...`
 * cache entries anymore so that multiple accounts on the same device
 * can keep their own cached data (diet/workout/progress, etc.).
 *
 * This function is now only responsible for removing old, non
 * user‑scoped keys that were used before we introduced per‑user
 * cache keys. Per‑user keys are left intact for ALL users.
 * @param currentUserId - Current user ID
 */
export async function cleanupOrphanedCache(currentUserId: string): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();

    // Find old global cache keys that should be cleared (non user‑scoped)
    const oldGlobalKeys = allKeys.filter(key => {
      const oldKeys = [
        'cached_diet_plan',
        'cached_workout_plan',
        'cached_user_profile',
        'completed_meals',
        'completed_exercises',
        'completed_diet_days',
        'completed_workout_days',
        'water_intake',
        'water_completed',
        'ai_trainer_chat',
        'ai_trainer_conversations',
        'ai_trainer_current_conversation_id',
      ];
      return oldKeys.includes(key);
    });

    // Remove only legacy/global keys, keep all user_<id>_* keys
    const keysToRemove = [...oldGlobalKeys];

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    // Error cleaning up orphaned cache - silently fail
  }
}

/**
 * Validate and clean cached data on login
 * Ensures that only data belonging to the current user is accessible
 * @param currentUserId - Current user ID
 */
export async function validateCacheOnLogin(currentUserId: string): Promise<void> {
  try {
    // First, clean up any orphaned cache from other users
    await cleanupOrphanedCache(currentUserId);
    
    // Validate all current user's cache keys
    const userCacheKeys = getUserCacheKeyPatterns(currentUserId);
    
    for (const key of userCacheKeys) {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          // If data has userId field, validate it
          if (parsed && typeof parsed === 'object' && 'userId' in parsed) {
            if (parsed.userId !== currentUserId) {
              // Data doesn't belong to current user, remove it
              await AsyncStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        // If data is corrupted, remove it
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    // Error validating cache on login - silently fail
  }
}

/**
 * Migrate guest data to authenticated user
 * This is called when a user signs up or logs in for the first time
 * It transfers data from the device ID (guest) to the actual user ID
 * @param deviceId - The device/guest ID
 * @param realUserId - The real authenticated user ID
 */
export async function migrateGuestDataToUser(deviceId: string, realUserId: string): Promise<void> {
  try {
    // Only migrate if the IDs are different and deviceId starts with 'device_'
    if (deviceId === realUserId || !deviceId.startsWith('device_')) {
      return;
    }

    const allKeys = await AsyncStorage.getAllKeys();
    
    // Find all keys that belong to the guest (device ID)
    const guestKeys = allKeys.filter(key => key.startsWith(`user_${deviceId}_`));
    
    // Migrate each guest key to the real user
    for (const guestKey of guestKeys) {
      try {
        const data = await AsyncStorage.getItem(guestKey);
        if (data) {
          // Create new key with real user ID
          const newKey = guestKey.replace(`user_${deviceId}_`, `user_${realUserId}_`);
          
          // Parse the data if it's JSON and update userId field
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === 'object' && 'userId' in parsed) {
              parsed.userId = realUserId;
              await AsyncStorage.setItem(newKey, JSON.stringify(parsed));
            } else {
              await AsyncStorage.setItem(newKey, data);
            }
          } catch {
            // Not JSON, just copy as is
            await AsyncStorage.setItem(newKey, data);
          }
          
          // Remove the old guest key
          await AsyncStorage.removeItem(guestKey);
        }
      } catch (error) {
        console.error(`Error migrating key ${guestKey}:`, error);
        // Continue with other keys even if one fails
      }
    }
    
    console.log(`✅ Migrated ${guestKeys.length} guest data entries to user ${realUserId}`);
  } catch (error) {
    console.error('Error migrating guest data:', error);
  }
}

/**
 * Get the device ID (for guest users)
 * This is exposed for debugging purposes
 */
export async function getDeviceId(): Promise<string> {
  return await getOrCreateDeviceId();
}

/**
 * Check if current session is using guest ID
 */
export async function isUsingGuestId(): Promise<boolean> {
  try {
    const currentId = await getCurrentUserId();
    return currentId !== null && currentId.startsWith('device_');
  } catch (error) {
    return false;
  }
}

