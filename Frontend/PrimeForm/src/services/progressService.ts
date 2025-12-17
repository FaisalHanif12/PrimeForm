import { api } from '../config/api';
import Storage from '../utils/storage';
import aiWorkoutService, { WorkoutPlan, WorkoutDay, WorkoutExercise } from './aiWorkoutService';
import aiDietService, { DietPlan, DietDay, DietMeal } from './aiDietService';
import exerciseCompletionService from './exerciseCompletionService';
import mealCompletionService from './mealCompletionService';
import { getUserCacheKey, getCurrentUserId } from '../utils/cacheKeys';

interface ProgressStats {
  caloriesConsumed: number;
  caloriesBurned: number;
  targetCalories: number;
  waterIntake: number;
  targetWater: number;
  protein: number;
  carbs: number;
  fats: number;
  targetProtein: number; // ✅ Added target macros
  targetCarbs: number;
  targetFats: number;
  workoutsCompleted: number;
  totalWorkouts: number;
  mealsCompleted: number;
  totalMeals: number;
  currentStreak: number;
  longestStreak: number;
  weightProgress: number;
  bodyFatProgress: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: string;
    strokeWidth: number;
  }[];
}

interface ProgressServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class ProgressService {
  private lastCleanupDate: string | null = null;
  
  // PERFORMANCE: Cache for calculated stats and charts
  private statsCache: Map<string, { data: ProgressStats; timestamp: number }> = new Map();
  private chartsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private availableWeeksCache: number[] | null = null;
  private availableMonthsCache: number[] | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache for stats/charts
  private lastCompletionUpdate: number = 0; // Track when completion data was last updated

  // Initialize and perform cleanup if needed
  async initialize(): Promise<void> {
    await exerciseCompletionService.initialize();
    await mealCompletionService.initialize();
    await this.performPeriodicCleanup();
  }
  
  // Clear caches when completion data changes (public method for external use)
  // ✅ CRITICAL: Also clear cache when user switches accounts
  invalidateCaches(): void {
    this.statsCache.clear();
    this.chartsCache.clear();
    this.availableWeeksCache = null;
    this.availableMonthsCache = null;
    this.lastCompletionUpdate = Date.now();
  }
  
  // Clear all caches for a specific user (called on logout or account switch)
  async clearUserCaches(userId?: string): Promise<void> {
    if (userId) {
      // Clear only caches for this specific user
      const userCachePrefix = `user_${userId}_`;
      for (const key of this.statsCache.keys()) {
        if (key.startsWith(userCachePrefix)) {
          this.statsCache.delete(key);
        }
      }
      for (const key of this.chartsCache.keys()) {
        if (key.startsWith(userCachePrefix)) {
          this.chartsCache.delete(key);
        }
      }
    } else {
      // Clear all caches if no userId provided
      this.invalidateCaches();
    }
  }
  
  // Generate cache key for stats/charts - includes user ID for account-specific caching
  private async getCacheKey(period: string, week?: number, month?: number): Promise<string> {
    const userId = await getCurrentUserId();
    // Include user ID in cache key to ensure account-specific caching
    return `user_${userId || 'anonymous'}_${period}-${week || 0}-${month || 0}`;
  }

  // ✅ Helper: calculate macros for a single diet day from its meals
  private calculateDietDayMacros(dietDay: DietDay | null | undefined): { protein: number; carbs: number; fats: number } {
    if (!dietDay || !dietDay.meals) {
      return { protein: 0, carbs: 0, fats: 0 };
    }
    const meals = dietDay.meals;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    const addMeal = (meal?: DietMeal) => {
      if (!meal) return;
      protein += meal.protein || 0;
      carbs += meal.carbs || 0;
      fats += meal.fats || 0;
    };

    addMeal(meals.breakfast);
    addMeal(meals.lunch);
    addMeal(meals.dinner);
    (meals.snacks || []).forEach((snack: DietMeal) => addMeal(snack));

    return { protein, carbs, fats };
  }

