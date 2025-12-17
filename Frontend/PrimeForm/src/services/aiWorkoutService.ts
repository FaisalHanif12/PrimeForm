import { UserProfile } from './userProfileService';
import workoutPlanService from './workoutPlanService';
import Storage from '../utils/storage';
import { getUserCacheKey, getCurrentUserId, validateCachedData } from '../utils/cacheKeys';
import { calculatePlanDuration, formatDurationForPrompt, PlanDuration } from '../utils/planDurationCalculator';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://primeform.app';
const SITE_NAME = process.env.EXPO_PUBLIC_SITE_NAME || 'Pure Body';

export interface WorkoutExercise {
  name: string;
  emoji: string;
  sets: number;
  reps: number;
  rest: string;
  targetMuscles: string[];
  caloriesBurned: number;
}

export interface WorkoutDay {
  day: number;
  dayName: string;
  date: string;
  isRestDay: boolean;
  exercises: WorkoutExercise[];
  warmUp: string;
  coolDown: string;
  totalCalories: number;
}

export interface WorkoutPlan {
  _id?: string;
  id?: string;
  goal: string;
  duration: string;
  keyNotes: string[];
  weeklyPlan: WorkoutDay[];
  startDate: string;
  endDate: string;
  totalWeeks?: number;
  completedExercises?: string[];
  completedDays?: string[];
}

export interface AIWorkoutResponse {
  success: boolean;
  data: WorkoutPlan | null;
  message: string;
}

class AIWorkoutService {
  private loadingCache: Map<string, Promise<any>> = new Map();
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache - workout plan rarely changes

