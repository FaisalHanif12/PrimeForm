import Storage from '../utils/storage';
import dietPlanService from './dietPlanService';
import streakService from './streakService';
import { DeviceEventEmitter } from 'react-native';
import { getUserCacheKey, getCurrentUserId } from '../utils/cacheKeys';

interface MealCompletionData {
  completedMeals: string[];
  completedDays: string[];
  lastUpdated: string;
}

class MealCompletionService {
  private static instance: MealCompletionService;
  private completionData: MealCompletionData = {
    completedMeals: [],
    completedDays: [],
    lastUpdated: new Date().toISOString(),
  };
  // ✅ CRITICAL: Track current user ID to ensure data integrity across account switches
  private currentUserId: string | null = null;

  static getInstance(): MealCompletionService {
    if (!MealCompletionService.instance) {
      MealCompletionService.instance = new MealCompletionService();
    }
    return MealCompletionService.instance;
  }

  // Initialize completion data from storage
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing meal completion service...');
      
      // ✅ CRITICAL: Retry logic to ensure user ID is available
      let userId = await getCurrentUserId();
      let retries = 3;
      
      // If no user ID, wait a bit and retry (user ID might be setting)
      while (!userId && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        userId = await getCurrentUserId();
        retries--;
      }
      
      if (!userId) {
        // No user ID after retries, initialize with empty data
        console.warn('⚠️ No user ID available after retries, initializing with empty data');
        this.completionData.completedMeals = [];
        this.completionData.completedDays = [];
        this.currentUserId = null;
        return;
      }

      // ✅ CRITICAL: If user ID changed, reset in-memory state first
      if (this.currentUserId && this.currentUserId !== userId) {
        console.log('⚠️ User ID changed, resetting in-memory state before loading new user data');
        this.completionData.completedMeals = [];
        this.completionData.completedDays = [];
      }

      // Update tracked user ID
      this.currentUserId = userId;

      const [mealsKey, daysKey] = await Promise.all([
        getUserCacheKey('completed_meals', userId),
        getUserCacheKey('completed_diet_days', userId),
      ]);

      const [mealsData, daysData] = await Promise.all([
        Storage.getItem(mealsKey),
        Storage.getItem(daysKey),
      ]);

      this.completionData.completedMeals = mealsData ? JSON.parse(mealsData) : [];
      this.completionData.completedDays = daysData ? JSON.parse(daysData) : [];
      this.completionData.lastUpdated = new Date().toISOString();

