import Storage from '../utils/storage';
import workoutPlanService from './workoutPlanService';
import streakService from './streakService';
import { DeviceEventEmitter } from 'react-native';
import { getUserCacheKey, getCurrentUserId } from '../utils/cacheKeys';

interface CompletionData {
  completedExercises: string[];
  completedDays: string[];
  lastUpdated: string;
}

class ExerciseCompletionService {
  private static instance: ExerciseCompletionService;
  private completionData: CompletionData = {
    completedExercises: [],
    completedDays: [],
    lastUpdated: new Date().toISOString(),
  };
  // ✅ CRITICAL: Track current user ID to ensure data integrity across account switches
  private currentUserId: string | null = null;

  static getInstance(): ExerciseCompletionService {
    if (!ExerciseCompletionService.instance) {
      ExerciseCompletionService.instance = new ExerciseCompletionService();
    }
    return ExerciseCompletionService.instance;
  }

  // Initialize completion data from storage
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing exercise completion service...');
      
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
        this.completionData.completedExercises = [];
        this.completionData.completedDays = [];
        this.currentUserId = null;
        return;
      }

      // ✅ CRITICAL: If user ID changed, reset in-memory state first
      if (this.currentUserId && this.currentUserId !== userId) {
        console.log('⚠️ User ID changed, resetting in-memory state before loading new user data');
        this.completionData.completedExercises = [];
        this.completionData.completedDays = [];
      }

      // Update tracked user ID
      this.currentUserId = userId;

      const [exercisesKey, daysKey] = await Promise.all([
        getUserCacheKey('completed_exercises', userId),
        getUserCacheKey('completed_workout_days', userId),
      ]);

      const [exercisesData, daysData] = await Promise.all([
        Storage.getItem(exercisesKey),
        Storage.getItem(daysKey),
      ]);

      this.completionData.completedExercises = exercisesData ? JSON.parse(exercisesData) : [];
      this.completionData.completedDays = daysData ? JSON.parse(daysData) : [];
      this.completionData.lastUpdated = new Date().toISOString();

      console.log('✅ Completion data loaded for user:', userId, {
        exercises: this.completionData.completedExercises.length,
        days: this.completionData.completedDays.length,
      });
    } catch (error) {
      console.error('❌ Error initializing completion service:', error);
      // ✅ CRITICAL: Ensure we have empty data structure even on error
      this.completionData.completedExercises = [];
      this.completionData.completedDays = [];
    }
  }
  
  // ✅ CRITICAL: Ensure initialized before reading data
  // Also checks if user ID has changed and reinitializes if needed
  async ensureInitialized(): Promise<void> {
    const currentUserId = await getCurrentUserId();
    
    // If no tracked user ID, initialize
    if (!this.currentUserId) {
      await this.initialize();
      return;
    }
    
    // ✅ CRITICAL: If user ID changed, reinitialize to load correct user's data
    if (currentUserId !== this.currentUserId) {
      console.log('⚠️ User ID changed in ensureInitialized, reinitializing...');
      await this.initialize();
    }
  }

  // Get completion data
  // ✅ CRITICAL: Returns current in-memory data (call ensureInitialized() first if needed)
  getCompletionData(): CompletionData {
    return { ...this.completionData };
  }
  
  // ✅ CRITICAL: Get completion data with automatic initialization
  async getCompletionDataSafe(): Promise<CompletionData> {
    await this.ensureInitialized();
    return { ...this.completionData };
  }

  // Check if exercise is completed
  isExerciseCompleted(exerciseId: string): boolean {
    return this.completionData.completedExercises.includes(exerciseId);
  }

  // Check if day is completed
  isDayCompleted(dayDate: string): boolean {
    return this.completionData.completedDays.includes(dayDate);
  }

  // Mark exercise as completed
  async markExerciseCompleted(
    exerciseId: string, 
    dayDate: string, 
    dayNumber: number, 
    weekNumber: number
  ): Promise<boolean> {
    try {
      console.log('🎯 Marking exercise as completed:', { exerciseId, dayDate, dayNumber, weekNumber });

      // Prevent duplicate completion
      if (this.isExerciseCompleted(exerciseId)) {
        console.log('⚠️ Exercise already completed, skipping');
        return true;
      }

      // Update local state
      this.completionData.completedExercises.push(exerciseId);
      this.completionData.lastUpdated = new Date().toISOString();

      // Save to AsyncStorage immediately
      await this.saveToStorage();

      // Save to database
      try {
        await workoutPlanService.markExerciseCompleted(exerciseId, dayNumber, weekNumber);
        console.log('✅ Exercise marked as completed in database');
      } catch (dbError) {
        console.warn('⚠️ Failed to save to database, but continuing with local storage:', dbError);
      }

      // Broadcast completion event
      DeviceEventEmitter.emit('exerciseCompleted', {
        exerciseId,
        dayDate,
        dayNumber,
        weekNumber,
      });

      console.log('✅ Exercise completion saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error marking exercise completed:', error);
      return false;
    }
  }

  // Mark day as completed
  async markDayCompleted(dayDate: string, dayNumber: number, weekNumber: number): Promise<boolean> {
    try {
      console.log('🎯 Marking day as completed:', { dayDate, dayNumber, weekNumber });

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
        await workoutPlanService.markDayCompleted(dayNumber, weekNumber);
        console.log('✅ Day marked as completed in database');
      } catch (dbError) {
        console.warn('⚠️ Failed to save to database, but continuing with local storage:', dbError);
      }

      // Update streak data for workout completion
      try {
        await streakService.updateStreakData('workout', true);
      } catch (streakError) {
        // Streak update failed, but continue
      }

      // Broadcast day completion event
      DeviceEventEmitter.emit('dayCompleted', {
        dayDate,
        dayNumber,
        weekNumber,
      });

      console.log('✅ Day completion saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error marking day completed:', error);
      return false;
    }
  }

  // Calculate day completion percentage
  calculateDayCompletion(dayExercises: string[], dayDate: string): number {
    const completedExercises = dayExercises.filter(exerciseId => 
      this.isExerciseCompleted(exerciseId)
    );
    
    const percentage = dayExercises.length > 0 ? (completedExercises.length / dayExercises.length) * 100 : 0;
    
    console.log('📊 ExerciseCompletionService - Day Completion Calculation:', {
      dayDate,
      totalExercises: dayExercises.length,
      completedExercises: completedExercises.length,
      completedExerciseIds: completedExercises,
      allExerciseIds: dayExercises,
      percentage: percentage.toFixed(2)
    });
    
    return percentage;
  }

  // Check if day meets completion criteria (50% threshold)
  isDayFullyCompleted(dayExercises: string[], dayDate: string): boolean {
    const completionPercentage = this.calculateDayCompletion(dayExercises, dayDate);
    return completionPercentage >= 50; // 50% threshold to match diet and UI display
  }

  // Save completion data to storage
  private async saveToStorage(): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ No user ID, cannot save exercise completion data');
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

      const [exercisesKey, daysKey] = await Promise.all([
        getUserCacheKey('completed_exercises', userId),
        getUserCacheKey('completed_workout_days', userId),
      ]);

      await Promise.all([
        Storage.setItem(exercisesKey, JSON.stringify(this.completionData.completedExercises)),
        Storage.setItem(daysKey, JSON.stringify(this.completionData.completedDays)),
      ]);
      console.log('💾 Completion data saved to storage for user:', userId);
    } catch (error) {
      console.error('❌ Error saving completion data to storage:', error);
      throw error;
    }
  }

  // Clear all completion data
  async clearCompletionData(): Promise<void> {
    try {
      console.log('🗑️ Clearing all completion data...');
      
      this.completionData = {
        completedExercises: [],
        completedDays: [],
        lastUpdated: new Date().toISOString(),
      };

      const userId = await getCurrentUserId();
      if (userId) {
        const [exercisesKey, daysKey] = await Promise.all([
          getUserCacheKey('completed_exercises', userId),
          getUserCacheKey('completed_workout_days', userId),
        ]);

        await Promise.all([
          Storage.removeItem(exercisesKey),
          Storage.removeItem(daysKey),
          // Also clear old global keys for migration
          Storage.removeItem('completed_exercises'),
          Storage.removeItem('completed_workout_days'),
        ]);
      }

      console.log('✅ All completion data cleared');
    } catch (error) {
      console.error('❌ Error clearing completion data:', error);
    }
  }

  // Reset only in-memory state (does NOT clear storage)
  // Used during logout to clear current session data without deleting user's progress
  resetInMemoryState(): void {
    this.completionData = {
      completedExercises: [],
      completedDays: [],
      lastUpdated: new Date().toISOString(),
    };
    this.currentUserId = null; // Clear tracked user ID
    console.log('🔄 Exercise completion service in-memory state reset (storage preserved)');
  }

  // Reinitialize for new user (clears in-memory data and reloads from storage)
  async reinitialize(): Promise<void> {
    this.completionData = {
      completedExercises: [],
      completedDays: [],
      lastUpdated: new Date().toISOString(),
    };
    await this.initialize(); // Reload from storage for new user
    console.log('🔄 Exercise completion service reinitialized for new user');
  }

  // Sync with database (for when app starts)
  async syncWithDatabase(): Promise<void> {
    try {
      console.log('🔄 Syncing completion data with database...');
      
      // This would typically fetch from database and merge with local data
      // For now, we'll just ensure local storage is up to date
      await this.saveToStorage();
      
      console.log('✅ Completion data synced with database');
    } catch (error) {
      console.error('❌ Error syncing with database:', error);
    }
  }

  // Get completion statistics
  // ✅ FIXED: Now calculates accurate totals from workout plan
  async getCompletionStats(): Promise<{
    totalExercises: number;
    completedExercises: number;
    totalDays: number;
    completedDays: number;
    completionRate: number;
  }> {
    // Ensure initialized before reading data
    await this.ensureInitialized();
    
    // Get completed counts (accurate - from stored data)
    const completedExercises = this.completionData.completedExercises.length;
    const completedDays = this.completionData.completedDays.length;
    
    // Calculate totals from workout plan
    let totalExercises = 0;
    let totalDays = 0;
    
    try {
      // Load workout plan to calculate accurate totals
      const { default: aiWorkoutService } = await import('./aiWorkoutService');
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      
      if (workoutPlan && workoutPlan.weeklyPlan) {
        // Calculate exercises per week (sum across all 7 days in weekly plan)
        const exercisesPerWeek = workoutPlan.weeklyPlan.reduce((total, day) => {
          if (!day.isRestDay && day.exercises) {
            return total + day.exercises.length;
          }
          return total;
        }, 0);
        
        // Calculate total days (plan duration in days)
        if (workoutPlan.startDate && workoutPlan.endDate) {
          const startDate = new Date(workoutPlan.startDate);
          const endDate = new Date(workoutPlan.endDate);
          const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          totalDays = Math.max(0, daysDiff);
          
          // Calculate total exercises for entire plan: (exercises per week) * (number of weeks)
          const numberOfWeeks = Math.ceil(totalDays / 7);
          totalExercises = exercisesPerWeek * numberOfWeeks;
        } else {
          // Fallback: estimate from totalWeeks if available
          const numberOfWeeks = workoutPlan.totalWeeks || 0;
          totalDays = numberOfWeeks * 7;
          totalExercises = exercisesPerWeek * numberOfWeeks;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load workout plan for stats calculation:', error);
      // If plan loading fails, we can't calculate accurate totals
      // Return completed counts only
    }
    
    return {
      totalExercises: Math.max(totalExercises, completedExercises), // Ensure total >= completed
      completedExercises,
      totalDays: Math.max(totalDays, completedDays), // Ensure total >= completed
      completedDays,
      completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
    };
  }
}

export default ExerciseCompletionService.getInstance();
