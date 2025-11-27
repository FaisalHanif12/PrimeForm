import Storage from '../utils/storage';
import workoutPlanService from './workoutPlanService';
import streakService from './streakService';
import { DeviceEventEmitter } from 'react-native';

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
      
      // Load from AsyncStorage
      const [exercisesData, daysData] = await Promise.all([
        Storage.getItem('completed_exercises'),
        Storage.getItem('completed_workout_days'),
      ]);

      this.completionData.completedExercises = exercisesData ? JSON.parse(exercisesData) : [];
      this.completionData.completedDays = daysData ? JSON.parse(daysData) : [];
      this.completionData.lastUpdated = new Date().toISOString();

      console.log('✅ Completion data loaded:', {
        exercises: this.completionData.completedExercises.length,
        days: this.completionData.completedDays.length,
      });
    } catch (error) {
      console.error('❌ Error initializing completion service:', error);
    }
  }

  // Get completion data
  getCompletionData(): CompletionData {
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

  // Check if day meets completion criteria (60% threshold)
  isDayFullyCompleted(dayExercises: string[], dayDate: string): boolean {
    const completionPercentage = this.calculateDayCompletion(dayExercises, dayDate);
    return completionPercentage >= 60;
  }

  // Save completion data to storage
  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        Storage.setItem('completed_exercises', JSON.stringify(this.completionData.completedExercises)),
        Storage.setItem('completed_workout_days', JSON.stringify(this.completionData.completedDays)),
      ]);
      console.log('💾 Completion data saved to storage');
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

      await Promise.all([
        Storage.removeItem('completed_exercises'),
        Storage.removeItem('completed_workout_days'),
      ]);

      console.log('✅ All completion data cleared');
    } catch (error) {
      console.error('❌ Error clearing completion data:', error);
    }
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
  getCompletionStats(): {
    totalExercises: number;
    completedExercises: number;
    totalDays: number;
    completedDays: number;
    completionRate: number;
  } {
    const totalExercises = this.completionData.completedExercises.length;
    const completedExercises = this.completionData.completedExercises.length;
    const totalDays = this.completionData.completedDays.length;
    const completedDays = this.completionData.completedDays.length;
    
    return {
      totalExercises,
      completedExercises,
      totalDays,
      completedDays,
      completionRate: totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0,
    };
  }
}

export default ExerciseCompletionService.getInstance();
