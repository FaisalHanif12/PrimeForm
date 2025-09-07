import { DietPlan, DietMeal } from './aiDietService';
import Storage from '../utils/storage';
import { api } from '../config/api';

export interface DietPlanResponse {
  success: boolean;
  message: string;
  data?: DietPlan;
}

export interface DietPlanListResponse {
  success: boolean;
  message: string;
  data?: {
    dietPlans: DietPlan[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface DietStatsResponse {
  success: boolean;
  message: string;
  data?: {
    totalDays: number;
    completedDays: number;
    totalMeals: number;
    completedMeals: number;
    progress: number;
    startDate: string;
    endDate: string;
    duration: string;
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFats: number;
  };
}

class DietPlanService {

  // Create or update diet plan
  async createDietPlan(dietPlan: DietPlan): Promise<DietPlanResponse> {
    try {
      console.log('💾 Saving diet plan to database...');
      const response = await api.post('/diet-plans', dietPlan);
      
      console.log('✅ Diet plan saved to database');
      return response;
    } catch (error) {
      console.error('❌ Error saving diet plan to database:', error);
      throw error;
    }
  }

  // Get active diet plan for user
  async getActiveDietPlan(): Promise<DietPlanResponse> {
    try {
      console.log('📱 Loading diet plan from database...');
      const response = await api.get('/diet-plans/active');
      
      if (response.success && response.data) {
        console.log('✅ Diet plan loaded from database');
      } else {
        console.log('ℹ️ No active diet plan found');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error loading diet plan from database:', error);
      throw error;
    }
  }

  // Get all diet plans for user
  async getUserDietPlans(page: number = 1, limit: number = 10): Promise<DietPlanListResponse> {
    try {
      const response = await api.get(`/diet-plans?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Error loading diet plans:', error);
      throw error;
    }
  }

  // Mark meal as completed
  async markMealCompleted(mealId: string, day: number, week: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): Promise<DietPlanResponse> {
    try {
      console.log(`✅ Marking meal ${mealId} as completed (Day ${day}, Week ${week}, Type: ${mealType})`);
      const response = await api.post('/diet-plans/meal/complete', { mealId, day, week, mealType });
      
      console.log('✅ Meal marked as completed in database');
      return response;
    } catch (error) {
      console.error('❌ Error marking meal completed:', error);
      throw error;
    }
  }

  // Mark day as completed
  async markDayCompleted(day: number, week: number): Promise<DietPlanResponse> {
    try {
      console.log(`✅ Marking day ${day} as completed (Week ${week})`);
      const response = await api.post('/diet-plans/day/complete', { day, week });
      
      console.log('✅ Day marked as completed in database');
      return response;
    } catch (error) {
      console.error('❌ Error marking day completed:', error);
      throw error;
    }
  }

  // Log water intake
  async logWaterIntake(day: number, week: number, amount: number): Promise<DietPlanResponse> {
    try {
      console.log(`💧 Logging water intake: ${amount}ml (Day ${day}, Week ${week})`);
      const response = await api.post('/diet-plans/water/log', { day, week, amount });
      
      console.log('✅ Water intake logged in database');
      return response;
    } catch (error) {
      console.error('❌ Error logging water intake:', error);
      throw error;
    }
  }

  // Get diet statistics
  async getDietStats(): Promise<DietStatsResponse> {
    try {
      const response = await api.get('/diet-plans/stats');
      return response;
    } catch (error) {
      console.error('❌ Error loading diet stats:', error);
      throw error;
    }
  }

  // Delete diet plan
  async deleteDietPlan(planId: string): Promise<DietPlanResponse> {
    try {
      console.log(`🗑️ Deleting diet plan ${planId}`);
      const response = await api.delete(`/diet-plans/${planId}`);
      
      console.log('✅ Diet plan deleted from database');
      return response;
    } catch (error) {
      console.error('❌ Error deleting diet plan:', error);
      throw error;
    }
  }

  // Clear all diet plans (for testing)
  async clearAllDietPlans(): Promise<void> {
    try {
      console.log('🗑️ Clearing all diet plans...');
      const plansResponse = await this.getUserDietPlans(1, 100);
      
      if (plansResponse.success && plansResponse.data) {
        const plans = plansResponse.data.dietPlans;
        for (const plan of plans) {
          // Use the plan's _id or id field
          const planId = plan._id || plan.id;
          if (planId) {
            await this.deleteDietPlan(planId);
          }
        }
        console.log('✅ All diet plans cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing diet plans:', error);
      throw error;
    }
  }

  // Sync diet plan duration with workout plan
  async syncWithWorkoutPlan(workoutDuration: string, workoutGoal: string): Promise<DietPlanResponse> {
    try {
      console.log(`🔄 Syncing diet plan with workout: ${workoutDuration}, ${workoutGoal}`);
      const response = await api.post('/diet-plans/sync-workout', { 
        workoutDuration, 
        workoutGoal 
      });
      
      console.log('✅ Diet plan synced with workout plan');
      return response;
    } catch (error) {
      console.error('❌ Error syncing diet plan with workout:', error);
      throw error;
    }
  }
}

export default new DietPlanService();
