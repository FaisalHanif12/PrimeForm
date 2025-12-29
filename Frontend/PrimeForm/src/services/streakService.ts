import { api } from '../config/api';
import Storage from '../utils/storage';
import aiWorkoutService from './aiWorkoutService';
import aiDietService from './aiDietService';

interface StreakData {
  currentWorkoutStreak: number;
  currentDietStreak: number;
  currentOverallStreak: number;
  longestWorkoutStreak: number;
  longestDietStreak: number;
  longestOverallStreak: number;
  weeklyConsistency: number;
  monthlyConsistency: number;
  totalActiveDays: number;
  streakHistory: Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
    category: 'workout' | 'diet' | 'overall';
  }>;
  milestones: Array<{
    target: number;
    achieved: boolean;
    category: 'workout' | 'diet' | 'overall';
    title: string;
  }>;
  // Weekly counts for UI display
  weeklyWorkoutCount?: number;
  weeklyDietCount?: number;
  weeklyOverallCount?: number;
}

interface StreakServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class StreakService {

  async getStreakData(useLocalOnly = false): Promise<StreakServiceResponse<StreakData>> {
    try {
      // If useLocalOnly is true, skip API call and calculate from local data
      if (useLocalOnly) {
        const localStreakData = await this.calculateLocalStreakData();
        return {
          success: true,
          message: 'Streak data calculated from local data',
          data: localStreakData
        };
      }

      // Try to get data from backend first
      try {
        const response = await api.get('/streak/data');
        if (response.data.success) {
          return response.data;
        }
      } catch (error) {
        // Backend not available, calculate from local data
      }

      const localStreakData = await this.calculateLocalStreakData();
      return {
        success: true,
        message: 'Streak data calculated from local data',
        data: localStreakData
      };

    } catch (error) {
      console.error('❌ Error getting streak data:', error);
      return {
        success: false,
        message: 'Failed to load streak data'
      };
    }
  }

