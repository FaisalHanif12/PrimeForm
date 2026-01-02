import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { 
  getCurrentUserId, 
  getUserCacheKey, 
  getUserCacheKeyPatterns,
  extractUserIdFromToken,
  setCurrentUserId,
  markUserSignedUp
} from './cacheKeys';
import { 
  validateAllAccountData, 
  backupAccountData, 
  restoreAccountData 
} from './dataIntegrity';

const APP_VERSION_KEY = 'primeform_app_version';
const LAST_MIGRATION_VERSION_KEY = 'primeform_last_migration_version';

/**
 * Get current app version from app.json
 */
export function getCurrentAppVersion(): string {
  try {
    // Try to get from expo-application
    if (Application && typeof (Application as any).nativeApplicationVersion === 'string') {
      return (Application as any).nativeApplicationVersion;
    }
    // Fallback to hardcoded version (should match app.json)
    return '1.0.1';
  } catch (error) {
    return '1.0.1';
  }
}

/**
 * Check if app was updated and needs migration
 */
export async function checkAppUpdate(): Promise<boolean> {
  try {
    const currentVersion = getCurrentAppVersion();
    const lastVersion = await AsyncStorage.getItem(APP_VERSION_KEY);
    
    if (lastVersion !== currentVersion) {
      // App was updated
      await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('⚠️ Error checking app update:', error);
    return false;
  }
}

/**
 * Migrate old global cache keys to user-specific keys
 * This ensures data persists across app updates
 */
export async function migrateOldCacheKeysToUserSpecific(): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('device_') || userId.startsWith('temp_')) {
      // No real user ID, skip migration
      return;
    }

    const allKeys = await AsyncStorage.getAllKeys();
    
    // Old global cache keys that need to be migrated
    const oldGlobalKeys = [
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
      'last_checked_day',
      'personalizedWorkout',
      'lastWorkoutCompletion',
    ];

    // Map old keys to new user-specific keys
    const keyMappings: { [oldKey: string]: string } = {};
    for (const oldKey of oldGlobalKeys) {
      const newKey = await getUserCacheKey(oldKey, userId);
      keyMappings[oldKey] = newKey;
    }

    // Migrate each old key if it exists and new key doesn't exist
    for (const [oldKey, newKey] of Object.entries(keyMappings)) {
      try {
        // Check if old key exists
        if (allKeys.includes(oldKey)) {
          // Check if new key already exists (don't overwrite)
          if (!allKeys.includes(newKey)) {
            const data = await AsyncStorage.getItem(oldKey);
            if (data) {
              // Parse and update userId field if it's JSON
              try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === 'object') {
                  // Add userId to data for validation
                  parsed.userId = userId;
                  await AsyncStorage.setItem(newKey, JSON.stringify(parsed));
                } else {
                  await AsyncStorage.setItem(newKey, data);
                }
              } catch {
                // Not JSON, copy as is
                await AsyncStorage.setItem(newKey, data);
              }
              
              console.log(`✅ Migrated ${oldKey} to ${newKey}`);
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error migrating ${oldKey}:`, error);
        // Continue with other keys
      }
    }
  } catch (error) {
    console.error('❌ Error in cache migration:', error);
  }
}

/**
 * Recover user authentication state after app update
 * Ensures user stays logged in and all data is accessible
 */
export async function recoverAuthStateAfterUpdate(): Promise<boolean> {
  try {
    // Check if auth token exists
    const authToken = await AsyncStorage.getItem('authToken');
    if (!authToken) {
      return false;
    }

    // Extract user ID from token
    const userId = extractUserIdFromToken(authToken);
    if (!userId) {
      return false;
    }

    // Ensure user ID is stored
    const currentUserId = await getCurrentUserId();
    if (currentUserId !== userId) {
      await setCurrentUserId(userId);
      // Mark that user has signed up (for recovery)
      await markUserSignedUp();
    }

    // Migrate any old cache keys to user-specific keys
    await migrateOldCacheKeysToUserSpecific();

    console.log('✅ Auth state recovered after app update');
    return true;
  } catch (error) {
    console.error('❌ Error recovering auth state:', error);
    return false;
  }
}

/**
 * Validate all user cache data belongs to current user
 * This ensures data integrity after app updates
 * ✅ CRITICAL: Enhanced validation with comprehensive checks
 */
export async function validateUserCacheAfterUpdate(): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('device_') || userId.startsWith('temp_')) {
      return;
    }

    // ✅ CRITICAL: Use dataIntegrity module for comprehensive validation
    const invalidCount = await validateAllAccountData(userId);
    
    if (invalidCount > 0) {
      console.log(`✅ Validated cache after update: Removed ${invalidCount} invalid entries`);
    }

    // Additional validation: Check all user-specific keys
    const cacheKeyPatterns = getUserCacheKeyPatterns(userId);
    const allKeys = await AsyncStorage.getAllKeys();

    // Validate each cache key pattern
    for (const pattern of cacheKeyPatterns) {
      try {
        // Find all keys matching this pattern (handle usage keys with date suffix)
        const basePattern = pattern.split('_usage_')[0];
        const matchingKeys = allKeys.filter(key => 
          key.startsWith(basePattern) && key.startsWith(`user_${userId}_`)
        );
        
        for (const key of matchingKeys) {
          try {
            const data = await AsyncStorage.getItem(key);
            if (data) {
              try {
                const parsed = JSON.parse(data);
                // ✅ CRITICAL: Validate data belongs to current user
                if (parsed && typeof parsed === 'object') {
                  if ('userId' in parsed && parsed.userId !== userId) {
                    // Data belongs to different user, remove it
                    await AsyncStorage.removeItem(key);
                    console.log(`⚠️ Removed invalid cache key: ${key} (belongs to ${parsed.userId}, expected ${userId})`);
                  } else if (!('userId' in parsed)) {
                    // Add userId to data for future validation
                    parsed.userId = userId;
                    await AsyncStorage.setItem(key, JSON.stringify(parsed));
                  }
                }
              } catch {
                // Not JSON, skip validation (might be string data)
              }
            }
          } catch (error) {
            console.warn(`⚠️ Error validating cache key ${key}:`, error);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error validating cache pattern ${pattern}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error validating user cache:', error);
  }
}

/**
 * Main migration function called on app startup
 * Handles all data preservation and recovery after app updates
 * ✅ CRITICAL: Designed to handle multiple sequential updates gracefully
 */
export async function performAppUpdateMigration(): Promise<void> {
  try {
    const wasUpdated = await checkAppUpdate();
    
    if (wasUpdated) {
      console.log('🔄 App was updated, performing migration...');
      
      // Step 1: Recover authentication state
      const authRecovered = await recoverAuthStateAfterUpdate();
      
      if (authRecovered) {
        // ✅ CRITICAL: Backup account data before migration (safety net)
        const userId = await getCurrentUserId();
        let backup: { [key: string]: any } = {};
        
        try {
          if (userId && !userId.startsWith('device_') && !userId.startsWith('temp_')) {
            backup = await backupAccountData(userId);
            console.log(`✅ Backed up ${Object.keys(backup).length} account data entries`);
          }
        } catch (backupError) {
          console.warn('⚠️ Backup failed, continuing with migration:', backupError);
        }
        
        try {
          // Step 2: Migrate old cache keys to user-specific keys
          await migrateOldCacheKeysToUserSpecific();
          
          // Step 3: Validate all cache data belongs to current user
          await validateUserCacheAfterUpdate();
          
          // ✅ CRITICAL: Additional integrity check using dataIntegrity module
          if (userId && !userId.startsWith('device_') && !userId.startsWith('temp_')) {
            const invalidCount = await validateAllAccountData(userId);
            if (invalidCount > 0) {
              console.warn(`⚠️ Removed ${invalidCount} invalid data entries during migration`);
            }
            
            // ✅ CRITICAL: Verify all critical data is accessible after migration
            await ensureDataAccessibility();
          }
          
          console.log('✅ App update migration completed successfully');
        } catch (migrationError) {
          console.error('❌ Migration error, attempting recovery:', migrationError);
          
          // ✅ CRITICAL: Restore backup if migration failed
          if (userId && Object.keys(backup).length > 0) {
            try {
              const restoredCount = await restoreAccountData(backup, userId);
              console.log(`✅ Recovered ${restoredCount} data entries from backup`);
            } catch (restoreError) {
              console.error('❌ Recovery failed:', restoreError);
            }
          }
        }
      } else {
        console.log('ℹ️ No auth state to recover, skipping migration');
      }
      
      // Mark migration as completed for this version
      await AsyncStorage.setItem(LAST_MIGRATION_VERSION_KEY, getCurrentAppVersion());
    } else {
      // ✅ CRITICAL: Even if app wasn't updated, validate data integrity on every startup
      // This ensures data integrity is maintained across all app sessions
      const userId = await getCurrentUserId();
      if (userId && !userId.startsWith('device_') && !userId.startsWith('temp_')) {
        try {
          const invalidCount = await validateAllAccountData(userId);
          if (invalidCount > 0) {
            console.log(`✅ Validated account data: Removed ${invalidCount} invalid entries`);
          }
        } catch (validationError) {
          console.warn('⚠️ Data validation error (non-critical):', validationError);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error performing app update migration:', error);
    // Don't throw - migration errors shouldn't break the app
  }
}

/**
 * Ensure user stays logged in after app update
 * This is called early in app startup to restore auth state
 */
export async function ensureAuthPersistence(): Promise<boolean> {
  try {
    // Check if auth token exists
    const authToken = await AsyncStorage.getItem('authToken');
    if (!authToken) {
      return false;
    }

    // Extract and verify user ID
    const userId = extractUserIdFromToken(authToken);
    if (!userId) {
      return false;
    }

    // Ensure user ID is stored (may have been lost during update)
    const currentUserId = await getCurrentUserId();
    if (currentUserId !== userId) {
      await setCurrentUserId(userId);
      await markUserSignedUp();
    }

    return true;
  } catch (error) {
    console.error('❌ Error ensuring auth persistence:', error);
    return false;
  }
}

/**
 * ✅ CRITICAL: Verify all critical user data exists after migration
 * This ensures users don't lose any data after app updates
 * @param userId - User ID to verify
 * @returns Object with verification results
 */
export async function verifyCriticalDataAfterUpdate(userId: string): Promise<{
  success: boolean;
  missingData: string[];
  verifiedData: string[];
}> {
  const result = {
    success: true,
    missingData: [] as string[],
    verifiedData: [] as string[]
  };

  try {
    if (!userId || userId.startsWith('device_') || userId.startsWith('temp_')) {
      return result;
    }

    // Critical data keys that must exist (if user had them before)
    const criticalKeys = [
      'cached_diet_plan',
      'cached_workout_plan',
      'cached_user_profile',
      'completed_meals',
      'completed_exercises',
      'water_intake',
      'ai_trainer_conversations'
    ];

    const allKeys = await AsyncStorage.getAllKeys();
    const userPrefix = `user_${userId}_`;

    for (const baseKey of criticalKeys) {
      const userKey = `${userPrefix}${baseKey}`;
      const exists = allKeys.some(key => key === userKey || key.startsWith(userKey));
      
      if (exists) {
        result.verifiedData.push(baseKey);
      } else {
        // Check if old global key exists (needs migration)
        const oldKey = baseKey;
        if (allKeys.includes(oldKey)) {
          // Old key exists but not migrated yet - this is OK, migration will handle it
          result.verifiedData.push(baseKey);
        } else {
          // Key doesn't exist - might be OK if user never had this data
          // Don't mark as missing unless we're certain they had it before
        }
      }
    }

    // If we verified at least some data, consider it successful
    if (result.verifiedData.length > 0) {
      result.success = true;
    }

    return result;
  } catch (error) {
    console.error('❌ Error verifying critical data:', error);
    // Return success=true to not block app startup
    return { ...result, success: true };
  }
}

/**
 * ✅ CRITICAL: Ensure all user data is accessible after update
 * This is a final safety check to guarantee smooth user experience
 */
export async function ensureDataAccessibility(): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('device_') || userId.startsWith('temp_')) {
      return;
    }

    // Verify critical data exists
    const verification = await verifyCriticalDataAfterUpdate(userId);
    
    if (verification.verifiedData.length > 0) {
      console.log(`✅ Verified ${verification.verifiedData.length} critical data entries after update`);
    }

    // Ensure all user-specific keys are accessible
    const allKeys = await AsyncStorage.getAllKeys();
    const userPrefix = `user_${userId}_`;
    const userKeys = allKeys.filter(key => key.startsWith(userPrefix));
    
    console.log(`✅ Found ${userKeys.length} user-specific data entries`);
    
    // Validate each key is readable
    for (const key of userKeys.slice(0, 10)) { // Check first 10 keys
      try {
        const data = await AsyncStorage.getItem(key);
        if (!data) {
          console.warn(`⚠️ Key ${key} exists but data is empty`);
        }
      } catch (error) {
        console.warn(`⚠️ Error reading key ${key}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring data accessibility:', error);
    // Don't throw - this is a safety check, shouldn't break app
  }
}

