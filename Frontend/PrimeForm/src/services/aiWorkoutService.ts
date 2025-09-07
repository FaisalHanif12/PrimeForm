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
}

export interface AIWorkoutResponse {
  success: boolean;
  data: WorkoutPlan | null;
  message: string;
}

class AIWorkoutService {
  private generatePrompt(userProfile: UserProfile): string {
    const prompt = `
You are a certified and professional fitness trainer.  
Generate a safe, motivating, and structured **7-day workout plan** based on the following profile:

### Profile
- Age: ${userProfile.age}  
- Gender: ${userProfile.gender}  
- Height: ${userProfile.height}  
- Current Weight: ${userProfile.currentWeight}  
- Goal: ${userProfile.bodyGoal}  
- Equipment: ${userProfile.availableEquipment}  
- Health Considerations: ${userProfile.medicalConditions || 'None'}  

### Requirements
1. First, analyze the profile (goal + health + equipment).  
   - If goal = **Muscle Gain** → Recommend **3–6 months** duration (depending on condition).  
   - If goal = **Fat Loss** → Recommend **3–6 months** duration.  
   - If goal = **General Fitness/Endurance/Training** → Recommend a **long-term plan** (6–12 months).  
   - Clearly show the chosen duration in the output.  

2. Equipment Adaptation:  
   - If user has **full gym access** → use gym-based exercises.  
   - If user has **home/no equipment** → provide only bodyweight or home-friendly exercises.  

3. The 7-day plan must include:  
   - **6 workout days** + **1 day running**.  
   - Each workout day should have a **different focus** (Full Body, Upper, Lower, Core/Cardio, Circuit, etc.).  
   - For each exercise, list:  
     - **Name**  
     - **Sets × Reps**  
     - **Rest (seconds)**  
     - **Target Muscles**  
     - **Calories Burned (estimate)**  

4. Always include:  
   - **Warm-up** (5–10 mins light cardio/dynamic stretching).  
   - **Cool-down** (5–10 mins static stretching).  

5. Keep the plan progressive, and safe for health conditions**.  

6. Tone should be **clear, motivating, and easy to follow**.  

7. Output format (must follow exactly):  

**Goal:** [goal]  
**Duration:** [calculated duration]  

---

#### 📅 Week 1 — Day-by-Day Plan  

**Day 1: [Workout Focus + Icon]**  
- Exercise 1 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Exercise 2 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Note How to do the exercise correctly.   
- ✅ Warm-up (5–10 min) & Cool-down (5–10 min)  

---

**Day 2: Rest 🛌**  
- Simple yoga optional  
- simple running 20 minutes 
---

**Day 3: [Workout Focus + Icon]**  
- Exercise 1 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- Note How to do the exercise correctly.
- Exercise 2 – [Sets × Reps] – Rest [X]s – Muscles: [target muscles] – ~[cal] kcal  
- ✅ Warm-up & Cool-down included  

---

…continue for all 7 days.  

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

      // Create timeout promise - increased to 45 seconds for better reliability
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out after 45 seconds')), 45000);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(OPENROUTER_API_URL, {
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
            temperature: 0.3, // Optimal for Gemini
            max_tokens: 2000, // Gemini handles more tokens efficiently
            stream: false,
            top_p: 0.9, // Good for Gemini
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
          }),
        }),
        timeoutPromise
      ]) as Response;

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
    try {
      const response = await workoutPlanService.getActiveWorkoutPlan();
      if (response.success && response.data) {
        console.log('📱 Loading workout plan from database');
        return response.data;
      }
    } catch (error) {
      console.warn('⚠️ Could not load workout plan from database:', error);

      // Try to load from local cache as fallback
      try {
        const cachedPlan = await Storage.getItem('cached_workout_plan');
        if (cachedPlan) {
          console.log('📱 Loading workout plan from local cache');
          return JSON.parse(cachedPlan);
        }
      } catch (cacheError) {
        console.warn('⚠️ Could not load from cache either:', cacheError);
      }
    }
    return null;
  }

  // Clear workout plan from database
  async clearWorkoutPlanFromDatabase(): Promise<void> {
    try {
      await workoutPlanService.clearAllWorkoutPlans();
      console.log('🗑️ Workout plans cleared from database');

      // Also clear local cache
      await Storage.removeItem('cached_workout_plan');
      console.log('🗑️ Local workout plan cache cleared');
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
        
        // Check if it's a rest day
        const isRestDay = headerLower.includes('rest') || headerLower.includes('recovery') || headerLower.includes('🛌');
        
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