  // Calculate streak data from local storage
  private async calculateLocalStreakData(): Promise<StreakData> {
    try {
      // ✅ CRITICAL: Use user-specific cache keys for account-specific data
      const { getCurrentUserId, getUserCacheKey, validateCachedData } = await import('../utils/cacheKeys');
      const userId = await getCurrentUserId();
      
      if (!userId) {
        // No user ID, return empty streak data
        return {
          currentWorkoutStreak: 0,
          currentDietStreak: 0,
          currentOverallStreak: 0,
          longestWorkoutStreak: 0,
          longestDietStreak: 0,
          longestOverallStreak: 0,
          weeklyConsistency: 0,
          monthlyConsistency: 0,
          totalActiveDays: 0,
          streakHistory: [],
          achievements: [],
          milestones: [],
          weeklyWorkoutCount: 0,
          weeklyDietCount: 0,
          weeklyOverallCount: 0
        };
      }

      // Load completion data from storage with user-specific keys
      const [completedExercisesKey, completedMealsKey] = await Promise.all([
        getUserCacheKey('completed_exercises', userId),
        getUserCacheKey('completed_meals', userId)
      ]);

      const [completedExercisesData, completedMealsData] = await Promise.all([
        Storage.getItem(completedExercisesKey),
        Storage.getItem(completedMealsKey)
      ]);

      const completedExercises = completedExercisesData ? JSON.parse(completedExercisesData) as string[] : [];
      const completedMeals = completedMealsData ? JSON.parse(completedMealsData) as string[] : [];

      console.log('📊 StreakService: Loaded completion data:', {
        exercises: completedExercises.length,
        meals: completedMeals.length,
        sampleExercises: completedExercises.slice(0, 3),
        sampleMeals: completedMeals.slice(0, 3)
      });

      // Convert to Sets for faster lookup
      const completedExercisesSet = new Set<string>(completedExercises);
      const completedMealsSet = new Set<string>(completedMeals);

      // Load workout and diet plans from local storage with user-specific keys
      const [workoutPlanKey, dietPlanKey] = await Promise.all([
        getUserCacheKey('cached_workout_plan', userId),
        getUserCacheKey('cached_diet_plan', userId)
      ]);

      const [workoutPlanData, dietPlanData] = await Promise.all([
        Storage.getItem(workoutPlanKey),
        Storage.getItem(dietPlanKey)
      ]);

      let workoutPlan = workoutPlanData ? JSON.parse(workoutPlanData) : null;
      let dietPlan = dietPlanData ? JSON.parse(dietPlanData) : null;

      // ✅ CRITICAL: Validate cached data belongs to current user
      if (workoutPlan && !validateCachedData(workoutPlan, userId)) {
        workoutPlan = null;
      }
      if (dietPlan && !validateCachedData(dietPlan, userId)) {
        dietPlan = null;
      }

      console.log('📊 StreakService: Plans loaded:', {
        hasWorkoutPlan: !!workoutPlan,
        hasDietPlan: !!dietPlan,
        workoutPlanStartDate: workoutPlan?.startDate,
        dietPlanStartDate: dietPlan?.startDate
      });

      // Calculate completed days based on 50% threshold
      const workoutDaysList = this.calculateCompletedWorkoutDays(workoutPlan, completedExercisesSet) || [];
      const dietDaysList = this.calculateCompletedDietDays(dietPlan, completedMealsSet) || [];

      console.log('📊 StreakService: Completed days calculated:', {
        workoutDaysCount: workoutDaysList.length,
        dietDaysCount: dietDaysList.length,
        workoutDaysSample: workoutDaysList.slice(-5),
        dietDaysSample: dietDaysList.slice(-5)
      });

      // Get plan start dates to determine history start date
      const workoutStartDate = workoutPlan?.startDate ? new Date(workoutPlan.startDate) : null;
      const dietStartDate = dietPlan?.startDate ? new Date(dietPlan.startDate) : null;
      
      // Use the earliest plan start date, or today if no plans
      let planStartDate: Date | null = null;
      if (workoutStartDate && dietStartDate) {
        planStartDate = workoutStartDate < dietStartDate ? workoutStartDate : dietStartDate;
      } else if (workoutStartDate) {
        planStartDate = workoutStartDate;
      } else if (dietStartDate) {
        planStartDate = dietStartDate;
      }

      // Generate daily activity history from plan start date (or last 60 days if no plan)
      const streakHistory = this.generateStreakHistory(workoutDaysList, dietDaysList, planStartDate);

      // Calculate current streaks (ensure arrays are passed)
      const currentWorkoutStreak = this.calculateCurrentStreak(Array.isArray(workoutDaysList) ? workoutDaysList : []);
      const currentDietStreak = this.calculateCurrentStreak(Array.isArray(dietDaysList) ? dietDaysList : []);
      const currentOverallStreak = this.calculateOverallStreak(streakHistory);

      // Calculate longest streaks (ensure arrays are passed)
      const longestWorkoutStreak = this.calculateLongestStreak(Array.isArray(workoutDaysList) ? workoutDaysList : []);
      const longestDietStreak = this.calculateLongestStreak(Array.isArray(dietDaysList) ? dietDaysList : []);
      const longestOverallStreak = this.calculateLongestOverallStreak(streakHistory);

      console.log('📊 StreakService: Streak calculations:', {
        currentWorkoutStreak,
        currentDietStreak,
        currentOverallStreak,
        longestWorkoutStreak,
        longestDietStreak,
        longestOverallStreak
      });

      // Calculate consistency percentages (returns object with workout, diet, overall)
      const weeklyConsistencyData = this.calculateWeeklyConsistency(streakHistory);
      // Convert to percentage for backward compatibility (using overall)
      const weeklyConsistency = Math.round((weeklyConsistencyData.overall / 7) * 100);
      const monthlyConsistency = this.calculateMonthlyConsistency(streakHistory);

      // Generate achievements
      const achievements = this.generateAchievements(
        currentWorkoutStreak,
        currentDietStreak,
        currentOverallStreak,
        longestWorkoutStreak,
        longestDietStreak,
        longestOverallStreak
      );

      // Generate milestones
      const milestones = this.generateMilestones(
        currentWorkoutStreak,
        currentDietStreak,
        currentOverallStreak
      );

      return {
        currentWorkoutStreak,
        currentDietStreak,
        currentOverallStreak,
        longestWorkoutStreak,
        longestDietStreak,
        longestOverallStreak,
        weeklyConsistency,
        monthlyConsistency,
        totalActiveDays: streakHistory.filter(day => day.overallCompleted).length,
        streakHistory,
        achievements,
        milestones,
        // Add weekly counts for UI display
        weeklyWorkoutCount: weeklyConsistencyData.workout,
        weeklyDietCount: weeklyConsistencyData.diet,
        weeklyOverallCount: weeklyConsistencyData.overall
      };

    } catch (error) {
      console.error('❌ Error calculating local streak data:', error);
      
      // Return default data
      return {
        currentWorkoutStreak: 0,
        currentDietStreak: 0,
        currentOverallStreak: 0,
        longestWorkoutStreak: 0,
        longestDietStreak: 0,
        longestOverallStreak: 0,
        weeklyConsistency: 0,
        monthlyConsistency: 0,
        totalActiveDays: 0,
        streakHistory: [],
        achievements: [],
        milestones: [],
        weeklyWorkoutCount: 0,
        weeklyDietCount: 0,
        weeklyOverallCount: 0
      };
    }
  }

