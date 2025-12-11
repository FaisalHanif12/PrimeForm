import AsyncStorage from '@react-native-async-storage/async-storage';

interface RateLimitConfig {
  maxGenerations: number;
  cooldownMinutes: number;
}

interface GenerationRecord {
  timestamp: number;
  type: 'diet' | 'workout';
}

class RateLimitService {
  private readonly STORAGE_KEY = 'ai_generation_history';
  
  // Rate limit configuration
  private readonly DIET_CONFIG: RateLimitConfig = {
    maxGenerations: 1,
    cooldownMinutes: 5, // 5 minutes cooldown between diet generations
  };
  
  private readonly WORKOUT_CONFIG: RateLimitConfig = {
    maxGenerations: 2,
    cooldownMinutes: 3, // 3 minutes cooldown between workout generations
  };

  /**
   * Check if user can generate a new AI plan
   */
  async canGenerate(type: 'diet' | 'workout'): Promise<{
    allowed: boolean;
    remainingTime?: number; // seconds
    message?: string;
  }> {
    try {
      const config = type === 'diet' ? this.DIET_CONFIG : this.WORKOUT_CONFIG;
      const history = await this.getGenerationHistory();
      
      // Filter records for this type
      const typeRecords = history.filter(r => r.type === type);
      
      if (typeRecords.length === 0) {
        return { allowed: true };
      }
      
      // Get most recent generation
      const lastGeneration = typeRecords.sort((a, b) => b.timestamp - a.timestamp)[0];
      const now = Date.now();
      const timeSinceLastGen = now - lastGeneration.timestamp;
      const cooldownMs = config.cooldownMinutes * 60 * 1000;
      
      if (timeSinceLastGen < cooldownMs) {
        const remainingTime = Math.ceil((cooldownMs - timeSinceLastGen) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        
        return {
          allowed: false,
          remainingTime,
          message: `Please wait ${minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`} before generating a new ${type} plan.`,
        };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow generation if check fails
      return { allowed: true };
    }
  }

  /**
   * Record a new generation
   */
  async recordGeneration(type: 'diet' | 'workout'): Promise<void> {
    try {
      const history = await this.getGenerationHistory();
      
      const newRecord: GenerationRecord = {
        timestamp: Date.now(),
        type,
      };
      
      // Add new record
      history.push(newRecord);
      
      // Clean old records (keep last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const cleanedHistory = history.filter(r => r.timestamp > thirtyDaysAgo);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedHistory));
    } catch (error) {
      console.error('Failed to record generation:', error);
    }
  }

  /**
   * Get generation history
   */
  private async getGenerationHistory(): Promise<GenerationRecord[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }
      return JSON.parse(data) as GenerationRecord[];
    } catch (error) {
      console.error('Failed to get generation history:', error);
      return [];
    }
  }

  /**
   * Get generation stats for UI display
   */
  async getGenerationStats(): Promise<{
    diet: { total: number; lastGenerated?: Date };
    workout: { total: number; lastGenerated?: Date };
  }> {
    try {
      const history = await this.getGenerationHistory();
      
      const dietRecords = history.filter(r => r.type === 'diet');
      const workoutRecords = history.filter(r => r.type === 'workout');
      
      const getLastGenerated = (records: GenerationRecord[]) => {
        if (records.length === 0) return undefined;
        const latest = records.sort((a, b) => b.timestamp - a.timestamp)[0];
        return new Date(latest.timestamp);
      };
      
      return {
        diet: {
          total: dietRecords.length,
          lastGenerated: getLastGenerated(dietRecords),
        },
        workout: {
          total: workoutRecords.length,
          lastGenerated: getLastGenerated(workoutRecords),
        },
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        diet: { total: 0 },
        workout: { total: 0 },
      };
    }
  }

  /**
   * Clear generation history (for testing or user request)
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }
}

export default new RateLimitService();
