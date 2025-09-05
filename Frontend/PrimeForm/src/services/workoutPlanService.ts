import { WorkoutPlan, WorkoutExercise } from './aiWorkoutService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Create or update workout plan
  async createWorkoutPlan(workoutPlan: WorkoutPlan): Promise<WorkoutPlanResponse> {
    try {
      console.log('💾 Saving workout plan to database...');
      const response = await this.makeRequest('/workout-plans', {
        method: 'POST',
        body: JSON.stringify(workoutPlan),
      });
      
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
      const response = await this.makeRequest('/workout-plans/active');
      
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
      const response = await this.makeRequest(`/workout-plans?page=${page}&limit=${limit}`);
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
      const response = await this.makeRequest('/workout-plans/exercise/complete', {
        method: 'POST',
        body: JSON.stringify({ exerciseId, day, week }),
      });
      
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
      const response = await this.makeRequest('/workout-plans/day/complete', {
        method: 'POST',
        body: JSON.stringify({ day, week }),
      });
      
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
      const response = await this.makeRequest('/workout-plans/stats');
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
      const response = await this.makeRequest(`/workout-plans/${planId}`, {
        method: 'DELETE',
      });
      
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
          await this.deleteWorkoutPlan(plan._id);
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