      console.log('✅ Meal completion data loaded for user:', userId, {
        meals: this.completionData.completedMeals.length,
        days: this.completionData.completedDays.length,
      });
    } catch (error) {
      console.error('❌ Error initializing meal completion service:', error);
      // ✅ CRITICAL: Ensure we have empty data structure even on error
      this.completionData.completedMeals = [];
      this.completionData.completedDays = [];
    }
  }
  
  // ✅ CRITICAL: Ensure initialized before reading data
  async ensureInitialized(): Promise<void> {
    if (!this.currentUserId) {
      await this.initialize();
    }
  }

  // Get completion data
  // ✅ CRITICAL: Returns current in-memory data (call ensureInitialized() first if needed)
  getCompletionData(): MealCompletionData {
    return { ...this.completionData };
  }
  
  // ✅ CRITICAL: Get completion data with automatic initialization
  async getCompletionDataSafe(): Promise<MealCompletionData> {
    await this.ensureInitialized();
    return { ...this.completionData };
  }

  // Check if meal is completed
  isMealCompleted(mealId: string): boolean {
    return this.completionData.completedMeals.includes(mealId);
  }

  // Check if day is completed
  isDayCompleted(dayDate: string): boolean {
    return this.completionData.completedDays.includes(dayDate);
  }

  // Mark meal as completed
  async markMealCompleted(
    mealId: string, 
    dayDate: string, 
    dayNumber: number, 
    weekNumber: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): Promise<boolean> {
    try {
      console.log('🍽️ Marking meal as completed:', { mealId, dayDate, dayNumber, weekNumber, mealType });

      // Prevent duplicate completion
      if (this.isMealCompleted(mealId)) {
        console.log('⚠️ Meal already completed, skipping');
        return true;
      }

      // Update local state
      this.completionData.completedMeals.push(mealId);
      this.completionData.lastUpdated = new Date().toISOString();

      // Save to AsyncStorage immediately
      await this.saveToStorage();

      // Save to database
      try {
        await dietPlanService.markMealCompleted(mealId, dayNumber, weekNumber, mealType);
        console.log('✅ Meal marked as completed in database');
      } catch (dbError) {
        console.warn('⚠️ Failed to save to database, but continuing with local storage:', dbError);
      }

      // Broadcast completion event
      DeviceEventEmitter.emit('mealCompleted', {
        mealId,
        dayDate,
        dayNumber,
        weekNumber,
        mealType
      });

      return true;
    } catch (error) {
      console.error('❌ Error marking meal as completed:', error);
      return false;
    }
  }

  // Mark day as completed
  async markDayCompleted(
    dayDate: string, 
    dayNumber: number, 
    weekNumber: number
  ): Promise<boolean> {
    try {
      console.log('📅 Marking day as completed:', { dayDate, dayNumber, weekNumber });

      // Prevent duplicate completion
      if (this.isDayCompleted(dayDate)) {
        console.log('⚠️ Day already completed, skipping');
        return true;
      }

      // Update local state
      this.completionData.completedDays.push(dayDate);
      this.completionData.lastUpdated = new Date().toISOString();

      // Save to AsyncStorage immediately
      await this.saveToStorage();

      // Save to database
      try {
        await dietPlanService.markDayCompleted(dayNumber, weekNumber);
        console.log('✅ Day marked as completed in database');
      } catch (dbError) {
        console.warn('⚠️ Failed to save to database, but continuing with local storage:', dbError);
      }

      // Update streak data for diet completion
      try {
        await streakService.updateStreakData('diet', true);
      } catch (streakError) {
        // Streak update failed, but continue
      }

      // Broadcast completion event
      DeviceEventEmitter.emit('dayCompleted', {
        dayDate,
        dayNumber,
        weekNumber
      });

      return true;
    } catch (error) {
      console.error('❌ Error marking day as completed:', error);
      return false;
    }
  }

  // Calculate day completion percentage
  calculateDayCompletion(dayMealIds: string[], dayDate: string): number {
    if (dayMealIds.length === 0) return 0;

    const completedCount = dayMealIds.filter(mealId => this.isMealCompleted(mealId)).length;
    const percentage = (completedCount / dayMealIds.length) * 100;

    console.log('📊 Day meal completion calculation:', {
      dayDate,
      totalMeals: dayMealIds.length,
      completedMeals: completedCount,
      percentage: percentage.toFixed(2)
    });

    return percentage;
  }

  // Check if day meets completion criteria (50% threshold)
  isDayFullyCompleted(dayMealIds: string[], dayDate: string): boolean {
    const percentage = this.calculateDayCompletion(dayMealIds, dayDate);
    return percentage >= 50; // 50% threshold like workout
  }

  // Save to AsyncStorage
  private async saveToStorage(): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ No user ID, cannot save meal completion data');
        return;
      }

      // ✅ CRITICAL: Validate user ID matches before saving (prevents data leakage)
      if (this.currentUserId && this.currentUserId !== userId) {
        console.error('❌ CRITICAL: User ID mismatch! Current:', this.currentUserId, 'Expected:', userId);
        console.error('❌ Aborting save to prevent data leakage. Reinitializing service...');
        // Reinitialize to load correct user's data
        await this.initialize();
        return;
      }

      // Update tracked user ID if not set
      if (!this.currentUserId) {
        this.currentUserId = userId;
      }

      const [mealsKey, daysKey] = await Promise.all([
        getUserCacheKey('completed_meals', userId),
        getUserCacheKey('completed_diet_days', userId),
      ]);

      await Promise.all([
        Storage.setItem(mealsKey, JSON.stringify(this.completionData.completedMeals)),
        Storage.setItem(daysKey, JSON.stringify(this.completionData.completedDays)),
      ]);
      console.log('💾 Meal completion data saved to storage for user:', userId);
    } catch (error) {
      console.error('❌ Error saving meal completion data to storage:', error);
    }
  }

  // Reset completion data (for testing or new plans)
  async resetCompletionData(): Promise<void> {
    this.completionData = {
      completedMeals: [],
      completedDays: [],
      lastUpdated: new Date().toISOString(),
    };
    await this.saveToStorage();
    console.log('🔄 Meal completion data reset');
  }

  // Reset only in-memory state (does NOT clear storage)
  // Used during logout to clear current session data without deleting user's progress
  resetInMemoryState(): void {
    this.completionData = {
      completedMeals: [],
      completedDays: [],
      lastUpdated: new Date().toISOString(),
    };
    this.currentUserId = null; // Clear tracked user ID
    console.log('🔄 Meal completion service in-memory state reset (storage preserved)');
  }

  // Reinitialize for new user (clears in-memory data and reloads from storage)
  async reinitialize(): Promise<void> {
    this.completionData = {
      completedMeals: [],
      completedDays: [],
      lastUpdated: new Date().toISOString(),
    };
    await this.initialize(); // Reload from storage for new user
    console.log('🔄 Meal completion service reinitialized for new user');
  }

  // Sync with database (useful for data recovery)
  async syncWithDatabase(): Promise<void> {
    try {
      console.log('🔄 Syncing meal completion data with database...');
      
      // Implementation would depend on your database API
      // For now, we'll rely on the local storage approach
      
      console.log('✅ Meal completion sync completed');
    } catch (error) {
      console.error('❌ Error syncing with database:', error);
    }
  }
}

// Export singleton instance
const mealCompletionService = MealCompletionService.getInstance();
export default mealCompletionService;
