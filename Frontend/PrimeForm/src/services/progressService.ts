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
  invalidateCaches(): void {
    this.statsCache.clear();
    this.chartsCache.clear();
    this.availableWeeksCache = null;
    this.availableMonthsCache = null;
    this.lastCompletionUpdate = Date.now();
  }
  
  // Generate cache key for stats/charts
  private getCacheKey(period: string, week?: number, month?: number): string {
    return `${period}-${week || 0}-${month || 0}`;
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
      const cacheKey = this.getCacheKey(period, selectedWeek, selectedMonth);
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
      
      // PERFORMANCE: Cache the result
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
      // ✅ FIXED: When water is marked as "Done", use target amount from diet plan (100% completion)
      let waterIntake = 0;
      for (const [date, amount] of Object.entries(filteredWater.intake)) {
        // If water is marked as completed, use the target water amount from diet plan (100% completion)
        if (filteredWater.completed[date]) {
          // Get target water from diet plan for this specific date
          const dietPlanDay = dietPlan?.weeklyPlan.find(day => day.date === date);
          const targetWater = dietPlanDay?.waterIntake ? Number(dietPlanDay.waterIntake) : 3000; // Default 3000ml (3L)
          waterIntake += targetWater; // Use target amount for 100% completion
        } else if (Number(amount) > 0) {
          // If not completed but has some intake, add the actual amount
          waterIntake += Number(amount) || 0;
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
  private filterCompletionsByDateRange(
    completionIds: string[],
    startDate: Date,
    endDate: Date
  ): string[] {
    return completionIds.filter(id => {
      // Extract date from ID (format: "YYYY-MM-DD-...")
      const dateMatch = id.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return false;
      
      const itemDate = new Date(dateMatch[1]);
      itemDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return itemDate >= start && itemDate <= end;
    });
  }

  // Filter water data by date range
  private filterWaterByDateRange(
    waterIntake: { [key: string]: number },
    waterCompleted: { [key: string]: boolean },
    startDate: Date,
    endDate: Date
  ): { intake: { [key: string]: number }; completed: { [key: string]: boolean } } {
    const filteredIntake: { [key: string]: number } = {};
    const filteredCompleted: { [key: string]: boolean } = {};
    
    for (const date of Object.keys(waterIntake)) {
      const waterDate = new Date(date);
      waterDate.setHours(12, 0, 0, 0);
      
      if (waterDate >= startDate && waterDate <= endDate) {
        filteredIntake[date] = waterIntake[date];
        filteredCompleted[date] = waterCompleted[date] || false;
      }
    }
    
    return { intake: filteredIntake, completed: filteredCompleted };
  }

  // Get meal data from meal ID
  private getMealDataFromId(mealId: string, dietPlan: DietPlan): DietMeal | null {
    // Format: "YYYY-MM-DD-mealType-mealName" (mealName may contain hyphens)
    // Use regex to extract date and mealType, then get mealName from the rest
    const dateMatch = mealId.match(/^(\d{4}-\d{2}-\d{2})-(breakfast|lunch|dinner|snack)-(.+)$/);
    if (!dateMatch) return null;
    
    const dateStr = dateMatch[1];
    const mealType = dateMatch[2] as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    const mealName = dateMatch[3];
    
    // Find the day in the weekly plan by exact date match first
    for (const day of dietPlan.weeklyPlan) {
      if (day.date === dateStr) {
        if (mealType === 'breakfast') return day.meals.breakfast;
        if (mealType === 'lunch') return day.meals.lunch;
        if (mealType === 'dinner') return day.meals.dinner;
        if (mealType === 'snack') {
          // Find matching snack by name
          const snack = day.meals.snacks.find(s => s.name === mealName);
          if (snack) return snack;
          // Fallback to first snack if name doesn't match (for backwards compatibility)
          return day.meals.snacks[0] || null;
        }
      }
    }
    
    // If exact date not found, try to match by day of week pattern
    try {
    const mealDate = new Date(dateStr);
      if (isNaN(mealDate.getTime())) return null;
      
    const dayOfWeek = mealDate.getDay();
    
    for (const day of dietPlan.weeklyPlan) {
        if (!day.date) continue;
        let planDate: Date;
        try {
          planDate = new Date(day.date);
          if (isNaN(planDate.getTime())) continue;
        } catch {
          continue;
        }
        
      if (planDate.getDay() === dayOfWeek) {
        if (mealType === 'breakfast') return day.meals.breakfast;
        if (mealType === 'lunch') return day.meals.lunch;
        if (mealType === 'dinner') return day.meals.dinner;
        if (mealType === 'snack') {
            const snack = day.meals.snacks.find(s => s.name === mealName);
            if (snack) return snack;
            return day.meals.snacks[0] || null;
        }
      }
      }
    } catch (error) {
      console.warn('Error matching meal by day of week:', error);
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
        // Generate dates for the current week and find matching day
        const planStartDate = new Date(workoutPlan.startDate);
        planStartDate.setHours(0, 0, 0, 0);
        const dayOfWeek = today.getDay();
      const workoutPlanIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        if (workoutPlanIndex < workoutPlan.weeklyPlan.length) {
        const todayWorkout = workoutPlan.weeklyPlan[workoutPlanIndex];
          totalWorkouts = todayWorkout.isRestDay ? 0 : (todayWorkout.exercises?.length || 0);
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
          // ✅ FIXED: Use actual day's target water, not hardcoded 3L
          targetWater = todayDietDay.waterIntake ? (Number(todayDietDay.waterIntake) / 1000) : 3;
          // ✅ Calculate target macros from diet plan (daily target)
          targetProtein = dietPlan.targetProtein || 0;
          targetCarbs = dietPlan.targetCarbs || 0;
          targetFats = dietPlan.targetFats || 0;
        } else {
          // Fallback to day of week matching
          const dayOfWeek = today.getDay();
          if (dayOfWeek < dietPlan.weeklyPlan.length) {
        const todayDiet = dietPlan.weeklyPlan[dayOfWeek];
            totalMeals = 3 + (todayDiet.meals?.snacks?.length || 0);
        targetCalories = todayDiet.totalCalories || dietPlan.targetCalories || 2000;
            targetWater = todayDiet.waterIntake ? (Number(todayDiet.waterIntake) / 1000) : 3;
            // ✅ Calculate target macros from diet plan (daily target)
            targetProtein = dietPlan.targetProtein || 0;
            targetCarbs = dietPlan.targetCarbs || 0;
            targetFats = dietPlan.targetFats || 0;
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
            totalTargetWater += dietDay.waterIntake ? (Number(dietDay.waterIntake) / 1000) : 3;
            // ✅ FIXED: Sum target macros for each day in the weekly period
            totalTargetProtein += dietPlan.targetProtein || 0;
            totalTargetCarbs += dietPlan.targetCarbs || 0;
            totalTargetFats += dietPlan.targetFats || 0;
          } else {
            // Fallback to day of week matching
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek < dietPlan.weeklyPlan.length) {
              const dayPlan = dietPlan.weeklyPlan[dayOfWeek];
              totalMeals += 3 + (dayPlan.meals?.snacks?.length || 0);
              totalTargetCalories += dayPlan.totalCalories || dietPlan.targetCalories || 2000;
              totalTargetWater += dayPlan.waterIntake ? (Number(dayPlan.waterIntake) / 1000) : 3;
              // ✅ FIXED: Sum target macros for each day in the weekly period
              totalTargetProtein += dietPlan.targetProtein || 0;
              totalTargetCarbs += dietPlan.targetCarbs || 0;
              totalTargetFats += dietPlan.targetFats || 0;
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
            totalTargetWater += dietDay.waterIntake ? (Number(dietDay.waterIntake) / 1000) : 3;
            // ✅ Sum target macros for each day in the period
            totalTargetProtein += dietPlan.targetProtein || 0;
            totalTargetCarbs += dietPlan.targetCarbs || 0;
            totalTargetFats += dietPlan.targetFats || 0;
          } else {
            // Fallback to day of week matching
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek < dietPlan.weeklyPlan.length) {
              const dayPlan = dietPlan.weeklyPlan[dayOfWeek];
              totalMeals += 3 + (dayPlan.meals?.snacks?.length || 0);
              totalTargetCalories += dayPlan.totalCalories || dietPlan.targetCalories || 2000;
              totalTargetWater += dayPlan.waterIntake ? (Number(dayPlan.waterIntake) / 1000) : 3;
              // ✅ Sum target macros for each day in the period
              totalTargetProtein += dietPlan.targetProtein || 0;
              totalTargetCarbs += dietPlan.targetCarbs || 0;
              totalTargetFats += dietPlan.targetFats || 0;
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
      const cacheKey = this.getCacheKey(period, selectedWeek, selectedMonth);
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
      
      // Generate labels based on plan weeks/months and selected filters
      const labels = this.generateLabels(period, workoutPlan, dietPlan, selectedWeek, selectedMonth);
      const dataPoints = labels.length;

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

  // Generate workout chart data
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
    now.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // When a specific week/month is selected, shift the base date window backwards
    let weekOffset = 0;
    let monthOffset = 0;

    if (workoutPlan && workoutPlan.startDate) {
      const planStartDate = new Date(workoutPlan.startDate);
      planStartDate.setHours(0, 0, 0, 0);
      const currentWeek = this.getCurrentWeekNumber(planStartDate, now);
      const currentMonth = this.getCurrentMonthNumber(planStartDate, now);

      if (selectedWeek && period === 'weekly') {
        weekOffset = Math.max(0, currentWeek - selectedWeek);
      }
      if (selectedMonth && period === 'monthly') {
        monthOffset = Math.max(0, currentMonth - selectedMonth);
      }
    }

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

    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'weekly') {
        // Weekly: Show last 4 weeks (Monday to Sunday)
        const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to Monday-based
        
        // Calculate the Monday of the current week
        const currentWeekMonday = new Date(now);
        currentWeekMonday.setDate(now.getDate() - daysFromMonday - (weekOffset * 7));
        currentWeekMonday.setHours(0, 0, 0, 0);
        
        // Go back i weeks from current week
        startDate = new Date(currentWeekMonday);
        startDate.setDate(currentWeekMonday.getDate() - (i * 7));
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Sunday of that week
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Monthly: Show last 6 months
        startDate = new Date(now.getFullYear(), now.getMonth() - i - monthOffset, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() - i - monthOffset + 1, 0); // Last day of that month
        endDate.setHours(23, 59, 59, 999);
      }
      
      const filtered = this.filterCompletionsByDateRange(completedExercises, startDate, endDate);
      data.push(filtered.length);
    }
    
    return data;
  }

  // Generate water chart data
  private async generateWaterChartData(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    workoutPlan: WorkoutPlan | null,
    dietPlan: DietPlan | null,
    selectedWeek?: number,
    selectedMonth?: number
  ): Promise<number[]> {
    const userId = await getCurrentUserId();
    const waterIntakeKey = userId ? await getUserCacheKey('water_intake', userId) : 'water_intake';
    const waterCompletedKey = userId ? await getUserCacheKey('water_completed', userId) : 'water_completed';
    const waterIntakeData = await Storage.getItem(waterIntakeKey) || '{}';
    const waterCompletedData = await Storage.getItem(waterCompletedKey) || '{}';
    const waterData = JSON.parse(waterIntakeData);
    const waterCompleted = JSON.parse(waterCompletedData);
    
    const data: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day

    // When a specific week/month is selected, shift the base date window backwards
    let weekOffset = 0;
    let monthOffset = 0;

    const planForOffsets = workoutPlan || dietPlan;
    if (planForOffsets && planForOffsets.startDate) {
      const planStartDate = new Date(planForOffsets.startDate);
      planStartDate.setHours(0, 0, 0, 0);
      const currentWeek = this.getCurrentWeekNumber(planStartDate, now);
      const currentMonth = this.getCurrentMonthNumber(planStartDate, now);

      if (selectedWeek && period === 'weekly') {
        weekOffset = Math.max(0, currentWeek - selectedWeek);
      }
      if (selectedMonth && period === 'monthly') {
        monthOffset = Math.max(0, currentMonth - selectedMonth);
      }
    }
    
    if (period === 'daily') {
      // ✅ Daily: single data point for TODAY only
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);

      const filtered = this.filterWaterByDateRange(waterData, waterCompleted, startDate, endDate);
      let water = 0;
      for (const [date, amount] of Object.entries(filtered.intake)) {
        if (filtered.completed[date]) {
          water += Number(amount) || 0;
        }
      }
      data.push(Math.round((water / 1000) * 10) / 10); // liters
      return data;
    }

    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'weekly') {
        // Weekly: Show last 4 weeks (Monday to Sunday)
        const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to Monday-based
        
        // Calculate the Monday of the current week
        const currentWeekMonday = new Date(now);
        currentWeekMonday.setDate(now.getDate() - daysFromMonday - (weekOffset * 7));
        currentWeekMonday.setHours(0, 0, 0, 0);
        
        // Go back i weeks from current week
        startDate = new Date(currentWeekMonday);
        startDate.setDate(currentWeekMonday.getDate() - (i * 7));
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Sunday of that week
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Monthly: Show last 6 months
        startDate = new Date(now.getFullYear(), now.getMonth() - i - monthOffset, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() - i - monthOffset + 1, 0); // Last day of that month
        endDate.setHours(23, 59, 59, 999);
      }
      
      const filtered = this.filterWaterByDateRange(waterData, waterCompleted, startDate, endDate);
      let water = 0;
      for (const [date, amount] of Object.entries(filtered.intake)) {
        if (filtered.completed[date]) {
          water += Number(amount) || 0;
        }
      }
      
      data.push(Math.round(water / 1000 * 10) / 10); // Convert to liters
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
        // Weekly: Show last 4 weeks based on plan week numbers
        const planForWeeks = workoutPlan || dietPlan;
        if (planForWeeks && planForWeeks.startDate) {
          const planStartDate = new Date(planForWeeks.startDate);
          planStartDate.setHours(0, 0, 0, 0);
          
          // Calculate current / base week number
          const currentWeek = this.getCurrentWeekNumber(planStartDate, now);
          const baseWeek = selectedWeek || currentWeek;
          const totalWeeks = planForWeeks.totalWeeks || 12;
          
          // Show last 4 weeks (or available weeks if less than 4)
          const weeksToShow = Math.min(4, baseWeek);
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
        // Monthly: Show last 6 months based on plan months
        const planForMonths = workoutPlan || dietPlan;
        if (planForMonths && planForMonths.startDate) {
          const planStartDate = new Date(planForMonths.startDate);
          planStartDate.setHours(0, 0, 0, 0);
          
          // Calculate current / base month number
          const currentMonth = this.getCurrentMonthNumber(planStartDate, now);
          const baseMonth = selectedMonth || currentMonth;
          const totalWeeks = planForMonths.totalWeeks || 12;
          const totalMonths = Math.ceil(totalWeeks / 4); // Approximate months
          
          // Show last 6 months (or available months if less than 6)
          const monthsToShow = Math.min(6, baseMonth);
          const startMonth = Math.max(1, baseMonth - monthsToShow + 1);
          
          for (let month = startMonth; month <= baseMonth; month++) {
            // Calculate the actual month date
            const monthDate = new Date(planStartDate);
            monthDate.setMonth(planStartDate.getMonth() + (month - 1));
            labels.push(monthDate.toLocaleDateString('en', { month: 'short' }));
          }
        } else {
          // Fallback: generic month labels
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          labels.push(date.toLocaleDateString('en', { month: 'short' }));
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
