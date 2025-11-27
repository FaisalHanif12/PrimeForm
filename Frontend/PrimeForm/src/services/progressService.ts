import { api } from '../config/api';
import Storage from '../utils/storage';
import aiWorkoutService, { WorkoutPlan, WorkoutDay, WorkoutExercise } from './aiWorkoutService';
import aiDietService, { DietPlan, DietDay, DietMeal } from './aiDietService';
import exerciseCompletionService from './exerciseCompletionService';
import mealCompletionService from './mealCompletionService';

interface ProgressStats {
  caloriesConsumed: number;
  caloriesBurned: number;
  targetCalories: number;
  waterIntake: number;
  targetWater: number;
  protein: number;
  carbs: number;
  fats: number;
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

  // Initialize and perform cleanup if needed
  async initialize(): Promise<void> {
    await exerciseCompletionService.initialize();
    await mealCompletionService.initialize();
    await this.performPeriodicCleanup();
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
      // Always initialize services first
      await this.initialize();

      // Calculate from local data directly - this ensures accuracy
      const localStats = await this.calculateRealTimeStats(period, selectedWeek, selectedMonth, forceRefresh);
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
      
      // Load water intake data
      const waterIntakeData = await Storage.getItem('water_intake') || '{}';
      const waterCompletedData = await Storage.getItem('water_completed') || '{}';
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
      let waterIntake = 0;
      for (const [date, amount] of Object.entries(filteredWater.intake)) {
        if (filteredWater.completed[date]) {
          waterIntake += Number(amount) || 0;
        }
      }
      // Convert to liters
      waterIntake = waterIntake / 1000;

      // Calculate totals for the period
      const { totalWorkouts, totalMeals, targetCalories, targetWater } = this.calculatePeriodTotals(
        period, 
        workoutPlan, 
        dietPlan, 
        startDate, 
        endDate
      );

      const stats: ProgressStats = {
        caloriesConsumed: Math.round(caloriesConsumed),
        caloriesBurned: Math.round(caloriesBurned),
        targetCalories: Math.round(targetCalories),
        waterIntake: Math.round(waterIntake * 10) / 10,
        targetWater,
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fats: Math.round(fats),
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
    // Format: "YYYY-MM-DD-mealType-mealName"
    const parts = mealId.split('-');
    if (parts.length < 4) return null;
    
    const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const mealType = parts[3] as 'breakfast' | 'lunch' | 'dinner' | 'snack';
    
    // Find the day in the weekly plan
    for (const day of dietPlan.weeklyPlan) {
      if (day.date === dateStr) {
        if (mealType === 'breakfast') return day.meals.breakfast;
        if (mealType === 'lunch') return day.meals.lunch;
        if (mealType === 'dinner') return day.meals.dinner;
        if (mealType === 'snack') {
          // Find matching snack
          const mealName = parts.slice(4).join('-');
          return day.meals.snacks.find(s => s.name === mealName) || day.meals.snacks[0] || null;
        }
      }
    }
    
    // If exact date not found, try to match by day of week pattern
    const mealDate = new Date(dateStr);
    const dayOfWeek = mealDate.getDay();
    
    for (const day of dietPlan.weeklyPlan) {
      const planDate = new Date(day.date);
      if (planDate.getDay() === dayOfWeek) {
        if (mealType === 'breakfast') return day.meals.breakfast;
        if (mealType === 'lunch') return day.meals.lunch;
        if (mealType === 'dinner') return day.meals.dinner;
        if (mealType === 'snack') {
          const mealName = parts.slice(4).join('-');
          return day.meals.snacks.find(s => s.name === mealName) || day.meals.snacks[0] || null;
        }
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
  ): { totalWorkouts: number; totalMeals: number; targetCalories: number; targetWater: number } {
    let totalWorkouts = 0;
    let totalMeals = 0;
    let targetCalories = 0;
    let targetWater = 3; // Default 3L per day

    // Calculate number of days in the period
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (period === 'daily') {
      // Daily: count today's exercises and meals
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // Workout plan: Mon=0, Tue=1, ..., Sun=6
      const workoutPlanIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      if (workoutPlan && workoutPlanIndex < workoutPlan.weeklyPlan.length) {
        const todayWorkout = workoutPlan.weeklyPlan[workoutPlanIndex];
        totalWorkouts = todayWorkout.isRestDay ? 0 : todayWorkout.exercises.length;
      }
      
      // Diet plan: Sun=0, Mon=1, ..., Sat=6
      if (dietPlan && dayOfWeek < dietPlan.weeklyPlan.length) {
        const todayDiet = dietPlan.weeklyPlan[dayOfWeek];
        totalMeals = 3 + (todayDiet.meals.snacks?.length || 0);
        targetCalories = todayDiet.totalCalories || dietPlan.targetCalories || 2000;
      }
      
      targetWater = 3;
    } else if (period === 'weekly') {
      // Weekly: sum all exercises and meals in the week
      if (workoutPlan) {
        totalWorkouts = workoutPlan.weeklyPlan.reduce((sum, day) => 
          sum + (day.isRestDay ? 0 : day.exercises.length), 0);
      }
      
      if (dietPlan) {
        totalMeals = dietPlan.weeklyPlan.reduce((sum, day) => 
          sum + 3 + (day.meals.snacks?.length || 0), 0);
        targetCalories = dietPlan.targetCalories || 2000;
      }
      
      targetWater = 21; // 3L x 7 days
    } else if (period === 'monthly') {
      // Monthly: weekly totals x ~4.3
      const weeksInMonth = Math.ceil(daysDiff / 7);
      
      if (workoutPlan) {
        const weeklyWorkouts = workoutPlan.weeklyPlan.reduce((sum, day) => 
          sum + (day.isRestDay ? 0 : day.exercises.length), 0);
        totalWorkouts = weeklyWorkouts * weeksInMonth;
      }
      
      if (dietPlan) {
        const weeklyMeals = dietPlan.weeklyPlan.reduce((sum, day) => 
          sum + 3 + (day.meals.snacks?.length || 0), 0);
        totalMeals = weeklyMeals * weeksInMonth;
        targetCalories = (dietPlan.targetCalories || 2000) * weeksInMonth;
      }
      
      targetWater = 3 * daysDiff; // 3L x days in month
    }

    return { totalWorkouts, totalMeals, targetCalories, targetWater };
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
  async getChartData(period: 'daily' | 'weekly' | 'monthly', forceRefresh = false): Promise<ProgressServiceResponse<{
    calories: ChartData;
    macros: ChartData;
    workouts: ChartData;
    water: ChartData;
  }>> {
    try {
      // OPTIMIZATION: Load real data for charts using cached data unless forcing refresh
      const workoutPlan = forceRefresh
        ? await aiWorkoutService.refreshWorkoutPlanFromDatabase()
        : await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = forceRefresh
        ? await aiDietService.refreshDietPlanFromDatabase()
        : await aiDietService.loadDietPlanFromDatabase();
      
      const exerciseCompletionData = exerciseCompletionService.getCompletionData();
      const mealCompletionData = mealCompletionService.getCompletionData();
      
      const labels = this.generateLabels(period);
      const dataPoints = labels.length;

      // Generate data based on actual completions
      const caloriesData = await this.generateCaloriesChartData(period, dataPoints, dietPlan, mealCompletionData.completedMeals);
      const workoutData = await this.generateWorkoutChartData(period, dataPoints, workoutPlan, exerciseCompletionData.completedExercises);
      const waterData = await this.generateWaterChartData(period, dataPoints);
      const macroData = await this.generateMacroChartData(period, dataPoints, dietPlan, mealCompletionData.completedMeals);

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

  // Generate calories chart data based on actual completions
  private async generateCaloriesChartData(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    dietPlan: DietPlan | null,
    completedMeals: string[]
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'daily') {
        startDate.setDate(now.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - (i * 7) - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate.setMonth(now.getMonth() - i, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      const filtered = this.filterCompletionsByDateRange(completedMeals, startDate, endDate);
      let calories = 0;
      
      if (dietPlan) {
        for (const mealId of filtered) {
          const meal = this.getMealDataFromId(mealId, dietPlan);
          if (meal) calories += meal.calories;
        }
      }
      
      data.push(calories);
    }
    
    return data;
  }

  // Generate workout chart data
  private async generateWorkoutChartData(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    workoutPlan: WorkoutPlan | null,
    completedExercises: string[]
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'daily') {
        startDate.setDate(now.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - (i * 7) - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate.setMonth(now.getMonth() - i, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      const filtered = this.filterCompletionsByDateRange(completedExercises, startDate, endDate);
      data.push(filtered.length);
    }
    
    return data;
  }

  // Generate water chart data
  private async generateWaterChartData(period: 'daily' | 'weekly' | 'monthly', dataPoints: number): Promise<number[]> {
    const waterIntakeData = await Storage.getItem('water_intake') || '{}';
    const waterCompletedData = await Storage.getItem('water_completed') || '{}';
    const waterData = JSON.parse(waterIntakeData);
    const waterCompleted = JSON.parse(waterCompletedData);
    
    const data: number[] = [];
    const now = new Date();
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'daily') {
        startDate.setDate(now.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - (i * 7) - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate.setMonth(now.getMonth() - i, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1, 0);
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

  // Generate macro chart data (protein)
  private async generateMacroChartData(
    period: 'daily' | 'weekly' | 'monthly',
    dataPoints: number,
    dietPlan: DietPlan | null,
    completedMeals: string[]
  ): Promise<number[]> {
    const data: number[] = [];
    const now = new Date();
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      let startDate = new Date(now);
      let endDate = new Date(now);
      
      if (period === 'daily') {
        startDate.setDate(now.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - (i * 7) - now.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate.setMonth(now.getMonth() - i, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      const filtered = this.filterCompletionsByDateRange(completedMeals, startDate, endDate);
      let protein = 0;
      
      if (dietPlan) {
        for (const mealId of filtered) {
          const meal = this.getMealDataFromId(mealId, dietPlan);
          if (meal) protein += meal.protein;
        }
      }
      
      data.push(protein);
    }
    
    return data;
  }

  // Generate labels based on period
  private generateLabels(period: 'daily' | 'weekly' | 'monthly'): string[] {
    const labels: string[] = [];
    const now = new Date();

    switch (period) {
      case 'daily':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
        }
        break;
      case 'weekly':
        for (let i = 3; i >= 0; i--) {
          labels.push(`Week ${4 - i}`);
        }
        break;
      case 'monthly':
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          labels.push(date.toLocaleDateString('en', { month: 'short' }));
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
  async getAvailableWeeks(): Promise<number[]> {
    try {
      // OPTIMIZATION: Uses cached data by default - no unnecessary API calls
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = await aiDietService.loadDietPlanFromDatabase();
      
      const plan = workoutPlan || dietPlan;
      if (!plan || !plan.startDate) {
        return [1];
      }

      const totalWeeks = plan.totalWeeks || 12;
      const currentWeek = this.getCurrentWeekNumber(new Date(plan.startDate), new Date());
      
      // Only show weeks up to current week
      const weeks: number[] = [];
      for (let i = 1; i <= Math.min(currentWeek, totalWeeks); i++) {
        weeks.push(i);
      }
      return weeks;
    } catch (error) {
      return [1];
    }
  }

  // Get available months for filtering - uses cached data
  async getAvailableMonths(): Promise<number[]> {
    try {
      // OPTIMIZATION: Uses cached data by default - no unnecessary API calls
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = await aiDietService.loadDietPlanFromDatabase();
      
      const plan = workoutPlan || dietPlan;
      if (!plan || !plan.startDate) {
        return [1];
      }

      const totalWeeks = plan.totalWeeks || 12;
      const totalMonths = Math.ceil(totalWeeks / 4.3);
      const currentMonth = this.getCurrentMonthNumber(new Date(plan.startDate), new Date());
      
      // Only show months up to current month
      const months: number[] = [];
      for (let i = 1; i <= Math.min(currentMonth, totalMonths); i++) {
        months.push(i);
      }
      return months;
    } catch (error) {
      return [1];
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
      await Storage.removeItem('water_intake');
      await Storage.removeItem('water_completed');
      await Storage.removeItem('last_progress_cleanup');
    } catch (error) {
      // Error clearing progress data
    }
  }
}

export default new ProgressService();
