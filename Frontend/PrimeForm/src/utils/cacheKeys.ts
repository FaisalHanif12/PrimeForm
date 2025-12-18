import AsyncStorage from '@react-native-async-storage/async-storage';


const CURRENT_USER_ID_KEY = 'current_user_id';

/**
 * Get current user ID from storage
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Set current user ID in storage
 */
export async function setCurrentUserId(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_USER_ID_KEY, userId);
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

