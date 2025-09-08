import { api } from '../config/api';
import Storage from '../utils/storage';
import aiWorkoutService from './aiWorkoutService';
import aiDietService from './aiDietService';

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

  // Get comprehensive progress statistics
  async getProgressStats(period: 'daily' | 'weekly' | 'monthly', selectedWeek?: number, selectedMonth?: number): Promise<ProgressServiceResponse<ProgressStats>> {
    try {
      console.log('📊 Loading progress statistics for period:', period);

      // Try to get data from backend first
      try {
        const response = await api.get(`/progress/stats?period=${period}`);
        if (response.data.success) {
          return response.data;
        }
      } catch (error) {
        console.warn('⚠️ Backend not available, calculating from local data');
      }

      // Calculate from local data as fallback
      const localStats = await this.calculateLocalStats(period, selectedWeek, selectedMonth);
      return {
        success: true,
        message: 'Progress stats calculated from local data',
        data: localStats
      };

    } catch (error) {
      console.error('❌ Error getting progress stats:', error);
      return {
        success: false,
        message: 'Failed to load progress statistics'
      };
    }
  }

  // Calculate statistics from real workout and diet plan data
  private async calculateLocalStats(period: 'daily' | 'weekly' | 'monthly', selectedWeek?: number, selectedMonth?: number): Promise<ProgressStats> {
    try {
      console.log(`📊 Calculating ${period} stats for week: ${selectedWeek}, month: ${selectedMonth}`);
      
      // Load workout and diet plans
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = await aiDietService.loadDietPlanFromDatabase();

      // Load completion states
      const completedExercises = await Storage.getItem('completed_exercises') || '[]';
      const completedMeals = await Storage.getItem('completed_meals') || '[]';
      const completedDays = await Storage.getItem('completed_workout_days') || '[]';
      const completedDietDays = await Storage.getItem('completed_diet_days') || '[]';
      const waterIntakeData = await Storage.getItem('water_intake') || '{}';

      const exercisesList = JSON.parse(completedExercises);
      const mealsList = JSON.parse(completedMeals);
      const workoutDaysList = JSON.parse(completedDays);
      const dietDaysList = JSON.parse(completedDietDays);
      const waterData = JSON.parse(waterIntakeData);

      // Calculate date range based on period and plan start dates
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();

      if (workoutPlan && workoutPlan.startDate) {
        const planStartDate = new Date(workoutPlan.startDate);
        
        switch (period) {
          case 'daily':
            // Show today's data
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
            
          case 'weekly':
            // Calculate which week we're in or use selected week
            const weekNumber = selectedWeek || this.getCurrentWeekNumber(planStartDate, now);
            startDate = new Date(planStartDate);
            startDate.setDate(planStartDate.getDate() + ((weekNumber - 1) * 7));
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            break;
            
          case 'monthly':
            // Calculate which month we're in or use selected month
            const monthNumber = selectedMonth || this.getCurrentMonthNumber(planStartDate, now);
            startDate = new Date(planStartDate);
            startDate.setMonth(planStartDate.getMonth() + (monthNumber - 1));
            endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 1);
            endDate.setDate(endDate.getDate() - 1);
            break;
        }
      }

      console.log(`📅 Calculating stats from ${startDate.toDateString()} to ${endDate.toDateString()}`);

      // Filter completion data by date range
      const filteredExercises = exercisesList.filter((ex: any) => {
        const exDate = new Date(ex.date || ex.completedAt);
        return exDate >= startDate && exDate <= endDate;
      });

      const filteredMeals = mealsList.filter((meal: any) => {
        const mealDate = new Date(meal.date || meal.completedAt);
        return mealDate >= startDate && mealDate <= endDate;
      });

      const filteredWaterData = Object.entries(waterData).filter(([date, _]) => {
        const waterDate = new Date(date);
        return waterDate >= startDate && waterDate <= endDate;
      });

      // Calculate real-time statistics based on actual plans
      let totalWorkouts = 0;
      let totalMeals = 0;
      let targetCalories = 0;
      let targetProtein = 0;
      let targetCarbs = 0;
      let targetFats = 0;

      if (period === 'daily') {
        // Daily targets from current day's plan
        const currentDayOfWeek = now.getDay() || 7; // Convert Sunday (0) to 7
        const workoutDay = workoutPlan?.weeklyPlan.find(day => day.day === currentDayOfWeek);
        const dietDay = dietPlan?.weeklyPlan.find(day => day.day === currentDayOfWeek);

        totalWorkouts = workoutDay?.exercises.length || 0;
        totalMeals = dietDay ? (3 + (dietDay.meals.snacks?.length || 0)) : 0;
        targetCalories = dietDay?.totalCalories || dietPlan?.targetCalories || 0;
        targetProtein = dietDay?.totalProtein || (dietPlan?.targetProtein / 7) || 0;
        targetCarbs = dietDay?.totalCarbs || (dietPlan?.targetCarbs / 7) || 0;
        targetFats = dietDay?.totalFats || (dietPlan?.targetFats / 7) || 0;
      } else if (period === 'weekly') {
        // Weekly targets from 7-day plan
        if (workoutPlan) {
          totalWorkouts = workoutPlan.weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0);
        }
        if (dietPlan) {
          totalMeals = dietPlan.weeklyPlan.reduce((sum, day) => 
            sum + 3 + (day.meals.snacks?.length || 0), 0);
          targetCalories = dietPlan.targetCalories;
          targetProtein = dietPlan.targetProtein;
          targetCarbs = dietPlan.targetCarbs;
          targetFats = dietPlan.targetFats;
        }
      } else if (period === 'monthly') {
        // Monthly targets (weekly * ~4.3)
        const weeksInMonth = 4.3;
        if (workoutPlan) {
          const weeklyWorkouts = workoutPlan.weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0);
          totalWorkouts = Math.round(weeklyWorkouts * weeksInMonth);
        }
        if (dietPlan) {
          const weeklyMeals = dietPlan.weeklyPlan.reduce((sum, day) => 
            sum + 3 + (day.meals.snacks?.length || 0), 0);
          totalMeals = Math.round(weeklyMeals * weeksInMonth);
          targetCalories = Math.round(dietPlan.targetCalories * weeksInMonth);
          targetProtein = Math.round(dietPlan.targetProtein * weeksInMonth);
          targetCarbs = Math.round(dietPlan.targetCarbs * weeksInMonth);
          targetFats = Math.round(dietPlan.targetFats * weeksInMonth);
        }
      }

      // Calculate actual consumption from completed meals
      let caloriesConsumed = 0;
      let protein = 0;
      let carbs = 0;
      let fats = 0;

      filteredMeals.forEach((meal: any) => {
        caloriesConsumed += meal.calories || 0;
        protein += meal.protein || 0;
        carbs += meal.carbs || 0;
        fats += meal.fats || 0;
      });

      // Calculate calories burned from completed exercises
      let caloriesBurned = 0;
      filteredExercises.forEach((exercise: any) => {
        // Estimate calories based on exercise type and duration
        const estimatedCalories = this.estimateCaloriesBurned(exercise);
        caloriesBurned += estimatedCalories;
      });

      // Calculate water intake for the period
      const waterIntake = filteredWaterData.reduce((sum, [_, amount]) => sum + (amount as number), 0) / 1000; // Convert ml to L

      // Calculate completion rates
      const workoutsCompleted = filteredExercises.length;
      const mealsCompleted = filteredMeals.length;

      return {
        caloriesConsumed: Math.round(caloriesConsumed),
        caloriesBurned: Math.round(caloriesBurned),
        targetCalories: Math.round(targetCalories),
        waterIntake: Math.round(waterIntake * 10) / 10,
        targetWater: period === 'daily' ? 3 : period === 'weekly' ? 21 : 90, // 3L daily
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fats: Math.round(fats),
        workoutsCompleted,
        totalWorkouts: Math.max(totalWorkouts, 1),
        mealsCompleted,
        totalMeals: Math.max(totalMeals, 1),
        currentStreak: 0, // Removed as requested
        longestStreak: 0, // Removed as requested
        weightProgress: 0,
        bodyFatProgress: 0
      };

    } catch (error) {
      console.error('❌ Error calculating real-time stats:', error);
      
      // Return realistic default stats
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

  // Calculate current consistency streak
  private calculateCurrentStreak(workoutDays: string[], dietDays: string[]): number {
    const allCompletedDays = [...new Set([...workoutDays, ...dietDays])].sort();
    
    if (allCompletedDays.length === 0) return 0;

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const currentDate = new Date();

    // Check backwards from today
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];

      if (allCompletedDays.includes(dateString)) {
        currentStreak++;
      } else if (i > 0) { // Don't break on today if not completed yet
        break;
      }
    }

    return currentStreak;
  }

  // Calculate longest streak ever
  private calculateLongestStreak(workoutDays: string[], dietDays: string[]): number {
    const allCompletedDays = [...new Set([...workoutDays, ...dietDays])].sort();
    
    if (allCompletedDays.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < allCompletedDays.length; i++) {
      const prevDate = new Date(allCompletedDays[i - 1]);
      const currentDate = new Date(allCompletedDays[i]);
      const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  // Get chart data for visualization
  async getChartData(period: 'daily' | 'weekly' | 'monthly'): Promise<ProgressServiceResponse<{
    calories: ChartData;
    macros: ChartData;
    workouts: ChartData;
    water: ChartData;
  }>> {
    try {
      console.log('📈 Loading chart data for period:', period);

      // Generate sample data based on period
      const labels = this.generateLabels(period);
      const dataPoints = labels.length;

      // Generate realistic sample data
      const caloriesData = this.generateSampleData(dataPoints, 1800, 2200);
      const workoutData = this.generateSampleData(dataPoints, 0, 5, true);
      const waterData = this.generateSampleData(dataPoints, 2.0, 3.5);
      const macroData = this.generateSampleData(dataPoints, 100, 200);

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
      console.error('❌ Error getting chart data:', error);
      return {
        success: false,
        message: 'Failed to load chart data'
      };
    }
  }

  // Generate labels based on period
  private generateLabels(period: 'daily' | 'weekly' | 'monthly'): string[] {
    const labels: string[] = [];
    const now = new Date();

    switch (period) {
      case 'daily':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
        }
        break;
      case 'weekly':
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - (i * 7));
          labels.push(`Week ${4 - i}`);
        }
        break;
      case 'monthly':
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          labels.push(date.toLocaleDateString('en', { month: 'short' }));
        }
        break;
    }

    return labels;
  }

  // Generate realistic sample data
  private generateSampleData(count: number, min: number, max: number, integer: boolean = false): number[] {
    const data: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomValue = min + Math.random() * (max - min);
      data.push(integer ? Math.round(randomValue) : Math.round(randomValue * 10) / 10);
    }

    return data;
  }

  // Get AI-powered health remarks
  async getHealthRemarks(): Promise<ProgressServiceResponse<string[]>> {
    try {
      console.log('🤖 Loading health remarks...');

      // Try to get from backend first
      try {
        const response = await api.get('/progress/health-remarks');
        if (response.data.success) {
          return response.data;
        }
      } catch (error) {
        console.warn('⚠️ Backend not available, using default remarks');
      }

      // Default health remarks as fallback
      const defaultRemarks = [
        "Your consistency is the key to long-term success. Keep up the great work!",
        "Consider tracking your sleep quality to optimize recovery and performance.",
        "Meal timing can impact your energy levels - try eating 2-3 hours before workouts.",
        "Progressive overload in workouts will help you continue seeing improvements.",
        "Don't forget to include rest days in your routine for optimal recovery."
      ];

      return {
        success: true,
        message: 'Default health remarks provided',
        data: defaultRemarks
      };

    } catch (error) {
      console.error('❌ Error getting health remarks:', error);
      return {
        success: false,
        message: 'Failed to load health remarks',
        data: []
      };
    }
  }

  // Calculate current week number from plan start date
  private getCurrentWeekNumber(planStartDate: Date, currentDate: Date): number {
    const diffTime = Math.abs(currentDate.getTime() - planStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  // Calculate current month number from plan start date
  private getCurrentMonthNumber(planStartDate: Date, currentDate: Date): number {
    const diffMonths = (currentDate.getFullYear() - planStartDate.getFullYear()) * 12 + 
                      (currentDate.getMonth() - planStartDate.getMonth());
    return Math.max(diffMonths + 1, 1);
  }

  // Estimate calories burned from exercise
  private estimateCaloriesBurned(exercise: any): number {
    // Simple estimation based on exercise type and sets/reps
    const exerciseName = (exercise.name || '').toLowerCase();
    let caloriesPerSet = 10; // Default

    // Estimate based on exercise type
    if (exerciseName.includes('squat') || exerciseName.includes('deadlift')) {
      caloriesPerSet = 15; // High intensity compound movements
    } else if (exerciseName.includes('push') || exerciseName.includes('press')) {
      caloriesPerSet = 12; // Upper body compound
    } else if (exerciseName.includes('curl') || exerciseName.includes('extension')) {
      caloriesPerSet = 8; // Isolation movements
    } else if (exerciseName.includes('cardio') || exerciseName.includes('run')) {
      caloriesPerSet = 25; // Cardio activities
    }

    const sets = exercise.sets || 3;
    const estimatedDuration = sets * 2; // 2 minutes per set average
    
    return Math.round(caloriesPerSet * sets * (estimatedDuration / 10));
  }

  // Get available weeks for filtering
  async getAvailableWeeks(): Promise<number[]> {
    try {
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      if (!workoutPlan || !workoutPlan.startDate || !workoutPlan.totalWeeks) {
        return [1];
      }

      const weeks: number[] = [];
      for (let i = 1; i <= workoutPlan.totalWeeks; i++) {
        weeks.push(i);
      }
      return weeks;
    } catch (error) {
      console.error('❌ Error getting available weeks:', error);
      return [1, 2, 3, 4];
    }
  }

  // Get available months for filtering
  async getAvailableMonths(): Promise<number[]> {
    try {
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      if (!workoutPlan || !workoutPlan.totalWeeks) {
        return [1];
      }

      const totalMonths = Math.ceil(workoutPlan.totalWeeks / 4.3);
      const months: number[] = [];
      for (let i = 1; i <= totalMonths; i++) {
        months.push(i);
      }
      return months;
    } catch (error) {
      console.error('❌ Error getting available months:', error);
      return [1, 2, 3];
    }
  }

  // Clear all progress data
  async clearProgressData(): Promise<void> {
    try {
      await Storage.removeItem('completed_exercises');
      await Storage.removeItem('completed_meals');
      await Storage.removeItem('completed_workout_days');
      await Storage.removeItem('completed_diet_days');
      await Storage.removeItem('water_intake');
      console.log('🗑️ Progress data cleared');
    } catch (error) {
      console.error('❌ Error clearing progress data:', error);
    }
  }
}

export default new ProgressService();