  // Generate daily activity history from plan start date
  private generateStreakHistory(workoutDays: string[], dietDays: string[], planStartDate: Date | null = null): Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }> {
    const history = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Helper function to format date consistently (local time, not UTC)
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Determine start date: use plan start date if available, otherwise use 60 days ago
    let startDate: Date;
    if (planStartDate) {
      startDate = new Date(planStartDate);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // No plan, use last 60 days as fallback
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 59); // 60 days total (0-59 = 60 days)
      startDate.setHours(0, 0, 0, 0);
    }
    
    // Ensure start date is not in the future
    if (startDate > today) {
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
    }
    
    // Ensure we have arrays (safety check)
    const workoutDaysArray = Array.isArray(workoutDays) ? workoutDays : [];
    const dietDaysArray = Array.isArray(dietDays) ? dietDays : [];
    
    // Convert to Sets for faster lookup
    const workoutDaysSet = new Set(workoutDaysArray);
    const dietDaysSet = new Set(dietDaysArray);
    
    // Calculate number of days from start date to today
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.min(daysDiff + 1, 60); // Cap at 60 days maximum
    
    // Generate history from plan start date to today (or last 60 days if no plan)
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      // Don't include future dates
      if (date > today) break;
      
      // Format date consistently (local time, not UTC)
      const dateString = formatLocalDate(date);
      
      // Check if day is completed (use Set for O(1) lookup)
      const workoutCompleted = workoutDaysSet.has(dateString);
      const dietCompleted = dietDaysSet.has(dateString);
      const overallCompleted = workoutCompleted && dietCompleted;
      
      history.push({
        date: dateString,
        workoutCompleted,
        dietCompleted,
        overallCompleted
      });
    }
    
    console.log('📊 StreakService: History generated:', {
      planStartDate: planStartDate ? formatLocalDate(planStartDate) : 'none',
      startDate: formatLocalDate(startDate),
      today: formatLocalDate(today),
      totalDays: history.length,
      historyDates: history.slice(0, 3).map(d => d.date)
    });
    
    return history;
  }

  // Calculate current streak from today backwards
  private calculateCurrentStreak(completedDays: string[]): number {
    if (completedDays.length === 0) return 0;

    // Helper function to format date consistently (local time, not UTC)
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Normalize dates to YYYY-MM-DD format and remove duplicates
    const normalizedDays = completedDays
      .map(day => {
        // If day is already in YYYY-MM-DD format, use it
        if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
          return day;
        }
        // Try to parse as date
        try {
          const date = new Date(day);
          return formatLocalDate(date);
        } catch {
          return null;
        }
      })
      .filter((day): day is string => day !== null);

    if (normalizedDays.length === 0) return 0;

    // Sort dates and get unique values
    const uniqueDays = Array.from(new Set(normalizedDays)).sort();
    
    // Get today and yesterday in local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatLocalDate(today);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);
    
    // Find the most recent completed day
    const mostRecentDay = uniqueDays[uniqueDays.length - 1];
    
    // If the most recent day is more than 1 day ago, streak is broken
    const mostRecentDate = new Date(mostRecentDay + 'T00:00:00');
    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) {
      return 0; // Streak broken - gap of more than 1 day
    }
    
    // Count consecutive days backwards from the most recent completed day
    let streak = 0;
    const startDate = new Date(mostRecentDay + 'T00:00:00');
    
    // Check backwards from most recent day
    for (let i = 0; i < 365; i++) { // Check up to a year
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      const dateString = formatLocalDate(checkDate);
      
      if (uniqueDays.includes(dateString)) {
        streak++;
      } else {
        // If we hit a gap, stop counting
        break;
      }
    }
    
    return streak;
  }

  // Calculate overall streak (both workout and diet)
  private calculateOverallStreak(history: Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }>): number {
    if (history.length === 0) return 0;
    
    // Helper function to format date consistently (local time, not UTC)
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Get today in local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatLocalDate(today);
    
    // Find the most recent overall completed day
    const reversedHistory = [...history].reverse();
    let mostRecentCompletedDate: string | null = null;
    
    for (const day of reversedHistory) {
      if (day.overallCompleted) {
        mostRecentCompletedDate = day.date;
        break;
      }
    }
    
    if (!mostRecentCompletedDate) return 0;
    
    // Check if streak is broken (more than 1 day ago)
    const mostRecentDate = new Date(mostRecentCompletedDate + 'T00:00:00');
    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) {
      return 0; // Streak broken - gap of more than 1 day
    }
    
    // Count consecutive overall completed days backwards from most recent
    let streak = 0;
    const startDate = new Date(mostRecentCompletedDate + 'T00:00:00');
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      const dateString = formatLocalDate(checkDate);
      
      // Find this date in history
      const dayInHistory = history.find(d => d.date === dateString);
      if (dayInHistory && dayInHistory.overallCompleted) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Calculate longest streak ever
  private calculateLongestStreak(completedDays: string[]): number {
    if (completedDays.length === 0) return 0;

    // Helper function to format date consistently (local time, not UTC)
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Normalize and sort dates
    const normalizedDays = completedDays
      .map(day => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
          return day;
        }
        try {
          const date = new Date(day);
          return formatLocalDate(date);
        } catch {
          return null;
        }
      })
      .filter((day): day is string => day !== null);

    if (normalizedDays.length === 0) return 0;

    const sortedDays = Array.from(new Set(normalizedDays)).sort();
    let longestStreak = sortedDays.length > 0 ? 1 : 0;
    let currentStreak = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1] + 'T00:00:00');
      const currentDate = new Date(sortedDays[i] + 'T00:00:00');
      const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        // Consecutive day
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        // Gap found, reset current streak
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  // Calculate longest overall streak
  private calculateLongestOverallStreak(history: Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }>): number {
    if (history.length === 0) return 0;
    
    // Sort history by date to ensure chronological order
    const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));
    
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < sortedHistory.length; i++) {
      const day = sortedHistory[i];
      
      if (day.overallCompleted) {
        // Check if this is consecutive with previous day
        if (i > 0) {
          const prevDate = new Date(sortedHistory[i - 1].date + 'T00:00:00');
          const currentDate = new Date(day.date + 'T00:00:00');
          const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1 && sortedHistory[i - 1].overallCompleted) {
            // Consecutive day, continue streak
            currentStreak++;
          } else {
            // Gap found or previous day not completed, start new streak
            currentStreak = 1;
          }
        } else {
          // First day
          currentStreak = 1;
        }
        
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        // Day not completed, reset streak
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  }

  // Calculate weekly consistency percentage
  // Returns separate counts for workout and diet, and overall
  // Uses actual week boundaries (Monday-Sunday)
  private calculateWeeklyConsistency(history: Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }>): { workout: number; diet: number; overall: number } {
    // Helper function to format date consistently (local time, not UTC)
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get Monday of current week (week starts on Monday)
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to Mon=0, Sun=6
    const mondayOfWeek = new Date(today);
    mondayOfWeek.setDate(today.getDate() - daysFromMonday);
    mondayOfWeek.setHours(0, 0, 0, 0);
    
    // Generate dates from Monday to today (current week)
    const currentWeekDays: string[] = [];
    for (let i = 0; i <= daysFromMonday; i++) {
      const date = new Date(mondayOfWeek);
      date.setDate(mondayOfWeek.getDate() + i);
      const dateStr = formatLocalDate(date);
      currentWeekDays.push(dateStr);
    }
    
    // Filter history to only include current week days (Monday to today)
    const currentWeek = history.filter(day => currentWeekDays.includes(day.date));
    
    // Count completed days for each type in current week
    const workoutCompleted = currentWeek.filter(day => day.workoutCompleted).length;
    const dietCompleted = currentWeek.filter(day => day.dietCompleted).length;
    const overallCompleted = currentWeek.filter(day => day.overallCompleted).length;
    
    console.log('📊 StreakService: Weekly consistency calculation:', {
      today: formatLocalDate(today),
      mondayOfWeek: formatLocalDate(mondayOfWeek),
      currentWeekDays,
      currentWeekLength: currentWeek.length,
      workoutCompleted,
      dietCompleted,
      overallCompleted
    });
    
    return {
      workout: workoutCompleted,
      diet: dietCompleted,
      overall: overallCompleted
    };
  }

  // Calculate monthly consistency percentage
  private calculateMonthlyConsistency(history: Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }>): number {
    const lastMonth = history.slice(-30);
    const completedDays = lastMonth.filter(day => day.overallCompleted).length;
    return Math.round((completedDays / 30) * 100);
  }

  // Generate achievements based on streaks
  private generateAchievements(
    currentWorkoutStreak: number,
    currentDietStreak: number,
    currentOverallStreak: number,
    longestWorkoutStreak: number,
    longestDietStreak: number,
    longestOverallStreak: number
  ): Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
    category: 'workout' | 'diet' | 'overall';
  }> {
    const achievements = [];
    const now = new Date().toISOString();

    // Workout achievements
    if (longestWorkoutStreak >= 7) {
      achievements.push({
        id: 'workout-week',
        title: 'Workout Warrior',
        description: 'Completed workouts for 7 consecutive days',
        icon: '💪',
        unlockedAt: now,
        category: 'workout' as const
      });
    }

    if (longestWorkoutStreak >= 30) {
      achievements.push({
        id: 'workout-month',
        title: 'Fitness Champion',
        description: 'Maintained workout streak for 30 days',
        icon: '🏆',
        unlockedAt: now,
        category: 'workout' as const
      });
    }

    // Diet achievements
    if (longestDietStreak >= 7) {
      achievements.push({
        id: 'diet-week',
        title: 'Nutrition Master',
        description: 'Followed diet plan for 7 consecutive days',
        icon: '🥗',
        unlockedAt: now,
        category: 'diet' as const
      });
    }

    if (longestDietStreak >= 30) {
      achievements.push({
        id: 'diet-month',
        title: 'Healthy Living Expert',
        description: 'Maintained diet consistency for 30 days',
        icon: '🌟',
        unlockedAt: now,
        category: 'diet' as const
      });
    }

    // Overall achievements
    if (longestOverallStreak >= 14) {
      achievements.push({
        id: 'overall-two-weeks',
        title: 'Lifestyle Transformer',
        description: 'Perfect consistency for 2 weeks straight',
        icon: '⭐',
        unlockedAt: now,
        category: 'overall' as const
      });
    }

    if (longestOverallStreak >= 50) {
      achievements.push({
        id: 'overall-fifty',
        title: 'Legend Status',
        description: 'Achieved 50-day perfect streak',
        icon: '👑',
        unlockedAt: now,
        category: 'overall' as const
      });
    }

    return achievements;
  }

  // Generate milestone targets
  private generateMilestones(
    currentWorkoutStreak: number,
    currentDietStreak: number,
    currentOverallStreak: number
  ): Array<{
    target: number;
    achieved: boolean;
    category: 'workout' | 'diet' | 'overall';
    title: string;
  }> {
    const milestones = [
      // Workout milestones
      { target: 7, achieved: currentWorkoutStreak >= 7, category: 'workout' as const, title: '7-Day Workout' },
      { target: 14, achieved: currentWorkoutStreak >= 14, category: 'workout' as const, title: '2-Week Workout' },
      { target: 30, achieved: currentWorkoutStreak >= 30, category: 'workout' as const, title: '1-Month Workout' },
      
      // Diet milestones
      { target: 7, achieved: currentDietStreak >= 7, category: 'diet' as const, title: '7-Day Diet' },
      { target: 14, achieved: currentDietStreak >= 14, category: 'diet' as const, title: '2-Week Diet' },
      { target: 30, achieved: currentDietStreak >= 30, category: 'diet' as const, title: '1-Month Diet' },
      
      // Overall milestones
      { target: 7, achieved: currentOverallStreak >= 7, category: 'overall' as const, title: '7-Day Perfect' },
      { target: 21, achieved: currentOverallStreak >= 21, category: 'overall' as const, title: '3-Week Perfect' },
      { target: 50, achieved: currentOverallStreak >= 50, category: 'overall' as const, title: '50-Day Perfect' },
      { target: 100, achieved: currentOverallStreak >= 100, category: 'overall' as const, title: '100-Day Legend' },
    ];

    return milestones;
  }

  // Calculate completed workout days based on 50% threshold
  private calculateCompletedWorkoutDays(workoutPlan: any, completedExercisesSet: Set<string>): string[] {
    const completedDays: string[] = [];
    
    if (completedExercisesSet.size === 0) {
      console.log('⚠️ StreakService: No completed exercises found');
      return completedDays;
    }

    // Extract unique dates from completed exercise IDs
    // Exercise IDs format: "YYYY-MM-DD-exerciseName"
    const dateToExercises = new Map<string, Set<string>>();
    
    completedExercisesSet.forEach((exerciseId: string) => {
      // Extract date from exercise ID (format: "YYYY-MM-DD-exerciseName")
      const parts = exerciseId.split('-');
      if (parts.length >= 3) {
        const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          if (!dateToExercises.has(dateStr)) {
            dateToExercises.set(dateStr, new Set());
          }
          dateToExercises.get(dateStr)!.add(exerciseId);
        }
      }
    });

    console.log('📊 StreakService: Extracted dates from exercises:', {
      uniqueDates: dateToExercises.size,
      dates: Array.from(dateToExercises.keys()).slice(0, 5)
    });

    if (!workoutPlan || !workoutPlan.weeklyPlan || !Array.isArray(workoutPlan.weeklyPlan)) {
      console.log('⚠️ StreakService: Invalid workout plan, using date-based approach');
    
      dateToExercises.forEach((exercises, date) => {
        if (exercises.size > 0) {
          completedDays.push(date);
        }
      });
      return completedDays.sort();
    }

    const startDate = new Date(workoutPlan.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalWeeks = workoutPlan.totalWeeks || 12;
    
    // Generate all dates and check completion
    for (let week = 1; week <= totalWeeks; week++) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dayDate = new Date(startDate);
        const daysToAdd = (week - 1) * 7 + dayOfWeek;
        dayDate.setDate(startDate.getDate() + daysToAdd);
        dayDate.setHours(0, 0, 0, 0);
        
        if (dayDate > today) break;
        
        // Format date consistently (use local date, not UTC)
        const year = dayDate.getFullYear();
        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
        const day = String(dayDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        const dayOfWeekJS = dayDate.getDay();
        const planIndex = dayOfWeekJS === 0 ? 6 : dayOfWeekJS - 1;
        const planDay = workoutPlan.weeklyPlan[planIndex];
        
        if (planDay && planDay.exercises && !planDay.isRestDay) {
          const expectedExercises = planDay.exercises.map((ex: any) => 
            `${dateString}-${ex.name}`
          );
          
          if (expectedExercises.length > 0) {
            const completedForDate = dateToExercises.get(dateString) || new Set();
            const completedCount = expectedExercises.filter((exId: string) => 
              completedForDate.has(exId)
            ).length;
            const completionPercentage = (completedCount / expectedExercises.length) * 100;
            
            if (completionPercentage >= 50) {
              completedDays.push(dateString);
            }
          }
        }
      }
    }

    console.log('📊 StreakService: Workout completed days:', {
      count: completedDays.length,
      days: completedDays.slice(0, 5),
      allDates: completedDays
    });
    return completedDays.sort();
  }

  // Calculate completed diet days based on 50% threshold
  private calculateCompletedDietDays(dietPlan: any, completedMealsSet: Set<string>): string[] {
    const completedDays: string[] = [];
    
    if (completedMealsSet.size === 0) {
      console.log('⚠️ StreakService: No completed meals found');
      return completedDays;
    }

    // Extract unique dates from completed meal IDs
    // Meal IDs format: "YYYY-MM-DD-mealType-mealName"
    const dateToMeals = new Map<string, Set<string>>();
    
    completedMealsSet.forEach((mealId: string) => {
      // Extract date from meal ID (format: "YYYY-MM-DD-mealType-mealName")
      const parts = mealId.split('-');
      if (parts.length >= 3) {
        const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          if (!dateToMeals.has(dateStr)) {
            dateToMeals.set(dateStr, new Set());
          }
          dateToMeals.get(dateStr)!.add(mealId);
        }
      }
    });

    console.log('📊 StreakService: Extracted dates from meals:', {
      uniqueDates: dateToMeals.size,
      dates: Array.from(dateToMeals.keys()).slice(0, 5),
      sampleMealsForDate: Array.from(dateToMeals.entries())[0]
    });

    if (!dietPlan || !dietPlan.weeklyPlan || !Array.isArray(dietPlan.weeklyPlan)) {
      console.log('⚠️ StreakService: Invalid diet plan, using date-based approach');
      // Fallback: if no plan, just use dates that have any completed meals
      // This is less accurate but better than nothing
      dateToMeals.forEach((meals, date) => {
        if (meals.size > 0) {
          completedDays.push(date);
        }
      });
      return completedDays.sort();
    }

    const startDate = new Date(dietPlan.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalWeeks = dietPlan.totalWeeks || 12;
    
    // Generate all dates and check completion
    for (let week = 1; week <= totalWeeks; week++) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dayDate = new Date(startDate);
        const daysToAdd = (week - 1) * 7 + dayOfWeek;
        dayDate.setDate(startDate.getDate() + daysToAdd);
        dayDate.setHours(0, 0, 0, 0);
        
        if (dayDate > today) break;
        
        // Format date consistently (use local date, not UTC)
        const year = dayDate.getFullYear();
        const month = String(dayDate.getMonth() + 1).padStart(2, '0');
        const day = String(dayDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
           
        const planIndex = dayDate.getDay();
        const planDay = dietPlan.weeklyPlan[planIndex];
        
        if (planDay && planDay.meals) {
          const expectedMeals = [
            `${dateString}-breakfast-${planDay.meals.breakfast?.name || ''}`,
            `${dateString}-lunch-${planDay.meals.lunch?.name || ''}`,
            `${dateString}-dinner-${planDay.meals.dinner?.name || ''}`,
            ...(planDay.meals.snacks || []).map((snack: any) => 
              `${dateString}-snack-${snack.name}`
            )
          ].filter(mealId => mealId && !mealId.endsWith('-'));
          
          if (expectedMeals.length > 0) {
            const completedForDate = dateToMeals.get(dateString) || new Set();
            const completedCount = expectedMeals.filter((mealId: string) => 
              completedForDate.has(mealId)
            ).length;
            const completionPercentage = (completedCount / expectedMeals.length) * 100;
            
            if (completionPercentage >= 50) {
              completedDays.push(dateString);
            }
          }
        }
      }
    }

    console.log('📊 StreakService: Diet completed days:', {
      count: completedDays.length,
      days: completedDays.slice(0, 5),
      allDates: completedDays
    });
    return completedDays.sort();
  }

  // Update streak data when activities are completed
  async updateStreakData(type: 'workout' | 'diet', completed: boolean): Promise<void> {
    
    try {
      const { getCurrentUserId, getUserCacheKey } = await import('../utils/cacheKeys');
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.warn('⚠️ No user ID, cannot update streak data');
        return;
      }
      
      // Helper function to format date consistently (local time, not UTC)
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const today = formatLocalDate(new Date());
      const baseKey = type === 'workout' ? 'completed_workout_days' : 'completed_diet_days';
      const storageKey = await getUserCacheKey(baseKey, userId);
      
      const completedDaysData = await Storage.getItem(storageKey);
      const daysList = completedDaysData ? JSON.parse(completedDaysData) : [];
      
      // Ensure it's an array
      if (!Array.isArray(daysList)) {
        console.warn(`⚠️ Invalid ${type} streak data format, resetting`);
        await Storage.setItem(storageKey, JSON.stringify([]));
        return;
      }
      
      if (completed && !daysList.includes(today)) {
        daysList.push(today);
        // Remove duplicates and sort
        const uniqueDays = Array.from(new Set(daysList)).sort();
        await Storage.setItem(storageKey, JSON.stringify(uniqueDays));
        console.log(`✅ ${type} streak updated for ${today} (user: ${userId})`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${type} streak:`, error);
    }
  }

  // Clear all streak data (user-specific)
  async clearStreakData(): Promise<void> {
    try {
      // ✅ CRITICAL: Use user-specific cache keys
      const { getCurrentUserId, getUserCacheKey } = await import('../utils/cacheKeys');
      const userId = await getCurrentUserId();
      
      if (!userId) {
        console.warn('⚠️ No user ID, cannot clear streak data');
        return;
      }
      
      const [workoutKey, dietKey] = await Promise.all([
        getUserCacheKey('completed_workout_days', userId),
        getUserCacheKey('completed_diet_days', userId)
      ]);
      
      await Promise.all([
        Storage.removeItem(workoutKey),
        Storage.removeItem(dietKey)
      ]);
      
      console.log(`🗑️ Streak data cleared for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error clearing streak data:', error);
    }
  }
}

export default new StreakService();
