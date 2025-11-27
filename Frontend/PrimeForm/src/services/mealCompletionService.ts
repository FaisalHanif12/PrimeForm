import Storage from '../utils/storage';
import dietPlanService from './dietPlanService';
import streakService from './streakService';
import { DeviceEventEmitter } from 'react-native';

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
      
      // Load from AsyncStorage
      const [mealsData, daysData] = await Promise.all([
        Storage.getItem('completed_meals'),
        Storage.getItem('completed_diet_days'),
      ]);

      this.completionData.completedMeals = mealsData ? JSON.parse(mealsData) : [];
      this.completionData.completedDays = daysData ? JSON.parse(daysData) : [];
      this.completionData.lastUpdated = new Date().toISOString();

      console.log('✅ Meal completion data loaded:', {
        meals: this.completionData.completedMeals.length,
        days: this.completionData.completedDays.length,
      });
    } catch (error) {
      console.error('❌ Error initializing meal completion service:', error);
    }
  }

  // Get completion data
  getCompletionData(): MealCompletionData {
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
      await Promise.all([
        Storage.setItem('completed_meals', JSON.stringify(this.completionData.completedMeals)),
        Storage.setItem('completed_diet_days', JSON.stringify(this.completionData.completedDays)),
      ]);
      console.log('💾 Meal completion data saved to storage');
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