  private async getCachedData(key: string): Promise<any | null> {
    const cached = this.dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      // Validate cached data belongs to current user
      const { getCurrentUserId, validateCachedData } = await import('../utils/cacheKeys');
      const userId = await getCurrentUserId();
      if (userId && validateCachedData(cached.data, userId)) {
        return cached.data;
      } else {
        // Cached data doesn't belong to current user, clear it
        this.dataCache.delete(key);
        return null;
      }
    }
    return null;
  }

  private async setCachedData(key: string, data: any): Promise<void> {
    // Add userId to cached data for validation
    const { getCurrentUserId } = await import('../utils/cacheKeys');
    const userId = await getCurrentUserId();
    const dataWithUserId = userId ? { ...data, userId } : data;
    this.dataCache.set(key, { data: dataWithUserId, timestamp: Date.now() });
  }

  private clearCache(key?: string): void {
    if (key) {
      this.dataCache.delete(key);
      this.loadingCache.delete(key);
    } else {
      this.dataCache.clear();
      this.loadingCache.clear();
    }
  }

  // Public method to clear all in-memory cache (called on user change)
  clearInMemoryCache(): void {
    this.dataCache.clear();
    this.loadingCache.clear();
    console.log('✅ AI Workout Service in-memory cache cleared');
  }

  private generatePrompt(userProfile: UserProfile): string {
    const targetWeightLine =
      userProfile.bodyGoal?.includes('Gain') || userProfile.bodyGoal?.includes('Lose') || userProfile.bodyGoal?.includes('Fat')
        ? `- Target Weight: ${userProfile.targetWeight ? `${userProfile.targetWeight} kg` : 'Not provided'}`
        : null;

    // Calculate optimal plan duration based on user profile
    const planDuration = calculatePlanDuration(userProfile);
    const durationForPrompt = formatDurationForPrompt(planDuration);

    const prompt = `
You are a world-class certified fitness trainer with 15+ years of experience in highly personalized training programs.  
Create an EXTREMELY PERSONALIZED and HIGHLY SPECIFIC **7-day workout plan** based on this EXACT user profile:

### CRITICAL USER ANALYSIS
- Age: ${userProfile.age} years (${userProfile.age < 25 ? 'Young adult - higher recovery, can handle intense training' : userProfile.age < 40 ? 'Adult - balanced approach, moderate recovery' : userProfile.age < 55 ? 'Middle-aged - focus on joint health, longer recovery' : 'Mature - emphasize mobility, low-impact exercises'})
- Gender: ${userProfile.gender} (${userProfile.gender === 'Male' ? 'Typically higher muscle mass, focus on strength' : 'Often better flexibility, may need more upper body focus'})
- Height: ${userProfile.height} cm | Weight: ${userProfile.currentWeight} kg${targetWeightLine ? ` → ${userProfile.targetWeight} kg` : ''}
${targetWeightLine ? `${targetWeightLine}\n` : ''}- BMI: ${(Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)).toFixed(1)} (${(Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 18.5 ? 'UNDERWEIGHT - FOCUS ON MUSCLE BUILDING' : (Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 25 ? 'NORMAL - BALANCED APPROACH' : (Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 30 ? 'OVERWEIGHT - EMPHASIZE CARDIO & FAT LOSS' : 'OBESE - LOW-IMPACT, GRADUAL PROGRESSION'})
- BMI: ${(Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)).toFixed(1)} (${(Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 18.5 ? 'UNDERWEIGHT - FOCUS ON MUSCLE BUILDING' : (Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 25 ? 'NORMAL - BALANCED APPROACH' : (Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 30 ? 'OVERWEIGHT - EMPHASIZE CARDIO & FAT LOSS' : 'OBESE - LOW-IMPACT, GRADUAL PROGRESSION'})
- PRIMARY GOAL: ${userProfile.bodyGoal} (THIS IS THE #1 PRIORITY - EVERY EXERCISE MUST ALIGN WITH THIS GOAL)
- Fitness Level: Beginner (START SLOW, FOCUS ON FORM, BASIC MOVEMENTS)
- Available Equipment: ${userProfile.availableEquipment} (STRICTLY USE ONLY THESE TOOLS - NO EXCEPTIONS)
- Occupation: ${userProfile.occupationType} (${userProfile.occupationType?.includes('Desk') ? 'SEDENTARY - EMPHASIZE POSTURE, MOBILITY' : userProfile.occupationType?.includes('Active') ? 'ALREADY ACTIVE - COMPLEMENT WITH DIFFERENT MOVEMENTS' : 'ADAPT TO WORK SCHEDULE'})
- Medical Conditions: ${userProfile.medicalConditions || 'None'} (${userProfile.medicalConditions ? 'CRITICAL - MODIFY ALL EXERCISES FOR SAFETY' : 'NO RESTRICTIONS - FULL INTENSITY ALLOWED'})

### STRICT PERSONALIZATION RULES
1. **EQUIPMENT CONSTRAINT**: Use ONLY equipment listed in availableEquipment. If "No Equipment" - bodyweight only!
2. **GOAL ALIGNMENT**: Every exercise must directly support the bodyGoal (${userProfile.bodyGoal})
3. **FITNESS LEVEL RESPECT**: Beginner means specific rep/set ranges and exercise complexity
4. **AGE APPROPRIATE**: ${userProfile.age} years requires specific recovery times and exercise selection
5. **MEDICAL SAFETY**: ${userProfile.medicalConditions ? 'MANDATORY modifications for medical conditions' : 'No medical restrictions'}

### MANDATORY STRUCTURE REQUIREMENTS
1. **CRITICAL - PLAN DURATION (MUST USE THIS EXACT DURATION):**
   - This workout plan must be designed for a total duration of **${durationForPrompt}**
   - The 7-day plan you create will repeat weekly for ${planDuration.totalWeeks} weeks
   - Ensure the plan supports progressive overload and sustainable progress over this entire period
   - Use Duration: **${planDuration.duration}** in your output (exactly as specified)
   - DO NOT calculate your own duration - use the one provided above  

2. Equipment Adaptation - CRITICAL:  
   - If user has **full gym access** → use gym-based exercises.  
   - If user has **home/no equipment** → provide only bodyweight or home-friendly exercises.  
   - NEVER suggest equipment the user doesn't have!

3. The 7-day plan must include:  
   - **6 workout days** + **1 active recovery day** perfectly tailored to this user.  
   - Each workout day should have a **different focus** based on user's specific goal.  
   - For each exercise, provide EXACT details for this user's profile.

4. Always include personalized warm-up and cool-down for this user's age and condition.

5. **PERSONALIZATION BASED ON FITNESS LEVEL**:
   - If BEGINNER: Start with basic exercises, lighter intensity, longer rest periods (60-90s)
   - If INTERMEDIATE: Moderate intensity, compound movements, standard rest (45-75s)  
   - If ADVANCED: High intensity, complex movements, shorter rest (30-60s)

6. Tone should be **encouraging and specifically motivating for this user's goal and situation**.

7. Output format (must follow exactly):  

**Goal:** [goal]  
**Duration:** ${planDuration.duration} (MUST use this exact duration)  

---

#### 📅 Week 1 — Day-by-Day Plan  

**Day 1: [Workout Focus + Icon]**  
- Exercise 1 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Exercise 2 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Note: How to do the exercise correctly.   
- ✅ Warm-up (5–10 min) & Cool-down (5–10 min)  

---

**Day 2: [Workout Focus + Icon]**  
- Exercise 1 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Note: How to do the exercise correctly.
- Exercise 2 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- ✅ Warm-up & Cool-down included  

---

**Day 3: [Workout Focus + Icon]**  
- Exercise 1 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Exercise 2 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- ✅ Warm-up & Cool-down included  

---

**Day 4: [Workout Focus + Icon]**  
- Exercise 1 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Exercise 2 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- ✅ Warm-up & Cool-down included  

---

**Day 5: [Workout Focus + Icon]**  
- Exercise 1 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Exercise 2 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- ✅ Warm-up & Cool-down included  

---

**Day 6: [Workout Focus + Icon]**  
- Exercise 1 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Exercise 2 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- ✅ Warm-up & Cool-down included  

---

**Day 7: [Rest/Recovery Day + Icon]**  
- Active Recovery Activities
- Light stretching and mobility work
- ✅ Focus on recovery and preparation for next week

Generate the **final personalized plan now.**
    `;

    return prompt;
  }

  async generateWorkoutPlan(userProfile: UserProfile): Promise<AIWorkoutResponse> {
    try {
      // Check if API key is available
      if (!OPENROUTER_API_KEY) {
        throw new Error('Sorry for the inconvenience. AI is temporarily unavailable.');
      }
      
      const prompt = this.generatePrompt(userProfile);

      const startTime = Date.now();

      // Make API call without timeout - let it generate as fast as possible
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for faster, more consistent responses
          max_tokens: 3000, // Reduced for faster generation
          stream: false,
          top_p: 0.8, // Slightly lower for faster responses
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status: ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from AI');
      }

      const aiResponse = data.choices[0].message.content;

      // Parse the AI response into structured data
      const workoutPlan = this.parseAIResponse(aiResponse, userProfile);

      // Store the response in database for persistence with retry logic
      let saveResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          saveResponse = await workoutPlanService.createWorkoutPlan(workoutPlan);
          if (saveResponse.success) {
            // Also cache locally as backup with user-specific key
            const userId = await getCurrentUserId();
            if (userId) {
              const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
              const dataToCache = { ...workoutPlan, userId };
              await Storage.setItem(userCacheKey, JSON.stringify(dataToCache));
            }
            break;
          } else {
            throw new Error(`Database save failed: ${saveResponse.message}`);
          }
        } catch (error) {
          retryCount++;
          
          if (retryCount >= maxRetries) {
            // Cache locally as fallback with user-specific key
            const userId = await getCurrentUserId();
            if (userId) {
              const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
              const dataToCache = { ...workoutPlan, userId };
              await Storage.setItem(userCacheKey, JSON.stringify(dataToCache));
            }
            // Don't throw error - allow user to use the plan even if not saved to DB
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      return {
        success: true,
        data: workoutPlan,
        message: `Workout plan generated successfully in ${(responseTime / 1000).toFixed(2)}s`
      };

    } catch (error) {
      // Re-throw the error to be handled by the calling component
      throw error;
    }
  }

  // Load workout plan - prioritizes local cache to minimize API calls
  async loadWorkoutPlanFromDatabase(forceRefresh = false): Promise<WorkoutPlan | null> {
    const cacheKey = 'workout-plan-active';
    
    // Check if there's already a request in flight
    if (this.loadingCache.has(cacheKey)) {
      return this.loadingCache.get(cacheKey);
    }

    // Check memory cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Create new request and cache the promise to prevent duplicates
    const request = (async () => {
      try {
        // OPTIMIZATION: Try local storage first to avoid API call
        if (!forceRefresh) {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
              const cachedPlan = await Storage.getItem(userCacheKey);
              if (cachedPlan) {
                const plan = JSON.parse(cachedPlan);
                // Validate cached data belongs to current user
                if (validateCachedData(plan, userId)) {
                  await this.setCachedData(cacheKey, plan);
                  return plan;
                }
              }
            }
          } catch (cacheError) {
            // Could not load from local cache
          }
        }

        // Only call API if no local cache or forcing refresh
        const response = await workoutPlanService.getActiveWorkoutPlan();
        if (response.success && response.data) {
          await this.setCachedData(cacheKey, response.data);
          // Also update local cache with user-specific key
          const userId = await getCurrentUserId();
          if (userId) {
            const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
            // Add userId to cached data for validation
            const dataToCache = { ...response.data, userId };
            await Storage.setItem(userCacheKey, JSON.stringify(dataToCache));
          }
          return response.data;
        }
      } catch (error) {
        // Try to load from local cache as fallback
        try {
          const userId = await getCurrentUserId();
          if (userId) {
            const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
            const cachedPlan = await Storage.getItem(userCacheKey);
            if (cachedPlan) {
              const plan = JSON.parse(cachedPlan);
              // Validate cached data belongs to current user
              if (validateCachedData(plan, userId)) {
                await this.setCachedData(cacheKey, plan);
                return plan;
              }
            }
          }
        } catch (cacheError) {
          // Could not load from cache either
        }
      } finally {
        // Remove from loading cache after request completes
        this.loadingCache.delete(cacheKey);
      }
      return null;
    })();

    // Cache the promise to prevent duplicate requests
    this.loadingCache.set(cacheKey, request);
    return request;
  }

  // Force refresh workout plan from database (use after completing actions)
  async refreshWorkoutPlanFromDatabase(): Promise<WorkoutPlan | null> {
    return this.loadWorkoutPlanFromDatabase(true);
  }

  // Clear workout plan from database
  async clearWorkoutPlanFromDatabase(): Promise<void> {
    try {
      // Clear from database first
      await workoutPlanService.clearAllWorkoutPlans();

      // Clear local cache (both user-specific and old global)
      const userId = await getCurrentUserId();
      if (userId) {
        const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
        await Storage.removeItem(userCacheKey);
        
        // Also clear all related workout completion data
        const completedExercisesKey = await getUserCacheKey('completed_exercises', userId);
        const completedDaysKey = await getUserCacheKey('completed_days', userId);
        
        await Storage.removeItem(completedExercisesKey);
        await Storage.removeItem(completedDaysKey);
      }
      
      // Clear old global keys for migration
      await Storage.removeItem('cached_workout_plan');
      await Storage.removeItem('completed_exercises');
      await Storage.removeItem('completed_days');

      // Clear memory cache
      this.clearCache('workout-plan-active');
      
      if (__DEV__) {
        console.log('✅ Workout plan and all related data cleared successfully');
      }
    } catch (error) {
      console.error('❌ Error clearing workout plan from database:', error);
      // Still try to clear local cache even if database clear fails
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const userCacheKey = await getUserCacheKey('cached_workout_plan', userId);
          await Storage.removeItem(userCacheKey);
        }
        await Storage.removeItem('cached_workout_plan');
        this.clearCache('workout-plan-active');
      } catch (cacheError) {
        console.error('❌ Error clearing local cache:', cacheError);
      }
    }
  }


  private parseAIResponse(aiResponse: string, userProfile: UserProfile): WorkoutPlan {
    // Calculate optimal plan duration based on user profile (PRIORITY - use this over AI response)
    const planDuration = calculatePlanDuration(userProfile);
    
    // Extract goal from the AI response (still parse this from AI)
    const goalMatch = aiResponse.match(/\*\*Goal:\*\*\s*(.+?)(?:\n|$)/i);

    const goal = goalMatch ? goalMatch[1].trim() : userProfile.bodyGoal || 'General Fitness';
    
    // Use calculated duration (not from AI) to ensure consistency
    const duration = planDuration.duration;
    const totalWeeks = planDuration.totalWeeks;

    // Parse the AI response to extract workout days
    const weeklyPlan: WorkoutDay[] = this.parseAIWorkoutDays(aiResponse);

    // Calculate dates based on calculated duration
    // CRITICAL: Use local date (not UTC) to ensure correct day
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Set to midnight local time
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (totalWeeks * 7));
    endDate.setHours(0, 0, 0, 0);

    // Format as local date string (YYYY-MM-DD) to avoid timezone issues
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      goal: goal,
      duration: duration,
      keyNotes: [
        'Start with lighter weights and focus on form',
        'Listen to your body and rest when needed',
        'Stay hydrated throughout your workouts',
        'Track your progress weekly'
      ],
      weeklyPlan: weeklyPlan, // Keep the 7-day pattern
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
      totalWeeks: totalWeeks // Add this for frontend reference
    };
  }

  private parseAIWorkoutDays(aiResponse: string): WorkoutDay[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyPlan: WorkoutDay[] = [];

    // Split the response into day sections using --- as delimiter
    const daySections = aiResponse.split(/---/).filter(section => section.trim());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Find the corresponding day section - look for Day 1:, Day 2:, etc.
      const dayNumber = i + 1;
      const daySection = daySections.find(section => {
        const sectionText = section.toLowerCase();
        return sectionText.includes(`day ${dayNumber}:`) || 
               sectionText.includes(`**day ${dayNumber}:`) ||
               sectionText.includes(`day ${dayNumber} `);
      });

      if (daySection) {
        // Get the day title to determine workout focus and rest days
        const lines = daySection.split('\n').map(l => l.trim()).filter(Boolean);
        const headerLine = lines.find(l => /\*\*day\s+\d+:/i.test(l)) || '';
        const headerLower = headerLine.toLowerCase();
        
        // Check if it's a rest/recovery day
        const isRestDay = headerLower.includes('rest') || headerLower.includes('recovery') || headerLower.includes('🛌') || headerLower.includes('🏃‍♂️');
        
        if (isRestDay) {
          weeklyPlan.push({
            day: i + 1,
            dayName: days[i],
            date: date.toISOString().split('T')[0],
            isRestDay: true,
            exercises: [],
            warmUp: '',
            coolDown: '',
            totalCalories: 0
          });
        } else {
          const exercises = this.parseAIExercises(daySection);
          const totalCalories = exercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
          
          weeklyPlan.push({
            day: i + 1,
            dayName: days[i],
            date: date.toISOString().split('T')[0],
            isRestDay: false,
            exercises,
            warmUp: '5-10 minutes light cardio and dynamic stretching',
            coolDown: '5-10 minutes static stretching and deep breathing',
            totalCalories
          });
        }
      } else {
        // If no day section found, create a rest day as fallback
        weeklyPlan.push({
          day: i + 1,
          dayName: days[i],
          date: date.toISOString().split('T')[0],
          isRestDay: true,
          exercises: [],
          warmUp: '',
          coolDown: '',
          totalCalories: 0
        });
      }
    }

    return weeklyPlan;
  }

  private parseAIExercises(daySection: string): WorkoutExercise[] {
    const exercises: WorkoutExercise[] = [];
    const lines = daySection.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      // Match the actual AI response format from the terminal output:
      // "- Barbell Squats – 3 × 8-12 – Rest 90s – Muscles: Quads, Hamstrings, Glutes – ~150 kcal"
      
      // First try the exact format with range reps (8-12)
      let exerciseMatch = line.match(/^[-•]\s*(.+?)\s*–\s*(\d+)\s*×\s*(\d+)[-–]?(\d+)?\s*–\s*Rest\s*(\d+)s\s*–\s*Muscles:\s*([^–]+?)\s*–\s*~(\d+)\s*kcal/i);
      
      if (exerciseMatch) {
        const [, name, sets, repsMin, repsMax, rest, muscles, calories] = exerciseMatch;
        const reps = repsMax ? parseInt(repsMax) : parseInt(repsMin); // Use max reps if range given
        
        exercises.push({
          name: name.trim(),
          emoji: this.getExerciseEmoji(name.trim()),
          sets: parseInt(sets) || 3,
          reps: reps || 10,
          rest: `${rest}s`,
          targetMuscles: muscles.split(',').map(m => m.trim()),
          caloriesBurned: parseInt(calories) || 50
        });
        continue;
      }

      // Try format with single rep number
      exerciseMatch = line.match(/^[-•]\s*(.+?)\s*–\s*(\d+)\s*×\s*(\d+)\s*–\s*Rest\s*(\d+)s\s*–\s*Muscles:\s*([^–]+?)\s*–\s*~(\d+)\s*kcal/i);
      
      if (exerciseMatch) {
        const [, name, sets, reps, rest, muscles, calories] = exerciseMatch;
        
        exercises.push({
          name: name.trim(),
          emoji: this.getExerciseEmoji(name.trim()),
          sets: parseInt(sets) || 3,
          reps: parseInt(reps) || 10,
          rest: `${rest}s`,
          targetMuscles: muscles.split(',').map(m => m.trim()),
          caloriesBurned: parseInt(calories) || 50
        });
        continue;
      }

      // Try alternative format without specific rest format
      exerciseMatch = line.match(/^[-•]\s*(.+?)\s*–\s*(\d+)\s*×\s*([^–]+?)\s*–\s*Rest\s*([^–]+?)\s*–\s*Muscles:\s*([^–]+?)\s*–\s*~(\d+)\s*kcal/i);
      if (exerciseMatch) {
        const [, name, sets, repsStr, rest, muscles, calories] = exerciseMatch;
        
        // Extract numeric value from reps (handle "8-12" or "AMRAP" format)
        const repsMatch = repsStr.match(/(\d+)/);
        const reps = repsMatch ? parseInt(repsMatch[1]) : 10;
        
        exercises.push({
          name: name.trim(),
          emoji: this.getExerciseEmoji(name.trim()),
          sets: parseInt(sets) || 3,
          reps: reps,
          rest: rest.trim(),
          targetMuscles: muscles.split(',').map(m => m.trim()),
          caloriesBurned: parseInt(calories) || 50
        });
        continue;
      }

      // Try circuit training format: "- Bodyweight Squats – 3 Rounds × 45s – Rest 15s – Muscles: ... – ~100 kcal"
      exerciseMatch = line.match(/^[-•]\s*(.+?)\s*–\s*(\d+)\s*Rounds?\s*×\s*(\d+)s\s*–\s*Rest\s*(\d+)s\s*–\s*Muscles:\s*([^–]+?)\s*–\s*~(\d+)\s*kcal/i);
      if (exerciseMatch) {
        const [, name, rounds, duration, rest, muscles, calories] = exerciseMatch;
        
        exercises.push({
          name: name.trim(),
          emoji: this.getExerciseEmoji(name.trim()),
          sets: parseInt(rounds) || 3,
          reps: parseInt(duration) || 45, // Use duration as reps for circuit training
          rest: `${rest}s`,
          targetMuscles: muscles.split(',').map(m => m.trim()),
          caloriesBurned: parseInt(calories) || 50
        });
        continue;
      }

      // Skip lines that don't match exercise patterns (notes, headers, etc.)
    }
    
    return exercises;
  }

  private getExerciseEmoji(exerciseName: string): string {
    const name = exerciseName.toLowerCase();
    if (name.includes('squat')) return '🦵';
    if (name.includes('bench') || name.includes('press')) return '🏋️';
    if (name.includes('deadlift')) return '💪';
    if (name.includes('row')) return '🚣';
    if (name.includes('curl')) return '💪';
    if (name.includes('plank')) return '🧘';
    if (name.includes('run') || name.includes('cardio')) return '🏃';
    if (name.includes('lunge')) return '🦵';
    if (name.includes('push') || name.includes('up')) return '🤸';
    if (name.includes('pull')) return '🏋️';
    return '💪'; // Default emoji
  }

}

export default new AIWorkoutService();