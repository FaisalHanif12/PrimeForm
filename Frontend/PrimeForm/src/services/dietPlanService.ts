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
      const response = await api.post('/diet-plans', dietPlan);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get active diet plan for user
  async getActiveDietPlan(): Promise<DietPlanResponse> {
    try {
      const response = await api.get('/diet-plans/active');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get all diet plans for user
  async getUserDietPlans(page: number = 1, limit: number = 10): Promise<DietPlanListResponse> {
    try {
      const response = await api.get(`/diet-plans?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Mark meal as completed
  async markMealCompleted(mealId: string, day: number, week: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): Promise<DietPlanResponse> {
    try {
      const response = await api.post('/diet-plans/meal/complete', { mealId, day, week, mealType });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Mark day as completed
  async markDayCompleted(day: number, week: number): Promise<DietPlanResponse> {
    try {
      const response = await api.post('/diet-plans/day/complete', { day, week });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Log water intake
  async logWaterIntake(day: number, week: number, amount: number): Promise<DietPlanResponse> {
    try {
      const response = await api.post('/diet-plans/water/log', { day, week, amount });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get diet statistics
  async getDietStats(): Promise<DietStatsResponse> {
    try {
      const response = await api.get('/diet-plans/stats');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Delete diet plan
  async deleteDietPlan(planId: string): Promise<DietPlanResponse> {
    try {
      const response = await api.delete(`/diet-plans/${planId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Clear all diet plans (for testing)
  async clearAllDietPlans(): Promise<void> {
    try {
      // First, try to get and delete the active plan directly (most common case)
      try {
        const activePlanResponse = await this.getActiveDietPlan();
        if (activePlanResponse.success && activePlanResponse.data) {
          const planId = activePlanResponse.data._id || activePlanResponse.data.id;
          if (planId) {
            await this.deleteDietPlan(planId);
          }
        }
      } catch (activeError) {
        // Ignore if active plan doesn't exist
      }
      
      // Then, try to get and delete all plans (including inactive ones)
      try {
        const plansResponse = await this.getUserDietPlans(1, 100);
        
        if (plansResponse.success && plansResponse.data && plansResponse.data.dietPlans) {
          const plans = plansResponse.data.dietPlans;
          // Check if plans is an array and has items
          if (Array.isArray(plans) && plans.length > 0) {
            for (const plan of plans) {
              // Use the plan's _id or id field
              const planId = plan._id || plan.id;
              if (planId) {
                try {
                  await this.deleteDietPlan(planId);
                } catch (deleteError) {
                  // Continue with other plans even if one fails
                }
              }
            }
          }
        }
      } catch (allPlansError) {
        // Ignore errors
      }
    } catch (error) {
      // Don't throw - allow deletion to continue even if API call fails
      // This ensures local cache can still be cleared
    }
  }

  // Sync diet plan duration with workout plan
  async syncWithWorkoutPlan(workoutDuration: string, workoutGoal: string): Promise<DietPlanResponse> {
    try {
      const response = await api.post('/diet-plans/sync-workout', { 
        workoutDuration, 
        workoutGoal 
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new DietPlanService();
