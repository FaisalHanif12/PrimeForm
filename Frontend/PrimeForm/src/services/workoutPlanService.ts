import { WorkoutPlan, WorkoutExercise } from './aiWorkoutService';
import Storage from '../utils/storage';
import { api } from '../config/api';

export interface WorkoutPlanResponse {
  success: boolean;
  message: string;
  data?: WorkoutPlan;
}

export interface WorkoutPlanListResponse {
  success: boolean;
  message: string;
  data?: {
    workoutPlans: WorkoutPlan[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface WorkoutStatsResponse {
  success: boolean;
  message: string;
  data?: {
    totalDays: number;
    completedDays: number;
    totalExercises: number;
    completedExercises: number;
    progress: number;
    startDate: string;
    endDate: string;
    duration: string;
  };
}

class WorkoutPlanService {

  // Create or update workout plan
  async createWorkoutPlan(workoutPlan: WorkoutPlan): Promise<WorkoutPlanResponse> {
    try {
      console.log('💾 Saving workout plan to database...');
      const response = await api.post('/workout-plans', workoutPlan);
      
      console.log('✅ Workout plan saved to database');
      return response;
    } catch (error) {
      console.error('❌ Error saving workout plan to database:', error);
      throw error;
    }
  }

  // Get active workout plan for user
  async getActiveWorkoutPlan(): Promise<WorkoutPlanResponse> {
    try {
      console.log('📱 Loading workout plan from database...');
      const response = await api.get('/workout-plans/active');
      
      if (response.success && response.data) {
        console.log('✅ Workout plan loaded from database');
      } else {
        console.log('ℹ️ No active workout plan found');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error loading workout plan from database:', error);
      throw error;
    }
  }

  // Get all workout plans for user
  async getUserWorkoutPlans(page: number = 1, limit: number = 10): Promise<WorkoutPlanListResponse> {
    try {
      const response = await api.get(`/workout-plans?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('❌ Error loading workout plans:', error);
      throw error;
    }
  }

  // Mark exercise as completed
  async markExerciseCompleted(exerciseId: string, day: number, week: number): Promise<WorkoutPlanResponse> {
    try {
      console.log(`✅ Marking exercise ${exerciseId} as completed (Day ${day}, Week ${week})`);
      const response = await api.post('/workout-plans/exercise/complete', { exerciseId, day, week });
      
      console.log('✅ Exercise marked as completed in database');
      return response;
    } catch (error) {
      console.error('❌ Error marking exercise completed:', error);
      throw error;
    }
  }

  // Mark day as completed
  async markDayCompleted(day: number, week: number): Promise<WorkoutPlanResponse> {
    try {
      console.log(`✅ Marking day ${day} as completed (Week ${week})`);
      const response = await api.post('/workout-plans/day/complete', { day, week });
      
      console.log('✅ Day marked as completed in database');
      return response;
    } catch (error) {
      console.error('❌ Error marking day completed:', error);
      throw error;
    }
  }

  // Get workout statistics
  async getWorkoutStats(): Promise<WorkoutStatsResponse> {
    try {
      const response = await api.get('/workout-plans/stats');
      return response;
    } catch (error) {
      console.error('❌ Error loading workout stats:', error);
      throw error;
    }
  }

  // Delete workout plan
  async deleteWorkoutPlan(planId: string): Promise<WorkoutPlanResponse> {
    try {
      console.log(`🗑️ Deleting workout plan ${planId}`);
      const response = await api.delete(`/workout-plans/${planId}`);
      
      console.log('✅ Workout plan deleted from database');
      return response;
    } catch (error) {
      console.error('❌ Error deleting workout plan:', error);
      throw error;
    }
  }

  // Clear all workout plans (for testing)
  async clearAllWorkoutPlans(): Promise<void> {
    try {
      console.log('🗑️ Clearing all workout plans...');
      const plansResponse = await this.getUserWorkoutPlans(1, 100);
      
      if (plansResponse.success && plansResponse.data) {
        const plans = plansResponse.data.workoutPlans;
        for (const plan of plans) {
          // Use the plan's _id or id field
          const planId = plan._id || plan.id;
          if (planId) {
            await this.deleteWorkoutPlan(planId);
          }
        }
        console.log('✅ All workout plans cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing workout plans:', error);
      throw error;
    }
  }
}

export default new WorkoutPlanService();