  // Perform periodic cleanup of old data
  private async performPeriodicCleanup(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastCleanup = await Storage.getItem('last_progress_cleanup');
      
      // Only cleanup once per day
      if (lastCleanup === today) {
        return;
      }

      await Storage.setItem('last_progress_cleanup', today);
      this.lastCleanupDate = today;
    } catch (error) {
      // Error during periodic cleanup
    }
  }

  // Get comprehensive progress statistics
  async getProgressStats(period: 'daily' | 'weekly' | 'monthly', selectedWeek?: number, selectedMonth?: number, forceRefresh = false): Promise<ProgressServiceResponse<ProgressStats>> {
    try {
      // PERFORMANCE: Check cache first (unless forcing refresh)
      const cacheKey = await this.getCacheKey(period, selectedWeek, selectedMonth);
      if (!forceRefresh) {
        const cached = this.statsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
          return {
            success: true,
            message: 'Progress stats from cache',
            data: cached.data
          };
        }
      }

      // Always initialize services first
      await this.initialize();

      // Calculate from local data directly - this ensures accuracy
      const localStats = await this.calculateRealTimeStats(period, selectedWeek, selectedMonth, forceRefresh);
      
      // PERFORMANCE: Cache the result with user-specific key
      this.statsCache.set(cacheKey, {
        data: localStats,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        message: 'Progress stats calculated from real-time data',
        data: localStats
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to load progress statistics'
      };
    }
  }

  // Calculate statistics from real workout and diet plan completion data
  private async calculateRealTimeStats(period: 'daily' | 'weekly' | 'monthly', selectedWeek?: number, selectedMonth?: number, forceRefresh = false): Promise<ProgressStats> {
    try {
      
      // OPTIMIZATION: Load workout and diet plans using cached data unless forcing refresh
      const workoutPlan = forceRefresh 
        ? await aiWorkoutService.refreshWorkoutPlanFromDatabase()
        : await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = forceRefresh
        ? await aiDietService.refreshDietPlanFromDatabase()
        : await aiDietService.loadDietPlanFromDatabase();

      // Get completion data from services (already initialized)
      const exerciseCompletionData = exerciseCompletionService.getCompletionData();
      const mealCompletionData = mealCompletionService.getCompletionData();
      
      // Load water intake data with user-specific keys
      const userId = await getCurrentUserId();
      const waterIntakeKey = userId ? await getUserCacheKey('water_intake', userId) : 'water_intake';
      const waterCompletedKey = userId ? await getUserCacheKey('water_completed', userId) : 'water_completed';
      const waterIntakeData = await Storage.getItem(waterIntakeKey) || '{}';
      const waterCompletedData = await Storage.getItem(waterCompletedKey) || '{}';
      const waterData = JSON.parse(waterIntakeData);
      const waterCompleted = JSON.parse(waterCompletedData);

      // Calculate date range based on period
      const { startDate, endDate } = this.getDateRange(period, workoutPlan, dietPlan, selectedWeek, selectedMonth);

      // Filter completion data by date range
      const filteredExercises = this.filterCompletionsByDateRange(
        exerciseCompletionData.completedExercises, 
        startDate, 
        endDate
      );
      
      const filteredMeals = this.filterCompletionsByDateRange(
        mealCompletionData.completedMeals,
        startDate,
        endDate
      );

      const filteredWater = this.filterWaterByDateRange(waterData, waterCompleted, startDate, endDate);

      // Calculate actual consumption from completed meals
      let caloriesConsumed = 0;
      let protein = 0;
      let carbs = 0;
      let fats = 0;

      if (dietPlan) {
        for (const mealId of filteredMeals) {
          const mealData = this.getMealDataFromId(mealId, dietPlan);
          if (mealData) {
            caloriesConsumed += mealData.calories || 0;
            protein += mealData.protein || 0;
            carbs += mealData.carbs || 0;
            fats += mealData.fats || 0;
          }
        }
      }

      // Calculate calories burned from completed exercises
      let caloriesBurned = 0;
      if (workoutPlan) {
        for (const exerciseId of filteredExercises) {
          const exerciseData = this.getExerciseDataFromId(exerciseId, workoutPlan);
          if (exerciseData) {
            caloriesBurned += exerciseData.caloriesBurned || this.estimateCaloriesBurned(exerciseData);
          }
        }
      }

      // Calculate water intake
      // ✅ CRITICAL: When water is marked as "Done", use target amount from diet plan (100% completion)
      // ✅ CRITICAL: Check both filteredWater.intake and filteredWater.completed to ensure all dates are considered
      let waterIntake = 0;
      
      // Get all unique dates from both intake and completed
      const allWaterDates = new Set([
        ...Object.keys(filteredWater.intake),
        ...Object.keys(filteredWater.completed)
      ]);
      
      for (const date of allWaterDates) {
        // If water is marked as completed, use the target water amount from diet plan (100% completion)
        if (filteredWater.completed[date]) {
          // Get target water from diet plan for this specific date
          // Try to find exact date match first
          let dietPlanDay = dietPlan?.weeklyPlan.find(day => day.date === date);
          
          // If no exact date match, try to find by day of week
          if (!dietPlanDay && dietPlan) {
            const [year, month, day] = date.split('-').map(Number);
            const waterDate = new Date(year, month - 1, day);
            const dayOfWeek = waterDate.getDay();
            if (dayOfWeek < dietPlan.weeklyPlan.length) {
              dietPlanDay = dietPlan.weeklyPlan[dayOfWeek];
            }
          }
          
          // ✅ CRITICAL: Parse water intake string (e.g., "2-3 liters", "3000ml", "3L") to milliliters
          const targetWater = this.parseWaterIntakeToMl(dietPlanDay?.waterIntake) || 3000; // Default 3000ml (3L)
          waterIntake += targetWater; // Use target amount for 100% completion
        } else if (filteredWater.intake[date] !== undefined && Number(filteredWater.intake[date]) > 0) {
          // If not completed but has some intake, add the actual amount
          waterIntake += Number(filteredWater.intake[date]) || 0;
        }
      }
      // Convert to liters (amounts are stored in ml)
      waterIntake = waterIntake / 1000;

      // Calculate totals for the period
      const { totalWorkouts, totalMeals, targetCalories, targetWater, targetProtein, targetCarbs, targetFats } = this.calculatePeriodTotals(
        period, 
        workoutPlan, 
        dietPlan, 
        startDate, 
        endDate
      );

      // ✅ Safety check: Ensure targetWater is never NaN
      const safeTargetWater = (targetWater && !isNaN(targetWater) && targetWater > 0) ? targetWater : 3;
      
      // ✅ Safety check: Ensure target macros are never NaN
      const safeTargetProtein = (targetProtein && !isNaN(targetProtein) && targetProtein > 0) ? targetProtein : 0;
      const safeTargetCarbs = (targetCarbs && !isNaN(targetCarbs) && targetCarbs > 0) ? targetCarbs : 0;
      const safeTargetFats = (targetFats && !isNaN(targetFats) && targetFats > 0) ? targetFats : 0;

      const stats: ProgressStats = {
        caloriesConsumed: Math.round(caloriesConsumed),
        caloriesBurned: Math.round(caloriesBurned),
        targetCalories: Math.round(targetCalories),
        waterIntake: Math.round(waterIntake * 10) / 10,
        targetWater: safeTargetWater, // ✅ FIXED: Ensure never NaN
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fats: Math.round(fats),
        targetProtein: Math.round(safeTargetProtein), // ✅ Added target macros
        targetCarbs: Math.round(safeTargetCarbs),
        targetFats: Math.round(safeTargetFats),
        workoutsCompleted: filteredExercises.length,
        totalWorkouts: Math.max(totalWorkouts, 1),
        mealsCompleted: filteredMeals.length,
        totalMeals: Math.max(totalMeals, 1),
        currentStreak: 0,
        longestStreak: 0,
        weightProgress: 0,
        bodyFatProgress: 0
      };

      return stats;

    } catch (error) {
      // Return default stats on error
      return {
        caloriesConsumed: 0,
        caloriesBurned: 0,
        targetCalories: 2000,
        waterIntake: 0,
        targetWater: 3,
        protein: 0,
        carbs: 0,
        fats: 0,
        targetProtein: 0, // ✅ Added default target macros
        targetCarbs: 0,
        targetFats: 0,
        workoutsCompleted: 0,
        totalWorkouts: 1,
        mealsCompleted: 0,
        totalMeals: 1,
        currentStreak: 0,
        longestStreak: 0,
        weightProgress: 0,
        bodyFatProgress: 0
      };
    }
  }

  // Get date range based on period
  private getDateRange(
    period: 'daily' | 'weekly' | 'monthly',
    workoutPlan: WorkoutPlan | null,
    dietPlan: DietPlan | null,
    selectedWeek?: number,
    selectedMonth?: number
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    const planStartDate = workoutPlan?.startDate 
      ? new Date(workoutPlan.startDate) 
      : dietPlan?.startDate 
        ? new Date(dietPlan.startDate) 
        : new Date();

    switch (period) {
      case 'daily':
        // Show today's data only
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case 'weekly':
        // Calculate current week or selected week
        const currentWeek = selectedWeek || this.getCurrentWeekNumber(planStartDate, now);
        
        // Calculate week start based on plan start date
        // First week: from generation day to Sunday (inclusive)
        // Subsequent weeks: Monday to Sunday
        const startDayOfWeek = planStartDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        if (currentWeek === 1) {
          // First week starts from plan generation day
          startDate = new Date(planStartDate);
          startDate.setHours(0, 0, 0, 0);
          
          // End on Sunday
          endDate = new Date(planStartDate);
          const daysUntilSunday = startDayOfWeek === 0 ? 0 : 7 - startDayOfWeek;
          endDate.setDate(planStartDate.getDate() + daysUntilSunday);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Subsequent weeks: Monday to Sunday
          // Calculate first Sunday after plan start
          const firstSunday = new Date(planStartDate);
          const daysToFirstSunday = startDayOfWeek === 0 ? 0 : 7 - startDayOfWeek;
          firstSunday.setDate(planStartDate.getDate() + daysToFirstSunday);
          
          // Week 2 starts on the Monday after first Sunday
          startDate = new Date(firstSunday);
          startDate.setDate(firstSunday.getDate() + 1 + ((currentWeek - 2) * 7));
          startDate.setHours(0, 0, 0, 0);
          
          // End on Sunday
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
        
      case 'monthly':
        // Calculate current month or selected month
        const monthNumber = selectedMonth || this.getCurrentMonthNumber(planStartDate, now);
        
        // Month starts from plan month + offset
        startDate = new Date(planStartDate);
        startDate.setMonth(planStartDate.getMonth() + (monthNumber - 1));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(0); // Last day of month
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  }

  // Filter completion IDs by date range (extracts date from ID format: "YYYY-MM-DD-name")
  // ✅ CRITICAL: Parse dates as local dates to avoid timezone issues
  private filterCompletionsByDateRange(
    completionIds: string[],
    startDate: Date,
    endDate: Date
  ): string[] {
    return completionIds.filter(id => {
      // Extract date from ID (format: "YYYY-MM-DD-...")
      const dateMatch = id.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return false;
      
      // ✅ CRITICAL: Parse date as local date to avoid timezone issues
      const [year, month, day] = dateMatch[1].split('-').map(Number);
      const itemDate = new Date(year, month - 1, day);
      itemDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      // Normalize start and end dates for comparison
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return itemDate >= start && itemDate <= end;
    });
  }

  // Filter water data by date range
  // ✅ CRITICAL: Check both waterIntake and waterCompleted to ensure completed water is included
  private filterWaterByDateRange(
    waterIntake: { [key: string]: number },
    waterCompleted: { [key: string]: boolean },
    startDate: Date,
    endDate: Date
  ): { intake: { [key: string]: number }; completed: { [key: string]: boolean } } {
    const filteredIntake: { [key: string]: number } = {};
    const filteredCompleted: { [key: string]: boolean } = {};
    
    // ✅ CRITICAL: Check all dates from both waterIntake and waterCompleted
    const allDates = new Set([
      ...Object.keys(waterIntake),
      ...Object.keys(waterCompleted)
    ]);
    
    for (const dateStr of allDates) {
      // Parse date string (format: YYYY-MM-DD) as local date
      const [year, month, day] = dateStr.split('-').map(Number);
      const waterDate = new Date(year, month - 1, day);
      waterDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      // Normalize startDate and endDate to noon for comparison
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(12, 0, 0, 0);
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(12, 0, 0, 0);
      
      if (waterDate >= normalizedStartDate && waterDate <= normalizedEndDate) {
        // Include intake if available
        if (waterIntake[dateStr] !== undefined) {
          filteredIntake[dateStr] = waterIntake[dateStr];
        }
        // Include completion status if available
        if (waterCompleted[dateStr] !== undefined) {
          filteredCompleted[dateStr] = waterCompleted[dateStr];
        }
      }
    }
    
    return { intake: filteredIntake, completed: filteredCompleted };
  }

  // Get meal data from meal ID
  // ✅ CRITICAL: Improved date matching to handle both exact dates and day-of-week patterns
  private getMealDataFromId(mealId: string, dietPlan: DietPlan): DietMeal | null {
    // Format: "YYYY-MM-DD-mealType-mealName" (mealName may contain hyphens)
    // Use regex to extract date and mealType, then get mealName from the rest
    const dateMatch = mealId.match(/^(\d{4}-\d{2}-\d{2})-(breakfast|lunch|dinner|snack)-(.+)$/);
    if (!dateMatch) return null;
    
    const dateStr = dateMatch[1];
    const mealType = dateMatch[2] as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    const mealName = dateMatch[3];
    
    // ✅ CRITICAL: Parse date as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const mealDate = new Date(year, month - 1, day);
    const dayOfWeek = mealDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Strategy 1: Try exact date match first
    for (const planDay of dietPlan.weeklyPlan) {
      if (planDay.date === dateStr) {
        if (mealType === 'breakfast') return planDay.meals.breakfast;
        if (mealType === 'lunch') return planDay.meals.lunch;
        if (mealType === 'dinner') return planDay.meals.dinner;
        if (mealType === 'snack') {
          // Find matching snack by name
          const snack = planDay.meals.snacks.find(s => s.name === mealName);
          if (snack) return snack;
          // Fallback to first snack if name doesn't match (for backwards compatibility)
          return planDay.meals.snacks[0] || null;
        }
      }
    }
    
    // Strategy 2: Match by day of week (diet plan: Sunday=0, Monday=1, etc.)
    // The weeklyPlan array is indexed by day of week: [0]=Sunday, [1]=Monday, etc.
    if (dayOfWeek < dietPlan.weeklyPlan.length) {
      const planDay = dietPlan.weeklyPlan[dayOfWeek];
      if (planDay) {
        if (mealType === 'breakfast') return planDay.meals.breakfast;
        if (mealType === 'lunch') return planDay.meals.lunch;
        if (mealType === 'dinner') return planDay.meals.dinner;
        if (mealType === 'snack') {
          // Find matching snack by name
          const snack = planDay.meals.snacks.find(s => s.name === mealName);
          if (snack) return snack;
          // Fallback to first snack if name doesn't match
          return planDay.meals.snacks[0] || null;
        }
      }
    }
    
    // Strategy 3: Try to match by parsing plan day dates (fallback)
    try {
      for (const planDay of dietPlan.weeklyPlan) {
        if (!planDay.date) continue;
        
        // Parse plan day date as local date
        const [planYear, planMonth, planDayNumber] = planDay.date.split('-').map(Number);
        const planDate = new Date(planYear, planMonth - 1, planDayNumber);
        
        if (planDate.getDay() === dayOfWeek) {
          if (mealType === 'breakfast') return planDay.meals.breakfast;
          if (mealType === 'lunch') return planDay.meals.lunch;
          if (mealType === 'dinner') return planDay.meals.dinner;
          if (mealType === 'snack') {
            const snack = planDay.meals.snacks.find((s: DietMeal) => s.name === mealName);
            if (snack) return snack;
            return planDay.meals.snacks[0] || null;
          }
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Error matching meal by plan day date:', error);
      }
    }
    
    return null;
  }

  // Get exercise data from exercise ID
  private getExerciseDataFromId(exerciseId: string, workoutPlan: WorkoutPlan): WorkoutExercise | null {
    // Format: "YYYY-MM-DD-exerciseName"
    const parts = exerciseId.split('-');
    if (parts.length < 4) return null;
    
    const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const exerciseName = parts.slice(3).join('-');
    
    // Find the day in the weekly plan
    for (const day of workoutPlan.weeklyPlan) {
      if (day.date === dateStr) {
        return day.exercises.find(e => e.name === exerciseName) || null;
      }
    }
    
    // If exact date not found, try to match by day of week pattern
    const exerciseDate = new Date(dateStr);
    const dayOfWeek = exerciseDate.getDay();
    
    // Map: Sunday(0)->6, Monday(1)->0, etc. for workout plan (Mon=0, Tue=1, ..., Sun=6)
    const planDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    if (planDayIndex < workoutPlan.weeklyPlan.length) {
      const day = workoutPlan.weeklyPlan[planDayIndex];
      return day.exercises.find(e => e.name === exerciseName) || null;
    }
    
    return null;
  }

  // Estimate calories burned for an exercise
  private estimateCaloriesBurned(exercise: WorkoutExercise): number {
    const name = (exercise.name || '').toLowerCase();
    let caloriesPerSet = 10;

    if (name.includes('squat') || name.includes('deadlift') || name.includes('lunge')) {
      caloriesPerSet = 15;
    } else if (name.includes('push') || name.includes('press') || name.includes('row')) {
      caloriesPerSet = 12;
    } else if (name.includes('plank') || name.includes('core')) {
      caloriesPerSet = 8;
    } else if (name.includes('curl') || name.includes('extension')) {
      caloriesPerSet = 7;
    } else if (name.includes('cardio') || name.includes('run') || name.includes('jump')) {
      caloriesPerSet = 20;
    }

    const sets = exercise.sets || 3;
    return caloriesPerSet * sets;
  }

  // Calculate period totals
  private calculatePeriodTotals(
    period: 'daily' | 'weekly' | 'monthly',
    workoutPlan: WorkoutPlan | null,
    dietPlan: DietPlan | null,
    startDate: Date,
    endDate: Date
  ): { totalWorkouts: number; totalMeals: number; targetCalories: number; targetWater: number; targetProtein: number; targetCarbs: number; targetFats: number } {
    let totalWorkouts = 0;
    let totalMeals = 0;
    let targetCalories = 0;
    let targetWater = 3; // Default 3L per day
    let targetProtein = 0;
    let targetCarbs = 0;
    let targetFats = 0;

    // Calculate number of days in the period
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    if (period === 'daily') {
      // ✅ FIXED: Daily - Find actual day in plan based on date, not just day of week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Format today's date as YYYY-MM-DD
      const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Find today's workout day by matching date
      if (workoutPlan) {
        // ✅ CRITICAL: Map day of week to workout plan index
        // JavaScript Date.getDay(): Sunday=0, Monday=1, ..., Saturday=6
        // Workout plan: Monday=0, Tuesday=1, ..., Sunday=6
        const dayOfWeek = today.getDay();
      const workoutPlanIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        if (workoutPlanIndex < workoutPlan.weeklyPlan.length) {
        const todayWorkout = workoutPlan.weeklyPlan[workoutPlanIndex];
          // ✅ CRITICAL: Sunday (index 6) should be rest day - ensure totalWorkouts is 0
          if (todayWorkout.isRestDay || (dayOfWeek === 0 && todayWorkout.exercises?.length === 0)) {
            totalWorkouts = 0;
          } else {
            totalWorkouts = todayWorkout.exercises?.length || 0;
          }
        }
      }
      
      // Find today's diet day by matching date
      if (dietPlan) {
        // Try to find exact date match first
        const todayDietDay = dietPlan.weeklyPlan.find(day => day.date === todayDateStr);
        
        if (todayDietDay) {
          // Found exact date match
          totalMeals = 3 + (todayDietDay.meals?.snacks?.length || 0);
          targetCalories = todayDietDay.totalCalories || dietPlan.targetCalories || 2000;
          // ✅ CRITICAL: Parse water intake string to ml, then convert to liters
          targetWater = todayDietDay.waterIntake ? (this.parseWaterIntakeToMl(todayDietDay.waterIntake) / 1000) : 3;
          // ✅ Calculate target macros from today's actual planned meals (ensures 100% when all meals completed)
          const macros = this.calculateDietDayMacros(todayDietDay);
          targetProtein = macros.protein || dietPlan.targetProtein || 0;
          targetCarbs = macros.carbs || dietPlan.targetCarbs || 0;
          targetFats = macros.fats || dietPlan.targetFats || 0;
        } else {
          // Fallback to day of week matching
          const dayOfWeek = today.getDay();
          if (dayOfWeek < dietPlan.weeklyPlan.length) {
            const todayDiet = dietPlan.weeklyPlan[dayOfWeek];
            totalMeals = 3 + (todayDiet.meals?.snacks?.length || 0);
            targetCalories = todayDiet.totalCalories || dietPlan.targetCalories || 2000;
            // ✅ CRITICAL: Parse water intake string to ml, then convert to liters
            targetWater = todayDiet.waterIntake ? (this.parseWaterIntakeToMl(todayDiet.waterIntake) / 1000) : 3;
            // ✅ Calculate target macros from today's actual planned meals
            const macros = this.calculateDietDayMacros(todayDiet);
            targetProtein = macros.protein || dietPlan.targetProtein || 0;
            targetCarbs = macros.carbs || dietPlan.targetCarbs || 0;
            targetFats = macros.fats || dietPlan.targetFats || 0;
          }
        }
      } else {
        targetWater = 3; // Default if no diet plan
      }
      
      // ✅ Safety check: Ensure targetWater is never NaN
      if (!targetWater || isNaN(targetWater) || targetWater <= 0) {
        targetWater = 3; // Fallback to default 3L
      }
    } else if (period === 'weekly') {
      // ✅ FIXED: Weekly - Count only days within the date range
      if (workoutPlan) {
        totalWorkouts = 0;
        // Iterate through each day in the date range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          const dayOfWeek = currentDate.getDay();
          const workoutPlanIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          
          if (workoutPlanIndex < workoutPlan.weeklyPlan.length) {
            const dayPlan = workoutPlan.weeklyPlan[workoutPlanIndex];
            if (!dayPlan.isRestDay && dayPlan.exercises) {
              totalWorkouts += dayPlan.exercises.length;
            }
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      if (dietPlan) {
        totalMeals = 0;
        let totalTargetCalories = 0;
        let totalTargetWater = 0;
        let totalTargetProtein = 0;
        let totalTargetCarbs = 0;
        let totalTargetFats = 0;
        
        // Iterate through each day in the date range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          
          // Try to find exact date match first
          const dietDay = dietPlan.weeklyPlan.find(day => day.date === dateStr);
          
          if (dietDay) {
            totalMeals += 3 + (dietDay.meals?.snacks?.length || 0);
            totalTargetCalories += dietDay.totalCalories || dietPlan.targetCalories || 2000;
            // ✅ CRITICAL: Parse water intake string to ml, then convert to liters
            totalTargetWater += dietDay.waterIntake ? (this.parseWaterIntakeToMl(dietDay.waterIntake) / 1000) : 3;
            // ✅ Sum target macros for each day in the weekly period using actual planned meals
            const macros = this.calculateDietDayMacros(dietDay);
            totalTargetProtein += macros.protein || dietPlan.targetProtein || 0;
            totalTargetCarbs += macros.carbs || dietPlan.targetCarbs || 0;
            totalTargetFats += macros.fats || dietPlan.targetFats || 0;
          } else {
            // Fallback to day of week matching
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek < dietPlan.weeklyPlan.length) {
              const dayPlan = dietPlan.weeklyPlan[dayOfWeek];
              totalMeals += 3 + (dayPlan.meals?.snacks?.length || 0);
              totalTargetCalories += dayPlan.totalCalories || dietPlan.targetCalories || 2000;
              // ✅ CRITICAL: Parse water intake string to ml, then convert to liters
              totalTargetWater += dayPlan.waterIntake ? (this.parseWaterIntakeToMl(dayPlan.waterIntake) / 1000) : 3;
              // ✅ Sum target macros for each day in the weekly period using actual planned meals
              const macros = this.calculateDietDayMacros(dayPlan);
              totalTargetProtein += macros.protein || dietPlan.targetProtein || 0;
              totalTargetCarbs += macros.carbs || dietPlan.targetCarbs || 0;
              totalTargetFats += macros.fats || dietPlan.targetFats || 0;
            }
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        targetCalories = totalTargetCalories > 0 ? totalTargetCalories : ((dietPlan.targetCalories || 2000) * daysDiff);
        // ✅ FIXED: Ensure targetWater is always a valid number, not NaN
        targetWater = totalTargetWater > 0 ? totalTargetWater : (3 * daysDiff); // Sum of daily targets or 3L x days
        // ✅ FIXED: Calculate target macros for the weekly period (daily target × days in week)
        targetProtein = totalTargetProtein > 0 ? totalTargetProtein : ((dietPlan.targetProtein || 0) * daysDiff);
        targetCarbs = totalTargetCarbs > 0 ? totalTargetCarbs : ((dietPlan.targetCarbs || 0) * daysDiff);
        targetFats = totalTargetFats > 0 ? totalTargetFats : ((dietPlan.targetFats || 0) * daysDiff);
      } else {
        targetWater = 3 * daysDiff; // Default 3L x days in range
      }
      
      // ✅ Safety check: Ensure targetWater is never NaN or 0
      if (!targetWater || isNaN(targetWater) || targetWater <= 0) {
        targetWater = 3 * daysDiff; // Fallback to default
      }
    } else if (period === 'monthly') {
      // ✅ FIXED: Monthly - Count only days within the date range
      if (workoutPlan) {
        totalWorkouts = 0;
        // Iterate through each day in the date range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          const dayOfWeek = currentDate.getDay();
          const workoutPlanIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          
          if (workoutPlanIndex < workoutPlan.weeklyPlan.length) {
            const dayPlan = workoutPlan.weeklyPlan[workoutPlanIndex];
            if (!dayPlan.isRestDay && dayPlan.exercises) {
              totalWorkouts += dayPlan.exercises.length;
            }
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      if (dietPlan) {
        totalMeals = 0;
        let totalTargetCalories = 0;
        let totalTargetWater = 0;
        let totalTargetProtein = 0;
        let totalTargetCarbs = 0;
        let totalTargetFats = 0;
        
        // Iterate through each day in the date range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
          
          // Try to find exact date match first
          const dietDay = dietPlan.weeklyPlan.find(day => day.date === dateStr);
          
          if (dietDay) {
            totalMeals += 3 + (dietDay.meals?.snacks?.length || 0);
            totalTargetCalories += dietDay.totalCalories || dietPlan.targetCalories || 2000;
            // ✅ CRITICAL: Parse water intake string to ml, then convert to liters
            totalTargetWater += dietDay.waterIntake ? (this.parseWaterIntakeToMl(dietDay.waterIntake) / 1000) : 3;
            // ✅ Sum target macros for each day in the period using actual planned meals
            const macros = this.calculateDietDayMacros(dietDay);
            totalTargetProtein += macros.protein || dietPlan.targetProtein || 0;
            totalTargetCarbs += macros.carbs || dietPlan.targetCarbs || 0;
            totalTargetFats += macros.fats || dietPlan.targetFats || 0;
          } else {
            // Fallback to day of week matching
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek < dietPlan.weeklyPlan.length) {
              const dayPlan = dietPlan.weeklyPlan[dayOfWeek];
              totalMeals += 3 + (dayPlan.meals?.snacks?.length || 0);
              totalTargetCalories += dayPlan.totalCalories || dietPlan.targetCalories || 2000;
              // ✅ CRITICAL: Parse water intake string to ml, then convert to liters
              totalTargetWater += dayPlan.waterIntake ? (this.parseWaterIntakeToMl(dayPlan.waterIntake) / 1000) : 3;
              // ✅ Sum target macros for each day in the period using actual planned meals
              const macros = this.calculateDietDayMacros(dayPlan);
              totalTargetProtein += macros.protein || dietPlan.targetProtein || 0;
              totalTargetCarbs += macros.carbs || dietPlan.targetCarbs || 0;
              totalTargetFats += macros.fats || dietPlan.targetFats || 0;
            }
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        targetCalories = totalTargetCalories > 0 ? totalTargetCalories : ((dietPlan.targetCalories || 2000) * daysDiff);
        // ✅ FIXED: Ensure targetWater is always a valid number, not NaN
        targetWater = totalTargetWater > 0 ? totalTargetWater : (3 * daysDiff); // Sum of daily targets or 3L x days
        // ✅ Calculate target macros for the period (daily target × days)
        targetProtein = totalTargetProtein > 0 ? totalTargetProtein : ((dietPlan.targetProtein || 0) * daysDiff);
        targetCarbs = totalTargetCarbs > 0 ? totalTargetCarbs : ((dietPlan.targetCarbs || 0) * daysDiff);
        targetFats = totalTargetFats > 0 ? totalTargetFats : ((dietPlan.targetFats || 0) * daysDiff);
      } else {
        targetWater = 3 * daysDiff; // Default 3L x days in range
      }
      
      // ✅ Safety check: Ensure targetWater is never NaN or 0
      if (!targetWater || isNaN(targetWater) || targetWater <= 0) {
        targetWater = 3 * daysDiff; // Fallback to default
      }
    }

    // ✅ Final safety check: Ensure all return values are valid numbers (never NaN)
    const safeTargetWater = (targetWater && !isNaN(targetWater) && targetWater > 0) ? targetWater : 3;
    const safeDaysDiff = (daysDiff && !isNaN(daysDiff) && daysDiff > 0) ? daysDiff : 1;
    
    return { 
      totalWorkouts: Math.max(0, totalWorkouts || 0), 
      totalMeals: Math.max(0, totalMeals || 0), 
      targetCalories: Math.max(0, (targetCalories && !isNaN(targetCalories)) ? targetCalories : 2000),
      targetWater: safeTargetWater > 0 ? safeTargetWater : (3 * safeDaysDiff), // Ensure minimum 3L default
      targetProtein: Math.max(0, (targetProtein && !isNaN(targetProtein)) ? targetProtein : 0),
      targetCarbs: Math.max(0, (targetCarbs && !isNaN(targetCarbs)) ? targetCarbs : 0),
      targetFats: Math.max(0, (targetFats && !isNaN(targetFats)) ? targetFats : 0)
    };
  }

  // Calculate current week number from plan start date
  private getCurrentWeekNumber(planStartDate: Date, currentDate: Date): number {
    planStartDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 1;
    if (daysDiff === 0) return 1;
    
    const startDayOfWeek = planStartDate.getDay();
    const daysInFirstWeek = startDayOfWeek === 0 ? 1 : (7 - startDayOfWeek);
    
    if (daysDiff < daysInFirstWeek) return 1;
    
    const remainingDays = daysDiff - daysInFirstWeek;
    return 1 + Math.floor(remainingDays / 7) + 1;
  }

  // Calculate current month number from plan start date
  private getCurrentMonthNumber(planStartDate: Date, currentDate: Date): number {
    const diffMonths = (currentDate.getFullYear() - planStartDate.getFullYear()) * 12 + 
                      (currentDate.getMonth() - planStartDate.getMonth());
    return Math.max(diffMonths + 1, 1);
  }

  // Get chart data for visualization
  async getChartData(
    period: 'daily' | 'weekly' | 'monthly',
    selectedWeek?: number,
    selectedMonth?: number,
    forceRefresh = false
  ): Promise<ProgressServiceResponse<{
    calories: ChartData;
    macros: ChartData;
    workouts: ChartData;
    water: ChartData;
  }>> {
    try {
      // PERFORMANCE: Check cache first (unless forcing refresh)
      const cacheKey = await this.getCacheKey(period, selectedWeek, selectedMonth);
      if (!forceRefresh) {
        const cached = this.chartsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
          return {
            success: true,
            message: 'Chart data from cache',
            data: cached.data
          };
        }
      }
      
      // OPTIMIZATION: Load real data for charts using cached data unless forcing refresh
      const workoutPlan = forceRefresh
        ? await aiWorkoutService.refreshWorkoutPlanFromDatabase()
        : await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = forceRefresh
        ? await aiDietService.refreshDietPlanFromDatabase()
        : await aiDietService.loadDietPlanFromDatabase();
      
      const exerciseCompletionData = exerciseCompletionService.getCompletionData();
      const mealCompletionData = mealCompletionService.getCompletionData();
      
      // ✅ CRITICAL: Generate labels based on plan weeks/months and selected filters
      // Labels must match the data points exactly
      const labels = this.generateLabels(period, workoutPlan, dietPlan, selectedWeek, selectedMonth);
      const dataPoints = labels.length; // ✅ CRITICAL: Use label count to ensure data matches labels

      // Generate data based on actual completions and selected filters
      const caloriesData = await this.generateCaloriesChartData(
        period,
        dataPoints,
        dietPlan,
        mealCompletionData.completedMeals,
        selectedWeek,
        selectedMonth
      );
      const workoutData = await this.generateWorkoutChartData(
        period,
        dataPoints,
        workoutPlan,
        exerciseCompletionData.completedExercises,
        selectedWeek,
        selectedMonth
      );
      const waterData = await this.generateWaterChartData(
        period,
        dataPoints,
        workoutPlan,
        dietPlan,
        selectedWeek,
        selectedMonth
      );
      const macroData = await this.generateMacroChartData(
        period,
        dataPoints,
        dietPlan,
        mealCompletionData.completedMeals,
        selectedWeek,
        selectedMonth
      );

      const chartData = {
        calories: {
          labels,
          datasets: [{
            data: caloriesData,
            color: '#3B82F6',
            strokeWidth: 2
          }]
        },
        macros: {
          labels,
          datasets: [{
            data: macroData,
            color: '#10B981',
            strokeWidth: 2
          }]
        },
        workouts: {
          labels,
          datasets: [{
            data: workoutData,
            color: '#F59E0B',
            strokeWidth: 2
          }]
        },
        water: {
          labels,
          datasets: [{
            data: waterData,
            color: '#06B6D4',
            strokeWidth: 2
          }]
        }
      };

      // PERFORMANCE: Cache the result
      this.chartsCache.set(cacheKey, {
        data: chartData,
        timestamp: Date.now()
      });

      return {
        success: true,
        message: 'Chart data generated successfully',
        data: chartData
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to load chart data'
      };
    }
  }

  // Generate calories chart data based on actual completions - aligned with plan weeks/months
  private async generateCaloriesChartData(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    dietPlan: DietPlan | null,
    completedMeals: string[],
    selectedWeek?: number,
    selectedMonth?: number
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (period === 'daily') {
      // ✅ Daily: single data point for TODAY only
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      if (dietPlan && dietPlan.startDate) {
        const filtered = this.filterCompletionsByDateRange(completedMeals, startDate, endDate);
        let calories = 0;
        for (const mealId of filtered) {
          const meal = this.getMealDataFromId(mealId, dietPlan);
          if (meal && meal.calories) {
            calories += meal.calories;
          }
        }
        data.push(Math.round(calories));
      } else {
        // Fallback when no diet plan: rough estimate based on count
        const filtered = this.filterCompletionsByDateRange(completedMeals, startDate, endDate);
        data.push(filtered.length * 100);
      }

      return data;
    }

    if (!dietPlan || !dietPlan.startDate) {
      // Fallback: use calendar-based calculation
      return this.generateCaloriesChartDataFallback(period, dataPoints, completedMeals);
    }
    
    const planStartDate = new Date(dietPlan.startDate);
    planStartDate.setHours(0, 0, 0, 0);
    const currentWeek = this.getCurrentWeekNumber(planStartDate, now);
    const currentMonth = this.getCurrentMonthNumber(planStartDate, now);

    // Use selected week/month if provided, otherwise fall back to current
    const baseWeek = selectedWeek || currentWeek;
    const baseMonth = selectedMonth || currentMonth;
    
    // Calculate which weeks/months to show (matching the labels)
    let weeksToShow: number[] = [];
    let monthsToShow: number[] = [];
    
    if (period === 'weekly') {
      const weeksToDisplay = Math.min(dataPoints, baseWeek);
      const startWeek = Math.max(1, baseWeek - weeksToDisplay + 1);
      for (let week = startWeek; week <= baseWeek; week++) {
        weeksToShow.push(week);
      }
    } else if (period === 'monthly') {
      const monthsToDisplay = Math.min(dataPoints, baseMonth);
      const startMonth = Math.max(1, baseMonth - monthsToDisplay + 1);
      for (let month = startMonth; month <= baseMonth; month++) {
        monthsToShow.push(month);
      }
    }
    
    for (let i = 0; i < dataPoints; i++) {
      let startDate: Date;
      let endDate: Date;
      
      if (period === 'weekly') {
        // Weekly: Use plan week numbers
        if (i >= weeksToShow.length) break;
        const weekNumber = weeksToShow[i];
        const weekRange = this.getWeekDateRange(planStartDate, weekNumber);
        startDate = weekRange.startDate;
        endDate = weekRange.endDate;
      } else {
        // Monthly: Use plan month numbers
        if (i >= monthsToShow.length) break;
        const monthNumber = monthsToShow[i];
        const monthRange = this.getMonthDateRange(planStartDate, monthNumber);
        startDate = monthRange.startDate;
        endDate = monthRange.endDate;
      }
      
      const filtered = this.filterCompletionsByDateRange(completedMeals, startDate, endDate);
      let calories = 0;
      
      for (const mealId of filtered) {
        const meal = this.getMealDataFromId(mealId, dietPlan);
        if (meal && meal.calories) {
          calories += meal.calories;
        }
      }
      
      data.push(Math.round(calories));
    }
    
    return data;
  }
  
  // Fallback method for calendar-based calculation (when plan is not available)
  private async generateCaloriesChartDataFallback(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    completedMeals: string[]
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'daily') {
        startDate.setDate(now.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'weekly') {
        const currentDayOfWeek = now.getDay();
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        const currentWeekMonday = new Date(now);
        currentWeekMonday.setDate(now.getDate() - daysFromMonday);
        currentWeekMonday.setHours(0, 0, 0, 0);
        startDate = new Date(currentWeekMonday);
        startDate.setDate(currentWeekMonday.getDate() - (i * 7));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      const filtered = this.filterCompletionsByDateRange(completedMeals, startDate, endDate);
      data.push(filtered.length * 100); // Rough estimate
    }
    
    return data;
  }
  
  // Get date range for a specific plan week number
  private getWeekDateRange(planStartDate: Date, weekNumber: number): { startDate: Date; endDate: Date } {
    const startDayOfWeek = planStartDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (weekNumber === 1) {
      // First week starts from plan generation day
      const startDate = new Date(planStartDate);
      startDate.setHours(0, 0, 0, 0);
      
      // End on Sunday
      const endDate = new Date(planStartDate);
      const daysUntilSunday = startDayOfWeek === 0 ? 0 : 7 - startDayOfWeek;
      endDate.setDate(planStartDate.getDate() + daysUntilSunday);
      endDate.setHours(23, 59, 59, 999);
      
      return { startDate, endDate };
    } else {
      // Subsequent weeks: Monday to Sunday
      const firstSunday = new Date(planStartDate);
      const daysToFirstSunday = startDayOfWeek === 0 ? 0 : 7 - startDayOfWeek;
      firstSunday.setDate(planStartDate.getDate() + daysToFirstSunday);
      
      // Week 2 starts on the Monday after first Sunday
      const startDate = new Date(firstSunday);
      startDate.setDate(firstSunday.getDate() + 1 + ((weekNumber - 2) * 7));
      startDate.setHours(0, 0, 0, 0);
      
      // End on Sunday
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      
      return { startDate, endDate };
    }
  }
  
  // Get date range for a specific plan month number
  private getMonthDateRange(planStartDate: Date, monthNumber: number): { startDate: Date; endDate: Date } {
    const startDate = new Date(planStartDate);
    startDate.setMonth(planStartDate.getMonth() + (monthNumber - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);
    endDate.setDate(0); // Last day of month
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  }

  // Generate workout chart data - ✅ CRITICAL: Use plan-based date ranges for accurate data
  private async generateWorkoutChartData(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    workoutPlan: WorkoutPlan | null,
    completedExercises: string[],
    selectedWeek?: number,
    selectedMonth?: number
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (period === 'daily') {
      // ✅ Daily: single data point for TODAY only
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const filtered = this.filterCompletionsByDateRange(completedExercises, startDate, endDate);
      data.push(filtered.length);
      return data;
    }

    if (!workoutPlan || !workoutPlan.startDate) {
      // Fallback: use calendar-based calculation
      return this.generateWorkoutChartDataFallback(period, dataPoints, completedExercises);
    }
    
      const planStartDate = new Date(workoutPlan.startDate);
      planStartDate.setHours(0, 0, 0, 0);
      const currentWeek = this.getCurrentWeekNumber(planStartDate, now);
      const currentMonth = this.getCurrentMonthNumber(planStartDate, now);

    // Use selected week/month if provided, otherwise fall back to current
    const baseWeek = selectedWeek || currentWeek;
    const baseMonth = selectedMonth || currentMonth;
    
    // Calculate which weeks/months to show (matching the labels)
    let weeksToShow: number[] = [];
    let monthsToShow: number[] = [];
    
    if (period === 'weekly') {
      const weeksToDisplay = Math.min(dataPoints, baseWeek);
      const startWeek = Math.max(1, baseWeek - weeksToDisplay + 1);
      for (let week = startWeek; week <= baseWeek; week++) {
        weeksToShow.push(week);
      }
    } else if (period === 'monthly') {
      const monthsToDisplay = Math.min(dataPoints, baseMonth);
      const startMonth = Math.max(1, baseMonth - monthsToDisplay + 1);
      for (let month = startMonth; month <= baseMonth; month++) {
        monthsToShow.push(month);
      }
    }
    
    for (let i = 0; i < dataPoints; i++) {
      let startDate: Date;
      let endDate: Date;
      
      if (period === 'weekly') {
        // ✅ CRITICAL: Use plan week numbers and date ranges
        if (i >= weeksToShow.length) break;
        const weekNumber = weeksToShow[i];
        const weekRange = this.getWeekDateRange(planStartDate, weekNumber);
        startDate = weekRange.startDate;
        endDate = weekRange.endDate;
      } else {
        // ✅ CRITICAL: Use plan month numbers and date ranges
        if (i >= monthsToShow.length) break;
        const monthNumber = monthsToShow[i];
        const monthRange = this.getMonthDateRange(planStartDate, monthNumber);
        startDate = monthRange.startDate;
        endDate = monthRange.endDate;
      }

      const filtered = this.filterCompletionsByDateRange(completedExercises, startDate, endDate);
      data.push(filtered.length);
    }
    
      return data;
    }
  
  // Fallback method for calendar-based calculation (when plan is not available)
  private async generateWorkoutChartDataFallback(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    completedExercises: string[]
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'daily') {
        startDate.setDate(now.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'weekly') {
        const currentDayOfWeek = now.getDay();
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        const currentWeekMonday = new Date(now);
        currentWeekMonday.setDate(now.getDate() - daysFromMonday);
        currentWeekMonday.setHours(0, 0, 0, 0);
        startDate = new Date(currentWeekMonday);
        startDate.setDate(currentWeekMonday.getDate() - (i * 7));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      const filtered = this.filterCompletionsByDateRange(completedExercises, startDate, endDate);
      data.push(filtered.length);
    }
    
    return data;
  }

  // Generate water chart data - ✅ CRITICAL: Use plan-based date ranges and account-specific data
  private async generateWaterChartData(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    workoutPlan: WorkoutPlan | null,
    dietPlan: DietPlan | null,
    selectedWeek?: number,
    selectedMonth?: number
  ): Promise<number[]> {
    // ✅ CRITICAL: Use user-specific cache keys for account-specific data
    const userId = await getCurrentUserId();
    const waterIntakeKey = userId ? await getUserCacheKey('water_intake', userId) : 'water_intake';
    const waterCompletedKey = userId ? await getUserCacheKey('water_completed', userId) : 'water_completed';
    const waterIntakeData = await Storage.getItem(waterIntakeKey) || '{}';
    const waterCompletedData = await Storage.getItem(waterCompletedKey) || '{}';
    const waterData = JSON.parse(waterIntakeData);
    const waterCompleted = JSON.parse(waterCompletedData);
    
    const data: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (period === 'daily') {
      // ✅ Daily: single data point for TODAY only
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const filtered = this.filterWaterByDateRange(waterData, waterCompleted, startDate, endDate);
      let water = 0;
      
      // ✅ CRITICAL: Check all dates from both intake and completed
      const allWaterDates = new Set([
        ...Object.keys(filtered.intake),
        ...Object.keys(filtered.completed)
      ]);
      
      for (const date of allWaterDates) {
        if (filtered.completed[date]) {
          // Get target water from diet plan for this specific date
          let dietPlanDay = dietPlan?.weeklyPlan.find(day => day.date === date);
          if (!dietPlanDay && dietPlan) {
            const [year, month, day] = date.split('-').map(Number);
            const waterDate = new Date(year, month - 1, day);
            const dayOfWeek = waterDate.getDay();
            if (dayOfWeek < dietPlan.weeklyPlan.length) {
              dietPlanDay = dietPlan.weeklyPlan[dayOfWeek];
            }
          }
          const targetWater = dietPlanDay?.waterIntake ? this.parseWaterIntakeToMl(dietPlanDay.waterIntake) : 3000;
          water += targetWater;
        } else if (filtered.intake[date] !== undefined && Number(filtered.intake[date]) > 0) {
          water += Number(filtered.intake[date]) || 0;
        }
      }
      
      data.push(Math.round((water / 1000) * 10) / 10); // liters
      return data;
    }

    const planForRanges = workoutPlan || dietPlan;
    if (!planForRanges || !planForRanges.startDate) {
      // Fallback: use calendar-based calculation
      return this.generateWaterChartDataFallback(period, dataPoints, waterData, waterCompleted);
    }
    
    const planStartDate = new Date(planForRanges.startDate);
      planStartDate.setHours(0, 0, 0, 0);
      const currentWeek = this.getCurrentWeekNumber(planStartDate, now);
      const currentMonth = this.getCurrentMonthNumber(planStartDate, now);

    // Use selected week/month if provided, otherwise fall back to current
    const baseWeek = selectedWeek || currentWeek;
    const baseMonth = selectedMonth || currentMonth;
    
    // Calculate which weeks/months to show (matching the labels)
    let weeksToShow: number[] = [];
    let monthsToShow: number[] = [];
    
    if (period === 'weekly') {
      const weeksToDisplay = Math.min(dataPoints, baseWeek);
      const startWeek = Math.max(1, baseWeek - weeksToDisplay + 1);
      for (let week = startWeek; week <= baseWeek; week++) {
        weeksToShow.push(week);
      }
    } else if (period === 'monthly') {
      const monthsToDisplay = Math.min(dataPoints, baseMonth);
      const startMonth = Math.max(1, baseMonth - monthsToDisplay + 1);
      for (let month = startMonth; month <= baseMonth; month++) {
        monthsToShow.push(month);
      }
    }
    
    for (let i = 0; i < dataPoints; i++) {
      let startDate: Date;
      let endDate: Date;
      
      if (period === 'weekly') {
        // ✅ CRITICAL: Use plan week numbers and date ranges
        if (i >= weeksToShow.length) break;
        const weekNumber = weeksToShow[i];
        const weekRange = this.getWeekDateRange(planStartDate, weekNumber);
        startDate = weekRange.startDate;
        endDate = weekRange.endDate;
      } else {
        // ✅ CRITICAL: Use plan month numbers and date ranges
        if (i >= monthsToShow.length) break;
        const monthNumber = monthsToShow[i];
        const monthRange = this.getMonthDateRange(planStartDate, monthNumber);
        startDate = monthRange.startDate;
        endDate = monthRange.endDate;
      }

      const filtered = this.filterWaterByDateRange(waterData, waterCompleted, startDate, endDate);
      let water = 0;
      
      // ✅ CRITICAL: Check all dates from both intake and completed
      const allWaterDates = new Set([
        ...Object.keys(filtered.intake),
        ...Object.keys(filtered.completed)
      ]);
      
      for (const date of allWaterDates) {
        if (filtered.completed[date]) {
          // Get target water from diet plan for this specific date
          let dietPlanDay = dietPlan?.weeklyPlan.find(day => day.date === date);
          if (!dietPlanDay && dietPlan) {
            const [year, month, day] = date.split('-').map(Number);
            const waterDate = new Date(year, month - 1, day);
            const dayOfWeek = waterDate.getDay();
            if (dayOfWeek < dietPlan.weeklyPlan.length) {
              dietPlanDay = dietPlan.weeklyPlan[dayOfWeek];
            }
          }
          const targetWater = dietPlanDay?.waterIntake ? this.parseWaterIntakeToMl(dietPlanDay.waterIntake) : 3000;
          water += targetWater;
        } else if (filtered.intake[date] !== undefined && Number(filtered.intake[date]) > 0) {
          water += Number(filtered.intake[date]) || 0;
        }
      }
      
      data.push(Math.round((water / 1000) * 10) / 10); // Convert to liters
    }
    
      return data;
    }
  
  // Fallback method for calendar-based calculation (when plan is not available)
  private async generateWaterChartDataFallback(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    waterData: { [key: string]: number },
    waterCompleted: { [key: string]: boolean }
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'daily') {
        startDate.setDate(now.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'weekly') {
        const currentDayOfWeek = now.getDay();
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        const currentWeekMonday = new Date(now);
        currentWeekMonday.setDate(now.getDate() - daysFromMonday);
        currentWeekMonday.setHours(0, 0, 0, 0);
        startDate = new Date(currentWeekMonday);
        startDate.setDate(currentWeekMonday.getDate() - (i * 7));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      const filtered = this.filterWaterByDateRange(waterData, waterCompleted, startDate, endDate);
      let water = 0;
      for (const [date, amount] of Object.entries(filtered.intake)) {
        if (filtered.completed[date]) {
          water += Number(amount) || 0;
        }
      }
      data.push(Math.round((water / 1000) * 10) / 10);
    }
    
    return data;
  }

  // Generate macro chart data (protein) - aligned with plan weeks/months
  private async generateMacroChartData(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    dietPlan: DietPlan | null,
    completedMeals: string[],
    selectedWeek?: number,
    selectedMonth?: number
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (period === 'daily') {
      // ✅ Daily: single data point for TODAY only (protein consumed today)
      if (!dietPlan || !dietPlan.startDate) {
        return [0];
      }

      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const filtered = this.filterCompletionsByDateRange(completedMeals, startDate, endDate);
      let protein = 0;
      for (const mealId of filtered) {
        const meal = this.getMealDataFromId(mealId, dietPlan);
        if (meal && meal.protein) {
          protein += meal.protein;
        }
      }
      data.push(Math.round(protein));
      return data;
    }

    if (!dietPlan || !dietPlan.startDate) {
      // Fallback: return zeros
      return new Array(dataPoints).fill(0);
    }
    
    const planStartDate = new Date(dietPlan.startDate);
    planStartDate.setHours(0, 0, 0, 0);
    const currentWeek = this.getCurrentWeekNumber(planStartDate, now);
    const currentMonth = this.getCurrentMonthNumber(planStartDate, now);

    // Use selected week/month if provided, otherwise fall back to current
    const baseWeek = selectedWeek || currentWeek;
    const baseMonth = selectedMonth || currentMonth;
    
    // Calculate which weeks/months to show (matching the labels)
    let weeksToShow: number[] = [];
    let monthsToShow: number[] = [];
    
    if (period === 'weekly') {
      const weeksToDisplay = Math.min(dataPoints, baseWeek);
      const startWeek = Math.max(1, baseWeek - weeksToDisplay + 1);
      for (let week = startWeek; week <= baseWeek; week++) {
        weeksToShow.push(week);
      }
    } else if (period === 'monthly') {
      const monthsToDisplay = Math.min(dataPoints, baseMonth);
      const startMonth = Math.max(1, baseMonth - monthsToDisplay + 1);
      for (let month = startMonth; month <= baseMonth; month++) {
        monthsToShow.push(month);
      }
    }
    
    for (let i = 0; i < dataPoints; i++) {
      let startDate: Date;
      let endDate: Date;
      
      if (period === 'weekly') {
        if (i >= weeksToShow.length) break;
        const weekNumber = weeksToShow[i];
        const weekRange = this.getWeekDateRange(planStartDate, weekNumber);
        startDate = weekRange.startDate;
        endDate = weekRange.endDate;
      } else {
        if (i >= monthsToShow.length) break;
        const monthNumber = monthsToShow[i];
        const monthRange = this.getMonthDateRange(planStartDate, monthNumber);
        startDate = monthRange.startDate;
        endDate = monthRange.endDate;
      }
      
      const filtered = this.filterCompletionsByDateRange(completedMeals, startDate, endDate);
      let protein = 0;
      
      for (const mealId of filtered) {
        const meal = this.getMealDataFromId(mealId, dietPlan);
        if (meal && meal.protein) {
          protein += meal.protein;
        }
      }
      
      data.push(Math.round(protein));
    }
    
    return data;
  }

  // Generate labels based on period - aligned with plan weeks/months
  private generateLabels(
    period: 'daily' | 'weekly' | 'monthly',
    workoutPlan: WorkoutPlan | null,
    dietPlan: DietPlan | null,
    selectedWeek?: number,
    selectedMonth?: number
  ): string[] {
    const labels: string[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (period) {
      case 'daily':
        // ✅ Daily: single label for TODAY only
        labels.push('Today');
        break;
      case 'weekly':
        // ✅ CRITICAL: Weekly labels based on plan week numbers - must match data points
        const planForWeeks = workoutPlan || dietPlan;
        if (planForWeeks && planForWeeks.startDate) {
          const planStartDate = new Date(planForWeeks.startDate);
          planStartDate.setHours(0, 0, 0, 0);
          
          // Calculate current / base week number
          const currentWeek = this.getCurrentWeekNumber(planStartDate, now);
          const baseWeek = selectedWeek || currentWeek;
          const totalWeeks = planForWeeks.totalWeeks || 12;
          
          // ✅ CRITICAL: Show weeks up to baseWeek (or all available weeks)
          // This ensures labels match the data points generated
          const weeksToShow = Math.min(4, baseWeek); // Show up to 4 weeks
          const startWeek = Math.max(1, baseWeek - weeksToShow + 1);
          
          for (let week = startWeek; week <= baseWeek; week++) {
            labels.push(`Week ${week}`);
          }
        } else {
          // Fallback: generic week labels
        for (let i = 3; i >= 0; i--) {
          labels.push(`Week ${4 - i}`);
          }
        }
        break;
      case 'monthly':
        // ✅ CRITICAL: Monthly labels based on plan months - must match data points
        const planForMonths = workoutPlan || dietPlan;
        if (planForMonths && planForMonths.startDate) {
          const planStartDate = new Date(planForMonths.startDate);
          planStartDate.setHours(0, 0, 0, 0);
          
          // Calculate current / base month number
          const currentMonth = this.getCurrentMonthNumber(planStartDate, now);
          const baseMonth = selectedMonth || currentMonth;
          const totalWeeks = planForMonths.totalWeeks || 12;
          const totalMonths = Math.ceil(totalWeeks / 4); // Approximate months
          
          // ✅ CRITICAL: Show months up to baseMonth (or all available months)
          // This ensures labels match the data points generated
          const monthsToShow = Math.min(6, baseMonth); // Show up to 6 months
          const startMonth = Math.max(1, baseMonth - monthsToShow + 1);
          
          for (let month = startMonth; month <= baseMonth; month++) {
            // Calculate the actual month date
            const monthDate = new Date(planStartDate);
            monthDate.setMonth(planStartDate.getMonth() + (month - 1));
            labels.push(monthDate.toLocaleDateString('en', { month: 'short', year: 'numeric' }));
          }
        } else {
          // Fallback: generic month labels
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
            labels.push(date.toLocaleDateString('en', { month: 'short', year: 'numeric' }));
          }
        }
        break;
    }

    return labels;
  }

  // Get AI-powered health remarks
  async getHealthRemarks(): Promise<ProgressServiceResponse<string[]>> {
    try {
      const defaultRemarks = [
        "Your consistency is the key to long-term success. Keep up the great work!",
        "Consider tracking your sleep quality to optimize recovery and performance.",
        "Meal timing can impact your energy levels - try eating 2-3 hours before workouts.",
        "Progressive overload in workouts will help you continue seeing improvements.",
        "Don't forget to include rest days in your routine for optimal recovery."
      ];

      return {
        success: true,
        message: 'Health remarks provided',
        data: defaultRemarks
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to load health remarks',
        data: []
      };
    }
  }

  // Get available weeks for filtering - uses cached data
  async getAvailableWeeks(forceRefresh = false): Promise<number[]> {
    try {
      // PERFORMANCE: Return cached result if available
      if (!forceRefresh && this.availableWeeksCache !== null) {
        return this.availableWeeksCache;
      }
      
      // OPTIMIZATION: Uses cached data by default - no unnecessary API calls
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = await aiDietService.loadDietPlanFromDatabase();
      
      const plan = workoutPlan || dietPlan;
      if (!plan || !plan.startDate) {
        const defaultWeeks = [1];
        this.availableWeeksCache = defaultWeeks;
        return defaultWeeks;
      }

      const totalWeeks = plan.totalWeeks || 12;
      const currentWeek = this.getCurrentWeekNumber(new Date(plan.startDate), new Date());
      
      // Only show weeks up to current week
      const weeks: number[] = [];
      for (let i = 1; i <= Math.min(currentWeek, totalWeeks); i++) {
        weeks.push(i);
      }
      
      // PERFORMANCE: Cache the result
      this.availableWeeksCache = weeks;
      return weeks;
    } catch (error) {
      const defaultWeeks = [1];
      this.availableWeeksCache = defaultWeeks;
      return defaultWeeks;
    }
  }

  // Get available months for filtering - uses cached data
  async getAvailableMonths(forceRefresh = false): Promise<number[]> {
    try {
      // PERFORMANCE: Return cached result if available
      if (!forceRefresh && this.availableMonthsCache !== null) {
        return this.availableMonthsCache;
      }
      
      // OPTIMIZATION: Uses cached data by default - no unnecessary API calls
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = await aiDietService.loadDietPlanFromDatabase();
      
      const plan = workoutPlan || dietPlan;
      if (!plan || !plan.startDate) {
        const defaultMonths = [1];
        this.availableMonthsCache = defaultMonths;
        return defaultMonths;
      }

      const totalWeeks = plan.totalWeeks || 12;
      const totalMonths = Math.ceil(totalWeeks / 4.3);
      const currentMonth = this.getCurrentMonthNumber(new Date(plan.startDate), new Date());
      
      // Only show months up to current month
      const months: number[] = [];
      for (let i = 1; i <= Math.min(currentMonth, totalMonths); i++) {
        months.push(i);
      }
      
      // PERFORMANCE: Cache the result
      this.availableMonthsCache = months;
      return months;
    } catch (error) {
      const defaultMonths = [1];
      this.availableMonthsCache = defaultMonths;
      return defaultMonths;
    }
  }

  // Sync workout progress data
  async syncWorkoutProgress(data: {
    completedExercises: string[];
    completedDays: string[];
    workoutPlan: any;
  }): Promise<void> {
    try {
      // Syncing workout progress data
    } catch (error) {
      // Error syncing workout progress
    }
  }

  // Sync diet progress data
  async syncDietProgress(data: {
    completedMeals: string[];
    completedDays: string[];
    dietPlan: any;
    waterIntake: { [key: string]: number };
  }): Promise<void> {
    try {
      // Syncing diet progress data
    } catch (error) {
      // Error syncing diet progress
    }
  }

  // Clear all progress data
  // ✅ Helper function to parse water intake string to milliliters
  // Handles formats like "2-3 liters", "3000ml", "3L", "2.5L", etc.
  private parseWaterIntakeToMl(waterIntakeStr: string | undefined): number {
    if (!waterIntakeStr) return 3000; // Default 3L
    
    const str = waterIntakeStr.trim().toLowerCase();
    
    // Try to extract number from string (handles "2-3 liters", "3000ml", "3L", etc.)
    // Match patterns like: "3000ml", "3L", "2.5L", "2-3 liters", "3000 ml"
    const mlMatch = str.match(/(\d+(?:\.\d+)?)\s*ml/i);
    if (mlMatch) {
      return Math.round(parseFloat(mlMatch[1]));
    }
    
    const literMatch = str.match(/(\d+(?:\.\d+)?)\s*l/i);
    if (literMatch) {
      return Math.round(parseFloat(literMatch[1]) * 1000);
    }
    
    // Handle range format like "2-3 liters" - use the higher value
    const rangeMatch = str.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:liters?|l)/i);
    if (rangeMatch) {
      const maxValue = Math.max(parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2]));
      return Math.round(maxValue * 1000);
    }
    
    // Try to extract any number and assume it's in liters if no unit specified
    const numberMatch = str.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      const value = parseFloat(numberMatch[1]);
      // If value is > 10, assume it's in ml; otherwise assume liters
      return value > 10 ? Math.round(value) : Math.round(value * 1000);
    }
    
    // Default fallback
    return 3000; // 3L default
  }

  async clearProgressData(): Promise<void> {
    try {
      await exerciseCompletionService.clearCompletionData();
      await mealCompletionService.resetCompletionData();
      
      // Clear water data with user-specific keys
      const userId = await getCurrentUserId();
      if (userId) {
        const [waterIntakeKey, waterCompletedKey] = await Promise.all([
          getUserCacheKey('water_intake', userId),
          getUserCacheKey('water_completed', userId),
        ]);
        await Promise.all([
          Storage.removeItem(waterIntakeKey),
          Storage.removeItem(waterCompletedKey),
          // Also clear old global keys for migration
          Storage.removeItem('water_intake'),
          Storage.removeItem('water_completed'),
        ]);
      }
      await Storage.removeItem('last_progress_cleanup');
    } catch (error) {
      // Error clearing progress data
    }
  }
}

export default new ProgressService();
