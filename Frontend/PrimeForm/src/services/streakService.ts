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
}

interface StreakServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class StreakService {

  // Get comprehensive streak data
  async getStreakData(): Promise<StreakServiceResponse<StreakData>> {
    try {
      console.log('📊 Loading streak data...');

      // Try to get data from backend first
      try {
        const response = await api.get('/streak/data');
        if (response.data.success) {
          return response.data;
        }
      } catch (error) {
        console.warn('⚠️ Backend not available, calculating from local data');
      }

      // Calculate from local data as fallback
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
      // Load completion data
      const completedExercises = await Storage.getItem('completed_exercises') || '[]';
      const completedMeals = await Storage.getItem('completed_meals') || '[]';
      const completedWorkoutDays = await Storage.getItem('completed_workout_days') || '[]';
      const completedDietDays = await Storage.getItem('completed_diet_days') || '[]';

      const exercisesList = JSON.parse(completedExercises);
      const mealsList = JSON.parse(completedMeals);
      const workoutDaysList = JSON.parse(completedWorkoutDays);
      const dietDaysList = JSON.parse(completedDietDays);

      // Generate daily activity history for last 90 days
      const streakHistory = this.generateStreakHistory(workoutDaysList, dietDaysList);

      // Calculate current streaks
      const currentWorkoutStreak = this.calculateCurrentStreak(workoutDaysList);
      const currentDietStreak = this.calculateCurrentStreak(dietDaysList);
      const currentOverallStreak = this.calculateOverallStreak(streakHistory);

      // Calculate longest streaks
      const longestWorkoutStreak = this.calculateLongestStreak(workoutDaysList);
      const longestDietStreak = this.calculateLongestStreak(dietDaysList);
      const longestOverallStreak = this.calculateLongestOverallStreak(streakHistory);

      // Calculate consistency percentages
      const weeklyConsistency = this.calculateWeeklyConsistency(streakHistory);
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
        milestones
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
        milestones: []
      };
    }
  }

  // Generate daily activity history
  private generateStreakHistory(workoutDays: string[], dietDays: string[]): Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }> {
    const history = [];
    const today = new Date();
    
    // Generate last 90 days
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const workoutCompleted = workoutDays.includes(dateString);
      const dietCompleted = dietDays.includes(dateString);
      const overallCompleted = workoutCompleted && dietCompleted;
      
      history.push({
        date: dateString,
        workoutCompleted,
        dietCompleted,
        overallCompleted
      });
    }
    
    return history;
  }

  // Calculate current streak from today backwards
  private calculateCurrentStreak(completedDays: string[]): number {
    if (completedDays.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const sortedDays = completedDays.sort().reverse();
    
    let streak = 0;
    const currentDate = new Date();
    
    // Check if today is included
    if (!sortedDays.includes(today)) {
      return 0; // Streak broken if today not completed
    }
    
    // Count consecutive days backwards from today
    for (let i = 0; i < 365; i++) { // Check up to a year
      const checkDate = new Date(currentDate);
      checkDate.setDate(currentDate.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      if (sortedDays.includes(dateString)) {
        streak++;
      } else {
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
    let streak = 0;
    const reversedHistory = [...history].reverse();
    
    for (const day of reversedHistory) {
      if (day.overallCompleted) {
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

    const sortedDays = completedDays.sort();
    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1]);
      const currentDate = new Date(sortedDays[i]);
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

  // Calculate longest overall streak
  private calculateLongestOverallStreak(history: Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }>): number {
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (const day of history) {
      if (day.overallCompleted) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  }

  // Calculate weekly consistency percentage
  private calculateWeeklyConsistency(history: Array<{
    date: string;
    workoutCompleted: boolean;
    dietCompleted: boolean;
    overallCompleted: boolean;
  }>): number {
    const lastWeek = history.slice(-7);
    const completedDays = lastWeek.filter(day => day.overallCompleted).length;
    return Math.round((completedDays / 7) * 100);
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

  // Update streak data when activities are completed
  async updateStreakData(type: 'workout' | 'diet', completed: boolean): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = type === 'workout' ? 'completed_workout_days' : 'completed_diet_days';
      
      const completedDays = await Storage.getItem(storageKey) || '[]';
      const daysList = JSON.parse(completedDays);
      
      if (completed && !daysList.includes(today)) {
        daysList.push(today);
        await Storage.setItem(storageKey, JSON.stringify(daysList));
        console.log(`✅ ${type} streak updated for ${today}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${type} streak:`, error);
    }
  }

  // Clear all streak data
  async clearStreakData(): Promise<void> {
    try {
      await Storage.removeItem('completed_workout_days');
      await Storage.removeItem('completed_diet_days');
      console.log('🗑️ Streak data cleared');
    } catch (error) {
      console.error('❌ Error clearing streak data:', error);
    }
  }
}

export default new StreakService();
