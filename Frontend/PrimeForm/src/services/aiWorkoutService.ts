import { UserProfile } from './userProfileService';

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
  goal: string;
  duration: string;
  keyNotes: string[];
  weeklyPlan: WorkoutDay[];
  startDate: string;
  endDate: string;
}

export interface AIWorkoutResponse {
  success: boolean;
  data: WorkoutPlan | null;
  message: string;
}

class AIWorkoutService {
  private generatePrompt(userProfile: UserProfile): string {
    const prompt = `You are the world's best health trainer. Create a personalized workout plan for:

Age: ${userProfile.age}, Gender: ${userProfile.gender}, Height: ${userProfile.height}
Weight: ${userProfile.currentWeight}, Goal: ${userProfile.bodyGoal}
Target: ${userProfile.targetWeight || 'Not specified'}
Health: ${userProfile.medicalConditions || 'None'}, Equipment: ${userProfile.availableEquipment}

REQUIREMENTS:
- Analyze health conditions and determine safe timeline (could be 6-12 months)
- Create progressive plan: Split into weeks, each week Day 1-7
- Each day: exercises, sets, reps, rest, target muscles, calories burned
- One rest day per week only
- Progression: Intermediate → Advanced
- Include warm-up & cool-down for workout days
- Only recommend exercises suitable for their health conditions and goals

FORMAT:
Goal: [fitness goal]
Duration: [X weeks/months based on health]
Key Notes: [safety tips]

Week 1-X, Day 1-7:
- Day X: [Exercise + emoji] - [sets]x[reps] - [rest] - [muscles] - [calories]kcal
- Rest Day: [one day per week]

Keep motivating and Intermediate-friendly.`;

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
      
      console.log('🚀 Calling OpenRouter API with DeepSeek R1 0528 model...');
      
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1-0528',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.4, // Balanced for creativity and speed
          max_tokens: 3000, // Optimal for detailed workout plans
          stream: false, // Ensure non-streaming for faster response
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API Error Response:', errorText);
        throw new Error(`API request failed with status: ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('🤖 OpenRouter AI Response received:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from AI');
      }

      const aiResponse = data.choices[0].message.content;
      console.log('🤖 AI Generated Content:', aiResponse);

      // Parse the AI response into structured data
      const workoutPlan = this.parseAIResponse(aiResponse, userProfile);
      
      return {
        success: true,
        data: workoutPlan,
        message: 'Workout plan generated successfully with DeepSeek R1 0528'
      };

    } catch (error) {
      console.error('❌ Error generating workout plan:', error);
      
      // Re-throw the error to be handled by the calling component
      throw error;
    }
  }

  private generateSampleWorkoutPlan(userProfile: UserProfile): WorkoutPlan {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 84); // 12 weeks
    
    const weeklyPlan: WorkoutDay[] = this.generateSampleWeeklyPlan(userProfile);
    
    return {
      goal: userProfile.bodyGoal || 'General Fitness',
      duration: '12 weeks',
      keyNotes: [
        'Start with lighter weights and focus on form',
        'Listen to your body and rest when needed',
        'Stay hydrated throughout your workouts',
        'Track your progress weekly'
      ],
      weeklyPlan,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  private parseAIResponse(aiResponse: string, userProfile: UserProfile): WorkoutPlan {
    // This is a simplified parser - in a real app, you'd want more robust parsing
    const lines = aiResponse.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract goal and duration from the response
    const goalMatch = aiResponse.match(/Goal[:\s]*(.+)/i);
    const durationMatch = aiResponse.match(/Duration[:\s]*(\d+\s*(?:weeks?|months?))/i);
    
    const goal = goalMatch ? goalMatch[1].trim() : userProfile.bodyGoal || 'General Fitness';
    const duration = durationMatch ? durationMatch[1].trim() : '12 weeks';
    
    // Generate a sample workout plan structure
    const startDate = new Date();
    const endDate = new Date();
    const weeks = parseInt(duration.match(/\d+/)?.[0] || '12');
    endDate.setDate(startDate.getDate() + (weeks * 7));
    
    // Create a sample weekly plan (this would be replaced with actual AI parsing)
    const weeklyPlan: WorkoutDay[] = this.generateSampleWeeklyPlan(userProfile);
    
    return {
      goal: goal || 'General Fitness',
      duration: duration || '12 weeks',
      keyNotes: [
        'Start with lighter weights and focus on form',
        'Listen to your body and rest when needed',
        'Stay hydrated throughout your workouts',
        'Track your progress weekly'
      ],
      weeklyPlan: weeklyPlan || [],
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  private generateSampleWeeklyPlan(userProfile: UserProfile): WorkoutDay[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyPlan: WorkoutDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const isRestDay = i === 1; // Tuesday is rest day
      const date = new Date();
      date.setDate(date.getDate() + i);
      
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
        const exercises = this.generateExercisesForDay(userProfile, i);
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
    }
    
    return weeklyPlan;
  }

  private generateExercisesForDay(userProfile: UserProfile, dayIndex: number): WorkoutExercise[] {
    const exerciseLibrary = {
      'Lose Fat': [
        { name: 'Push-ups', emoji: '🤸', sets: 3, reps: 12, rest: '60s', muscles: ['Chest', 'Shoulders', 'Triceps'], calories: 60 },
        { name: 'Squats', emoji: '🏋️', sets: 3, reps: 15, rest: '60s', muscles: ['Quadriceps', 'Glutes'], calories: 80 },
        { name: 'Lunges', emoji: '🦵', sets: 3, reps: 12, rest: '45s', muscles: ['Quadriceps', 'Glutes'], calories: 50 },
        { name: 'Plank', emoji: '🧘', sets: 3, reps: 30, rest: '60s', muscles: ['Core', 'Shoulders'], calories: 40 },
        { name: 'Burpees', emoji: '💪', sets: 3, reps: 8, rest: '90s', muscles: ['Full Body'], calories: 100 }
      ],
      'Gain Muscle': [
        { name: 'Pull-ups', emoji: '🏋️', sets: 3, reps: 8, rest: '90s', muscles: ['Back', 'Biceps'], calories: 60 },
        { name: 'Dips', emoji: '💪', sets: 3, reps: 10, rest: '90s', muscles: ['Chest', 'Triceps'], calories: 70 },
        { name: 'Pistol Squats', emoji: '🦵', sets: 3, reps: 6, rest: '120s', muscles: ['Quadriceps', 'Glutes'], calories: 90 },
        { name: 'Handstand Push-ups', emoji: '🤸', sets: 3, reps: 5, rest: '120s', muscles: ['Shoulders', 'Triceps'], calories: 80 },
        { name: 'Muscle-ups', emoji: '💪', sets: 3, reps: 4, rest: '180s', muscles: ['Back', 'Chest', 'Arms'], calories: 120 }
      ],
      'General Training': [
        { name: 'Push-ups', emoji: '🤸', sets: 3, reps: 10, rest: '60s', muscles: ['Chest', 'Shoulders'], calories: 50 },
        { name: 'Squats', emoji: '🏋️', sets: 3, reps: 12, rest: '60s', muscles: ['Quadriceps', 'Glutes'], calories: 70 },
        { name: 'Lunges', emoji: '🦵', sets: 3, reps: 10, rest: '45s', muscles: ['Quadriceps', 'Glutes'], calories: 45 },
        { name: 'Plank', emoji: '🧘', sets: 3, reps: 30, rest: '60s', muscles: ['Core'], calories: 35 },
        { name: 'Mountain Climbers', emoji: '🏃', sets: 3, reps: 20, rest: '60s', muscles: ['Full Body'], calories: 60 }
      ]
    };

    const goal = userProfile.bodyGoal as keyof typeof exerciseLibrary;
    const availableExercises = exerciseLibrary[goal] || exerciseLibrary['General Training'];
    
    // Select 2-3 exercises for each day, with fallback to ensure we always have exercises
    const startIndex = (dayIndex * 2) % availableExercises.length;
    const selectedExercises = availableExercises.slice(startIndex, startIndex + 3);
    
    // Ensure we always have at least one exercise
    if (selectedExercises.length === 0) {
      selectedExercises.push(availableExercises[0]);
    }
    
    return selectedExercises.map(ex => ({
      name: ex.name || 'Exercise',
      emoji: ex.emoji || '💪',
      sets: ex.sets || 3,
      reps: ex.reps || 10,
      rest: ex.rest || '60s',
      targetMuscles: Array.isArray(ex.muscles) ? ex.muscles : ['General'],
      caloriesBurned: ex.calories || 50
    }));
  }
}

export default new AIWorkoutService();
