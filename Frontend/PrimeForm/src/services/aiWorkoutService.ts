import { UserProfile } from './userProfileService';
import workoutPlanService from './workoutPlanService';
import Storage from '../utils/storage';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://primeform.app';
const SITE_NAME = process.env.EXPO_PUBLIC_SITE_NAME || 'PrimeForm';

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
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  private getCachedData(key: string): any | null {
    const cached = this.dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📦 Using cached data for ${key}`);
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.dataCache.set(key, { data, timestamp: Date.now() });
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

  private generatePrompt(userProfile: UserProfile): string {
    const prompt = `
You are a world-class certified fitness trainer with 15+ years of experience in highly personalized training programs.  
Create an EXTREMELY PERSONALIZED and HIGHLY SPECIFIC **7-day workout plan** based on this EXACT user profile:

### CRITICAL USER ANALYSIS
- Age: ${userProfile.age} years (${userProfile.age < 25 ? 'Young adult - higher recovery, can handle intense training' : userProfile.age < 40 ? 'Adult - balanced approach, moderate recovery' : userProfile.age < 55 ? 'Middle-aged - focus on joint health, longer recovery' : 'Mature - emphasize mobility, low-impact exercises'})
- Gender: ${userProfile.gender} (${userProfile.gender === 'Male' ? 'Typically higher muscle mass, focus on strength' : 'Often better flexibility, may need more upper body focus'})
- Height: ${userProfile.height} cm | Weight: ${userProfile.currentWeight} kg → ${userProfile.targetWeight} kg
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
1. First, analyze the profile (goal + health + equipment + age).  
   - If goal = **Muscle Gain** → Recommend **3–6-9 months** duration (depending on condition).  
   - If goal = **Fat Loss** → Recommend **3–6-9 months** duration.  
   - If goal = **General Fitness/Endurance/Training** → Recommend a **long-term plan** (6–12 months).  
   - Clearly show the chosen duration in the output.  

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
**Duration:** [calculated duration]  

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
      console.log('🤖 Generating AI workout plan for user:', userProfile);
      console.log('🔑 Using OpenRouter API Key:', OPENROUTER_API_KEY ? 'Present' : 'Missing');
      console.log('🌐 API URL:', OPENROUTER_API_URL);

      // Check if API key is available
      if (!OPENROUTER_API_KEY) {
        throw new Error('Sorry for the inconvenience. AI is temporarily unavailable.');
      }
      
      const prompt = this.generatePrompt(userProfile);
      console.log('📝 Prompt length:', prompt.length, 'characters');

      const startTime = Date.now();
      console.log('🚀 Calling OpenRouter API with Gemini Flash 2.0 model...');

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
        console.error('❌ OpenRouter API Error Response:', errorText);
        throw new Error(`API request failed with status: ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      console.log(`⚡ API Response time: ${responseTime}ms (${(responseTime / 1000).toFixed(2)}s)`);
      console.log('🤖 OpenRouter AI Response received:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from AI');
      }

      const aiResponse = data.choices[0].message.content;
      console.log('🤖 AI Generated Content:', aiResponse);

      // Parse the AI response into structured data
      const workoutPlan = this.parseAIResponse(aiResponse, userProfile);

      // Store the response in database for persistence with retry logic
      console.log('💾 Attempting to save workout plan to database...');
      let saveResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          saveResponse = await workoutPlanService.createWorkoutPlan(workoutPlan);
          if (saveResponse.success) {
            console.log('✅ Workout plan saved to database successfully');

            // Also cache locally as backup
            await Storage.setItem('cached_workout_plan', JSON.stringify(workoutPlan));
            console.log('💾 Workout plan cached locally as backup');
            break;
          } else {
            throw new Error(`Database save failed: ${saveResponse.message}`);
          }
        } catch (error) {
          retryCount++;
          console.warn(`⚠️ Database save attempt ${retryCount} failed:`, error);
          
          if (retryCount >= maxRetries) {
            console.error('❌ All database save attempts failed. Caching locally only.');
            // Cache locally as fallback
            await Storage.setItem('cached_workout_plan', JSON.stringify(workoutPlan));
            console.log('💾 Workout plan cached locally as fallback');
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
      console.error('❌ Error generating workout plan:', error);

      // Re-throw the error to be handled by the calling component
      throw error;
    }
  }

  // Load workout plan from database
  async loadWorkoutPlanFromDatabase(): Promise<WorkoutPlan | null> {
    const cacheKey = 'workout-plan-active';
    
    // Check if there's already a request in flight
    if (this.loadingCache.has(cacheKey)) {
      console.log('🔄 Request already in flight, waiting for existing request...');
      return this.loadingCache.get(cacheKey);
    }

    // Check memory cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Create new request and cache the promise to prevent duplicates
    const request = (async () => {
      try {
        const response = await workoutPlanService.getActiveWorkoutPlan();
        if (response.success && response.data) {
          console.log('📱 Loaded workout plan from database');
          this.setCachedData(cacheKey, response.data);
          return response.data;
        }
      } catch (error) {
        console.warn('⚠️ Could not load workout plan from database:', error);

        // Try to load from local cache as fallback
        try {
          const cachedPlan = await Storage.getItem('cached_workout_plan');
          if (cachedPlan) {
            console.log('📱 Loading workout plan from local cache');
            const plan = JSON.parse(cachedPlan);
            this.setCachedData(cacheKey, plan);
            return plan;
          }
        } catch (cacheError) {
          console.warn('⚠️ Could not load from cache either:', cacheError);
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

  // Clear workout plan from database
  async clearWorkoutPlanFromDatabase(): Promise<void> {
    try {
      await workoutPlanService.clearAllWorkoutPlans();
      console.log('🗑️ Workout plans cleared from database');

      // Also clear local cache
      await Storage.removeItem('cached_workout_plan');
      console.log('🗑️ Local workout plan cache cleared');
      
      // Clear memory cache
      this.clearCache('workout-plan-active');
    } catch (error) {
      console.warn('⚠️ Could not clear workout plans from database:', error);
    }
  }


  private parseAIResponse(aiResponse: string, userProfile: UserProfile): WorkoutPlan {
    // Extract goal and duration from the AI response
    const goalMatch = aiResponse.match(/\*\*Goal:\*\*\s*(.+?)(?:\n|$)/i);
    const durationMatch = aiResponse.match(/\*\*Duration:\*\*\s*(.+?)(?:\n|$)/i);

    const goal = goalMatch ? goalMatch[1].trim() : userProfile.bodyGoal || 'General Fitness';
    const duration = durationMatch ? durationMatch[1].trim() : '12 weeks';

    // Parse the AI response to extract workout days
    const weeklyPlan: WorkoutDay[] = this.parseAIWorkoutDays(aiResponse);

    // Calculate dates based on duration
    const startDate = new Date();
    const endDate = new Date();
    // Convert human-readable duration to total weeks
    let totalWeeks = 12;
    const numMatch = duration.toLowerCase().match(/(\d+)[\s-]*(week|weeks|month|months)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      const unit = numMatch[2];
      totalWeeks = unit.startsWith('month') ? num * 4 : num; // approx 4 weeks per month
    } else {
      const weeksDirect = duration.toLowerCase().match(/(\d+)/)?.[1];
      if (weeksDirect) totalWeeks = parseInt(weeksDirect);
    }

    // The backend expects a 7-day weekly pattern, not an expanded plan
    // Store the total weeks and let the frontend handle the expansion
    endDate.setDate(startDate.getDate() + (totalWeeks * 7));

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
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
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