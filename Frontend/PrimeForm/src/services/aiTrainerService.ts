import { api } from '../config/api';
import Storage from '../utils/storage';
import aiWorkoutService from './aiWorkoutService';
import aiDietService from './aiDietService';
import userProfileService from './userProfileService';
import { getUserCacheKey, getCurrentUserId } from '../utils/cacheKeys';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://primeform.app';
const SITE_NAME = process.env.EXPO_PUBLIC_SITE_NAME || 'Pure Body';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  category?: 'workout' | 'diet' | 'motivation' | 'general';
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface TrainerInsight {
  id: string;
  title: string;
  description: string;
  category: 'workout' | 'diet' | 'recovery' | 'motivation';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  icon: string;
}

interface WorkoutRecommendation {
  id: string;
  title: string;
  description: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    notes?: string;
  }>;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focus: string[];
}

interface AITrainerServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class AITrainerService {

  // Get current chat history (for active conversation)
  async getChatHistory(): Promise<AITrainerServiceResponse<ChatMessage[]>> {
    try {
      // Try to get from backend first
      try {
        const response = await api.get('/ai-trainer/chat-history');
        if (response.data.success) {
          return response.data;
        }
      } catch (error) {
        console.warn('⚠️ Backend not available, loading from local storage');
      }

      // Load current conversation from local storage with user-specific key
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          message: 'User not authenticated',
          data: []
        };
      }

      const currentConversationIdKey = await getUserCacheKey('ai_trainer_current_conversation_id', userId);
      const currentConversationId = await Storage.getItem(currentConversationIdKey);
      
      if (currentConversationId) {
        const conversations = await this.getAllConversations();
        const currentConversation = conversations.find(conv => conv.id === currentConversationId);
        if (currentConversation) {
          return {
            success: true,
            message: 'Chat history loaded from local storage',
            data: currentConversation.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          };
        }
      }

      // Fallback to old format for backward compatibility (with user-specific key)
      const chatHistoryKey = await getUserCacheKey('ai_trainer_chat', userId);
      const chatHistory = await Storage.getItem(chatHistoryKey) || '[]';
      const messages = JSON.parse(chatHistory).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      return {
        success: true,
        message: 'Chat history loaded from local storage',
        data: messages
      };

    } catch (error) {
      console.error('❌ Error getting chat history:', error);
      return {
        success: false,
        message: 'Failed to load chat history',
        data: []
      };
    }
  }

  // Get all conversations
  async getAllConversations(): Promise<ChatConversation[]> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return [];
      }

      const conversationsKey = await getUserCacheKey('ai_trainer_conversations', userId);
      const conversationsJson = await Storage.getItem(conversationsKey) || '[]';
      const conversations = JSON.parse(conversationsJson).map((conv: any) => ({
        ...conv,
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      }));
      return conversations.sort((a: ChatConversation, b: ChatConversation) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      return [];
    }
  }

  // Get conversation by ID
  async getConversationById(conversationId: string): Promise<ChatConversation | null> {
    try {
      const conversations = await this.getAllConversations();
      return conversations.find(conv => conv.id === conversationId) || null;
    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      return null;
    }
  }

  // Create new conversation
  async createNewConversation(): Promise<string> {
    try {
      const conversationId = `conv_${Date.now()}`;
      const now = new Date();
      const newConversation: ChatConversation = {
        id: conversationId,
        title: 'New Chat',
        messages: [],
        createdAt: now,
        updatedAt: now
      };

      const conversations = await this.getAllConversations();
      conversations.unshift(newConversation);
      
      // Serialize dates for storage
      const serializedConversations = conversations.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
        })),
        createdAt: conv.createdAt instanceof Date ? conv.createdAt.toISOString() : conv.createdAt,
        updatedAt: conv.updatedAt instanceof Date ? conv.updatedAt.toISOString() : conv.updatedAt
      }));
      
      const userId = await getCurrentUserId();
      if (userId) {
        const [conversationsKey, currentIdKey] = await Promise.all([
          getUserCacheKey('ai_trainer_conversations', userId),
          getUserCacheKey('ai_trainer_current_conversation_id', userId),
        ]);
        await Storage.setItem(conversationsKey, JSON.stringify(serializedConversations));
        await Storage.setItem(currentIdKey, conversationId);
      }
      
      return conversationId;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw error;
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<{ wasCurrent: boolean; switchedToNew: boolean }> {
    try {
      const conversations = await this.getAllConversations();
      const filtered = conversations.filter(conv => conv.id !== conversationId);
      
      const userId = await getCurrentUserId();
      if (!userId) {
        return { wasCurrent: false, switchedToNew: false };
      }

      const conversationsKey = await getUserCacheKey('ai_trainer_conversations', userId);
      await Storage.setItem(conversationsKey, JSON.stringify(filtered));
      
      // If deleted conversation was current, switch to another conversation or create new one
      const currentIdKey = await getUserCacheKey('ai_trainer_current_conversation_id', userId);
      const currentId = await Storage.getItem(currentIdKey);
      const wasCurrent = currentId === conversationId;
      let switchedToNew = false;
      
      if (wasCurrent) {
        // Try to load the first available conversation
        if (filtered.length > 0) {
          const nextConversation = filtered[0];
          await this.loadConversation(nextConversation.id);
        } else {
          // No conversations left, create a new one
          await this.createNewConversation();
          switchedToNew = true;
        }
      }
      
      return { wasCurrent, switchedToNew };
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      throw error;
    }
  }

  // Load conversation (set as current)
  async loadConversation(conversationId: string): Promise<AITrainerServiceResponse<ChatMessage[]>> {
    try {
      const conversation = await this.getConversationById(conversationId);
      if (!conversation) {
        return {
          success: false,
          message: 'Conversation not found',
          data: []
        };
      }

      const userId = await getCurrentUserId();
      if (userId) {
        const currentIdKey = await getUserCacheKey('ai_trainer_current_conversation_id', userId);
        await Storage.setItem(currentIdKey, conversationId);
      }
      
      return {
        success: true,
        message: 'Conversation loaded',
        data: conversation.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error) {
      console.error('❌ Error loading conversation:', error);
      return {
        success: false,
        message: 'Failed to load conversation',
        data: []
      };
    }
  }

  // Send message to AI trainer
  async sendMessage(message: string, language: 'en' | 'ur' = 'en'): Promise<AITrainerServiceResponse<{
    message: string;
    category: 'workout' | 'diet' | 'motivation' | 'general';
  }>> {
    try {
      // Check if API key is available
      if (!OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY is missing from environment variables');
        console.error('❌ Please check your .env file for EXPO_PUBLIC_OPENROUTER_API_KEY');
        throw new Error('Sorry for the inconvenience. AI is temporarily unavailable.');
      }
      
      console.log('🤖 Sending message to AI Trainer:', message);
      console.log('🔑 API Key Status:', {
        present: !!OPENROUTER_API_KEY,
        length: OPENROUTER_API_KEY.length,
        startsWith: OPENROUTER_API_KEY.substring(0, 10) + '...'
      });

      // Get user context for personalization
      const userProfile = await userProfileService.getUserProfile();
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = await aiDietService.loadDietPlanFromDatabase();

      // Create context-aware prompt
      const contextPrompt = this.buildContextualPrompt(message, userProfile.data, workoutPlan, dietPlan, language);

      // Call OpenRouter API
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
              content: contextPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500, // Increased for detailed gap analysis and comprehensive responses
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          apiKeyPresent: !!OPENROUTER_API_KEY,
          apiKeyLength: OPENROUTER_API_KEY?.length || 0
        });
        throw new Error(`API request failed with status: ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content;

      if (!aiMessage) {
        throw new Error('No response from AI');
      }

      // Categorize the response
      const category = this.categorizeMessage(message, aiMessage);

      // Save to chat history
      await this.saveChatMessage(message, aiMessage, category);

      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          message: aiMessage,
          category
        }
      };

    } catch (error) {
      console.error('❌ Error sending message to AI trainer:', error);
      
      // Check if it's an API key issue
      if (error instanceof Error && error.message.includes('401')) {
        console.error('❌ Authentication failed - API key may be missing or invalid');
        console.error('❌ API Key check:', {
          keyPresent: !!OPENROUTER_API_KEY,
          keyLength: OPENROUTER_API_KEY?.length || 0,
          envVar: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ? 'Present' : 'Missing'
        });
      }
      
      // Fallback response
      const fallbackResponse = this.getFallbackResponse(message);
      
      return {
        success: true,
        message: 'Fallback response provided',
        data: fallbackResponse
      };
    }
  }

  // Build contextual prompt for AI
  private buildContextualPrompt(userMessage: string, userProfile: any, workoutPlan: any, dietPlan: any, language: 'en' | 'ur' = 'en'): string {
    const context = [];
    
    // Add comprehensive user profile context
    if (userProfile) {
      const bmi = userProfile.height && userProfile.currentWeight ? 
        (Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)).toFixed(1) : 'N/A';
      
      context.push(`**USER PROFILE:**
- Primary Goal: ${userProfile.bodyGoal}
- Age: ${userProfile.age} years
- Gender: ${userProfile.gender}
- Current Weight: ${userProfile.currentWeight}kg
- Target Weight: ${userProfile.targetWeight}kg
- Height: ${userProfile.height}cm
- BMI: ${bmi}
- Diet Preference: ${userProfile.dietPreference || 'No restrictions'}
- Available Equipment: ${userProfile.availableEquipment}
- Occupation: ${userProfile.occupationType || 'Not specified'}
- Medical Conditions: ${userProfile.medicalConditions || 'None'}
- Country: ${userProfile.country || 'International'}`);
    }

    // Add detailed workout plan context with progress and gap analysis
    if (workoutPlan) {
      const startDate = new Date(workoutPlan.startDate);
      const today = new Date();
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksCompleted = Math.floor(daysSinceStart / 7);
      const totalWeeks = workoutPlan.totalWeeks || 12;
      const progressPercentage = Math.min(Math.round((weeksCompleted / totalWeeks) * 100), 100);
      const monthsIntoPlan = Math.floor(weeksCompleted / 4);
      
      // Get unique exercises from the plan
      const allExercises = workoutPlan.weeklyPlan?.flatMap((day: any) => 
        day.exercises?.map((ex: any) => ex.name) || []
      ) || [];
      const uniqueExercises = [...new Set(allExercises)].slice(0, 15); // Top 15 unique exercises
      
      // Calculate total expected exercises and days
      const totalExpectedExercises = allExercises.length * totalWeeks; // Approximate
      const totalExpectedDays = totalWeeks * 6; // 6 workout days per week (excluding rest day)
      
      const completedExercisesCount = workoutPlan.completedExercises?.length || 0;
      const completedDaysCount = workoutPlan.completedDays?.length || 0;
      
      // Calculate completion rates
      const exerciseCompletionRate = totalExpectedExercises > 0 ? 
        Math.round((completedExercisesCount / totalExpectedExercises) * 100) : 0;
      const dayCompletionRate = totalExpectedDays > 0 ? 
        Math.round((completedDaysCount / totalExpectedDays) * 100) : 0;
      
      // Identify gaps
      const expectedExercisesThisWeek = weeksCompleted > 0 ? allExercises.length : 0;
      const expectedDaysThisWeek = weeksCompleted > 0 ? 6 : 0;
      
      // Get exercise details for analysis
      const exerciseDetails = workoutPlan.weeklyPlan?.flatMap((day: any) => 
        day.exercises?.map((ex: any) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          targetMuscles: ex.targetMuscles?.join(', ') || 'Not specified',
          rest: ex.rest
        })) || []
      ) || [];
      
      context.push(`**CURRENT WORKOUT PLAN STATUS:**
- Plan Goal: ${workoutPlan.goal}
- Duration: ${workoutPlan.duration} (${totalWeeks} weeks total)
- Start Date: ${workoutPlan.startDate}
- End Date: ${workoutPlan.endDate}
- Progress: ${weeksCompleted} weeks completed out of ${totalWeeks} weeks (${progressPercentage}%)
- Time in Plan: ${monthsIntoPlan > 0 ? `${monthsIntoPlan} month${monthsIntoPlan > 1 ? 's' : ''} and ` : ''}${weeksCompleted % 4} week${(weeksCompleted % 4) !== 1 ? 's' : ''}
- Exercises Completed: ${completedExercisesCount} (Completion Rate: ${exerciseCompletionRate}%)
- Days Completed: ${completedDaysCount} (Completion Rate: ${dayCompletionRate}%)
- Expected Exercises This Week: ~${expectedExercisesThisWeek}
- Expected Days This Week: ${expectedDaysThisWeek}
- Key Exercises in Plan: ${uniqueExercises.length > 0 ? uniqueExercises.join(', ') : 'Not specified'}
- Weekly Structure: ${workoutPlan.weeklyPlan?.map((day: any) => `${day.dayName}${day.isRestDay ? ' (Rest)' : ''}`).join(', ') || 'Not specified'}
- Exercise Details: ${exerciseDetails.slice(0, 10).map((ex: any) => `${ex.name} (${ex.sets}×${ex.reps}, ${ex.targetMuscles})`).join('; ') || 'Not specified'}
- Key Notes: ${workoutPlan.keyNotes?.join('; ') || 'None'}`);
    }

    // Add detailed diet plan context with progress and gap analysis
    if (dietPlan) {
      const startDate = new Date(dietPlan.startDate);
      const today = new Date();
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksCompleted = Math.floor(daysSinceStart / 7);
      const totalWeeks = dietPlan.totalWeeks || 12;
      const progressPercentage = Math.min(Math.round((weeksCompleted / totalWeeks) * 100), 100);
      const monthsIntoPlan = Math.floor(weeksCompleted / 4);
      
      // Get all meals from the plan for analysis
      const allMeals = dietPlan.weeklyPlan?.flatMap((day: any) => [
        { type: 'breakfast', meal: day.meals?.breakfast },
        { type: 'lunch', meal: day.meals?.lunch },
        { type: 'dinner', meal: day.meals?.dinner },
        ...(day.meals?.snacks || []).map((snack: any) => ({ type: 'snack', meal: snack }))
      ]).filter((item: any) => item.meal) || [];
      
      // Get sample meals for display
      const sampleMeals = allMeals.slice(0, 12).map((item: any) => item.meal.name).filter(Boolean);
      
      // Calculate total expected meals
      const mealsPerDay = 4; // breakfast, lunch, dinner, snacks
      const totalExpectedMeals = totalWeeks * 7 * mealsPerDay;
      const totalExpectedDays = totalWeeks * 7;
      
      const completedMealsCount = dietPlan.completedMeals?.length || 0;
      const completedDaysCount = dietPlan.completedDays?.length || 0;
      
      // Calculate completion rates
      const mealCompletionRate = totalExpectedMeals > 0 ? 
        Math.round((completedMealsCount / totalExpectedMeals) * 100) : 0;
      const dayCompletionRate = totalExpectedDays > 0 ? 
        Math.round((completedDaysCount / totalExpectedDays) * 100) : 0;
      
      // Get meal details for analysis
      const mealDetails = allMeals.slice(0, 15).map((item: any) => ({
        type: item.type,
        name: item.meal.name,
        calories: item.meal.calories,
        protein: item.meal.protein,
        carbs: item.meal.carbs,
        fats: item.meal.fats
      }));
      
      context.push(`**CURRENT DIET PLAN STATUS:**
- Plan Goal: ${dietPlan.goal}
- Duration: ${dietPlan.duration} (${totalWeeks} weeks total)
- Start Date: ${dietPlan.startDate}
- End Date: ${dietPlan.endDate}
- Progress: ${weeksCompleted} weeks completed out of ${totalWeeks} weeks (${progressPercentage}%)
- Time in Plan: ${monthsIntoPlan > 0 ? `${monthsIntoPlan} month${monthsIntoPlan > 1 ? 's' : ''} and ` : ''}${weeksCompleted % 4} week${(weeksCompleted % 4) !== 1 ? 's' : ''}
- Meals Completed: ${completedMealsCount} (Completion Rate: ${mealCompletionRate}%)
- Days Completed: ${completedDaysCount} (Completion Rate: ${dayCompletionRate}%)
- Expected Meals Per Day: 4 (breakfast, lunch, dinner, snacks)
- Expected Days Per Week: 7
- Target Daily Calories: ${dietPlan.targetCalories} kcal
- Target Daily Protein: ${dietPlan.targetProtein}g
- Target Daily Carbs: ${dietPlan.targetCarbs}g
- Target Daily Fats: ${dietPlan.targetFats}g
- Country Cuisine: ${dietPlan.country || 'International'}
- Sample Meals: ${sampleMeals.length > 0 ? sampleMeals.join(', ') : 'Not specified'}
- Meal Details: ${mealDetails.slice(0, 10).map((m: any) => `${m.name} (${m.calories}kcal, P:${m.protein}g)`).join('; ') || 'Not specified'}
- Key Notes: ${dietPlan.keyNotes?.join('; ') || 'None'}`);
    }

    const systemPrompt = `You are an **ELITE AI Personal Trainer and Nutritionist** with 20+ years of combined expertise in:

**EXPERTISE AREAS:**
- Exercise science, biomechanics, and kinesiology
- Advanced nutrition science and meal planning
- Sports psychology and motivation
- Injury prevention, rehabilitation, and recovery
- Progressive training methodologies and periodization
- Exercise form, technique, and safety protocols
- Nutritional biochemistry and metabolism
- Health condition adaptations for exercise and nutrition

**CORE CAPABILITIES:**
✅ **Exercise Knowledge**: Deep understanding of exercise advantages, disadvantages, proper form, common mistakes, muscle activation, and injury risks
✅ **Nutrition Knowledge**: Comprehensive knowledge of food benefits, drawbacks, nutritional profiles, meal timing, and dietary adaptations
✅ **Health-Aware**: Always consider medical conditions when providing exercise or nutrition advice
✅ **Plan-Aware**: Reference the user's current workout and diet plans in all responses
✅ **Progress-Aware**: Understand where the user is in their fitness journey (weeks/months into their plan)
✅ **Gap Analysis**: Analyze completion data to identify areas where user is lacking in their workout or diet plan
✅ **Comprehensive Plan Knowledge**: Deep understanding of the user's entire workout and diet plan structure

**CRITICAL INSTRUCTIONS:**

1. **Exercise Questions**: When asked about specific exercises:
   - Provide detailed step-by-step form instructions
   - Explain advantages and benefits
   - Mention potential disadvantages or risks
   - Suggest modifications if user has health conditions
   - Reference exercises from their current plan if relevant
   - Include proper breathing techniques
   - Warn about common mistakes

2. **Diet Questions**: When asked about nutrition or foods:
   - Explain nutritional benefits and drawbacks
   - Consider their current diet plan and goals
   - Suggest how it fits into their target macros
   - Mention any interactions with their health conditions
   - Reference meals from their current plan if relevant

3. **Health Conditions**: ALWAYS prioritize safety:
   - If user mentions health conditions, adapt ALL advice accordingly
   - Suggest safe alternatives for exercises that may be risky
   - Modify nutrition advice based on medical restrictions
   - When in doubt, recommend consulting healthcare professionals

4. **Current Plan Context**: 
   - Reference their current workout plan when discussing exercises
   - Reference their current diet plan when discussing nutrition
   - Acknowledge their progress (weeks/months into plan)
   - Suggest how new advice fits with their existing plan
   - Consider their plan's duration and goals

5. **Plan Gap Analysis**: When user asks "where am I lacking" or "what am I missing":
   - Analyze their completion rates (exercises, days, meals)
   - Compare completed vs expected based on their plan progress
   - Identify specific areas: missed exercises, skipped days, incomplete meals
   - Point out muscle groups or meal types that are being neglected
   - Suggest actionable steps to improve consistency
   - Reference specific exercises or meals from their plan that need attention
   - Consider their progress timeline and adjust expectations accordingly

6. **Comprehensive Plan Questions**: When asked about their current plan:
   - Answer ANY question about their workout plan (exercises, schedule, structure, goals)
   - Answer ANY question about their diet plan (meals, macros, timing, goals)
   - Provide detailed explanations about plan components
   - Explain the rationale behind plan design
   - Suggest modifications if needed
   - Reference specific days, exercises, or meals from their plan

7. **Off-Topic Questions**: If user asks questions NOT related to:
   - Fitness, exercise, workout, gym, sports
   - Diet, nutrition, food, meals, eating
   - Health, wellness, body, weight
   - Progress, goals, motivation
   - Their current workout or diet plan
   
   Then politely redirect:
   - "I'm your AI fitness trainer focused on helping you with your workouts, diet, and fitness goals. Let's stick to topics related to your fitness journey, current workout plan, or diet plan. How can I help you with your training or nutrition?"
   - Be friendly but firm about staying on topic
   - Always offer to help with fitness-related questions instead

8. **Response Style**:
   - Be encouraging and motivational
   - Provide science-based, actionable advice
   - Keep responses comprehensive but concise (200-300 words, up to 400 for gap analysis)
   - Use clear, easy-to-understand language
   - Include specific examples when helpful

${language === 'ur' ? `\n**CRITICAL LANGUAGE INSTRUCTION:**
- The user's preferred language is Urdu (اردو)
- You MUST respond ENTIRELY in Urdu language
- Use proper Urdu script (اردو) for all your responses
- Translate all technical terms naturally into Urdu
- Maintain the same professional and encouraging tone in Urdu
- If you need to use English technical terms, provide Urdu transliteration alongside
- Example: Instead of "push-ups", use "پش اپس" or explain in Urdu
- All your responses should be in fluent, natural Urdu` : ''}

${context.length > 0 ? `\n**USER'S CURRENT SITUATION:**\n${context.join('\n\n')}\n` : ''}

**USER'S QUESTION:** ${userMessage}

**YOUR RESPONSE (consider all context above${language === 'ur' ? ' and respond in Urdu' : ''}):**`;

    return systemPrompt;
  }

  // Categorize message based on content
  private categorizeMessage(userMessage: string, aiMessage: string): 'workout' | 'diet' | 'motivation' | 'general' {
    const lowerUserMsg = userMessage.toLowerCase();
    const lowerAiMsg = aiMessage.toLowerCase();
    
    const workoutKeywords = ['workout', 'exercise', 'training', 'gym', 'lift', 'cardio', 'strength', 'muscle', 'sets', 'reps'];
    const dietKeywords = ['diet', 'nutrition', 'food', 'meal', 'calories', 'protein', 'carbs', 'fat', 'eating', 'weight'];
    const motivationKeywords = ['motivation', 'encourage', 'goal', 'progress', 'mindset', 'confidence', 'believe', 'achieve'];
    
    const combinedText = lowerUserMsg + ' ' + lowerAiMsg;
    
    if (workoutKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'workout';
    } else if (dietKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'diet';
    } else if (motivationKeywords.some(keyword => combinedText.includes(keyword))) {
      return 'motivation';
    } else {
      return 'general';
    }
  }

  // Save chat message to local storage
  private async saveChatMessage(userMessage: string, aiMessage: string, category: 'workout' | 'diet' | 'motivation' | 'general'): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ No user ID, cannot save chat message');
        return;
      }

      const currentIdKey = await getUserCacheKey('ai_trainer_current_conversation_id', userId);
      let currentConversationId = await Storage.getItem(currentIdKey);
      
      // Create new conversation if none exists
      if (!currentConversationId) {
        currentConversationId = await this.createNewConversation();
      }

      const conversations = await this.getAllConversations();
      const currentConversation = conversations.find(conv => conv.id === currentConversationId);
      
      if (!currentConversation) {
        // Fallback to old format
        const chatHistoryKey = await getUserCacheKey('ai_trainer_chat', userId);
        const chatHistory = await Storage.getItem(chatHistoryKey) || '[]';
        const messages = JSON.parse(chatHistory);
        const timestamp = new Date();
        
        messages.push({
          id: `user_${Date.now()}`,
          type: 'user',
          message: userMessage,
          timestamp: timestamp.toISOString()
        });
        
        messages.push({
          id: `ai_${Date.now() + 1}`,
          type: 'ai',
          message: aiMessage,
          timestamp: timestamp.toISOString(),
          category
        });
        
        // Keep only the last 100 messages in the legacy single-conversation cache
        const recentMessages = messages.slice(-100);
        // Reuse chatHistoryKey variable (already declared above)
        await Storage.setItem(chatHistoryKey, JSON.stringify(recentMessages));
        return;
      }

      const timestamp = new Date();
      
      // Add user message
      currentConversation.messages.push({
        id: `user_${Date.now()}`,
        type: 'user',
        message: userMessage,
        timestamp: timestamp
      });
      
      // Add AI message
      currentConversation.messages.push({
        id: `ai_${Date.now() + 1}`,
        type: 'ai',
        message: aiMessage,
        timestamp: timestamp,
        category: category as 'workout' | 'diet' | 'motivation' | 'general'
      });

      // Generate dynamic title based on conversation context
      // Update title immediately after first user message, or if still "New Chat"
      if (currentConversation.title === 'New Chat') {
        // Get the first user message for title generation
        const firstUserMessage = currentConversation.messages.find(msg => msg.type === 'user');
        const messageToUse = firstUserMessage ? firstUserMessage.message : userMessage;
        
        const newTitle = await this.generateConversationTitle(
          currentConversation, 
          messageToUse, 
          aiMessage, 
          category as 'workout' | 'diet' | 'motivation' | 'general'
        );
        if (newTitle) {
          currentConversation.title = newTitle;
        }
      }

      // Update timestamp
      currentConversation.updatedAt = timestamp;

      // Keep only last 100 messages per conversation to avoid storage bloat
      if (currentConversation.messages.length > 100) {
        currentConversation.messages = currentConversation.messages.slice(-100);
      }

      // Update conversations array and serialize dates for storage
      const updatedConversations = conversations.map(conv => {
        if (conv.id === currentConversationId) {
          return {
            ...currentConversation,
            messages: currentConversation.messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString()
            })),
            createdAt: currentConversation.createdAt.toISOString(),
            updatedAt: currentConversation.updatedAt.toISOString()
          };
        }
        return {
          ...conv,
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
          })),
          createdAt: conv.createdAt instanceof Date ? conv.createdAt.toISOString() : conv.createdAt,
          updatedAt: conv.updatedAt instanceof Date ? conv.updatedAt.toISOString() : conv.updatedAt
        };
      });
      
      // Reuse userId variable (already declared at the beginning of the function)
      if (userId) {
        const conversationsKey = await getUserCacheKey('ai_trainer_conversations', userId);
        await Storage.setItem(conversationsKey, JSON.stringify(updatedConversations));
      }
      
    } catch (error) {
      console.error('❌ Error saving chat message:', error);
    }
  }

  // Get fallback response when AI is unavailable
  private getFallbackResponse(message: string): {
    message: string;
    category: 'workout' | 'diet' | 'motivation' | 'general';
  } {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('workout') || lowerMsg.includes('exercise')) {
      return {
        message: "I'd love to help with your workout! While I'm having connectivity issues, here's a quick tip: Focus on compound movements like squats, deadlifts, and push-ups for maximum efficiency. Always prioritize proper form over heavy weights. What specific aspect of your workout would you like to improve?",
        category: 'workout'
      };
    } else if (lowerMsg.includes('diet') || lowerMsg.includes('nutrition')) {
      return {
        message: "Great question about nutrition! Here's a fundamental principle: aim for a balanced plate with lean protein, complex carbs, healthy fats, and plenty of vegetables. Stay hydrated and eat mindfully. What are your current nutrition goals?",
        category: 'diet'
      };
    } else if (lowerMsg.includes('motivation') || lowerMsg.includes('goal')) {
      return {
        message: "I believe in you! 💪 Remember, every expert was once a beginner. Progress isn't always linear, but consistency is key. Celebrate small wins, learn from setbacks, and keep your long-term vision in mind. You've got this!",
        category: 'motivation'
      };
    } else {
      return {
        message: "Thanks for reaching out! I'm here to help with your fitness journey. Whether you need workout advice, nutrition guidance, or motivational support, I'm your dedicated AI trainer. What would you like to know?",
        category: 'general'
      };
    }
  }

  // Get personalized insights
  async getPersonalizedInsights(): Promise<AITrainerServiceResponse<TrainerInsight[]>> {
    try {
      // Get user progress data
      const userProfile = await userProfileService.getUserProfile();
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          message: 'User not authenticated',
          data: []
        };
      }

      const [exercisesKey, mealsKey] = await Promise.all([
        getUserCacheKey('completed_exercises', userId),
        getUserCacheKey('completed_meals', userId),
      ]);

      const completedExercises = await Storage.getItem(exercisesKey) || '[]';
      const completedMeals = await Storage.getItem(mealsKey) || '[]';
      
      const exercisesList = JSON.parse(completedExercises);
      const mealsList = JSON.parse(completedMeals);
      
      // Generate insights based on user data
      const insights = this.generateInsights(userProfile.data, exercisesList, mealsList);
      
      return {
        success: true,
        message: 'Insights generated successfully',
        data: insights
      };
      
    } catch (error) {
      console.error('❌ Error getting personalized insights:', error);
      return {
        success: false,
        message: 'Failed to generate insights',
        data: []
      };
    }
  }

  // Generate insights based on user data
  private generateInsights(userProfile: any, exercises: any[], meals: any[]): TrainerInsight[] {
    const insights: TrainerInsight[] = [];
    
    // Workout consistency insight
    const recentExercises = exercises.filter(ex => {
      const exDate = new Date(ex.date || ex.completedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return exDate >= weekAgo;
    });
    
    if (recentExercises.length < 3) {
      insights.push({
        id: 'workout-consistency',
        title: 'Increase Workout Frequency',
        description: 'You\'ve completed fewer than 3 workouts this week. Consistency is key to achieving your fitness goals. Try to schedule at least 3-4 workout sessions per week.',
        category: 'workout',
        priority: 'high',
        actionable: true,
        icon: '💪'
      });
    } else if (recentExercises.length >= 5) {
      insights.push({
        id: 'workout-excellent',
        title: 'Excellent Workout Consistency',
        description: 'Outstanding! You\'re maintaining great workout frequency. Consider varying your routine to prevent plateaus and keep challenging your body.',
        category: 'workout',
        priority: 'low',
        actionable: true,
        icon: '🏆'
      });
    }
    
    // Nutrition insight
    const recentMeals = meals.filter(meal => {
      const mealDate = new Date(meal.date || meal.completedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return mealDate >= weekAgo;
    });
    
    if (recentMeals.length < 14) { // Less than 2 meals per day on average
      insights.push({
        id: 'nutrition-frequency',
        title: 'Improve Meal Consistency',
        description: 'You\'re missing several planned meals. Regular nutrition is crucial for energy, recovery, and achieving your body composition goals.',
        category: 'diet',
        priority: 'high',
        actionable: true,
        icon: '🍽️'
      });
    }
    
    // Recovery insight
    insights.push({
      id: 'recovery-importance',
      title: 'Prioritize Recovery',
      description: 'Recovery is when your body adapts and grows stronger. Ensure you\'re getting 7-9 hours of quality sleep and consider active recovery activities.',
      category: 'recovery',
      priority: 'medium',
      actionable: true,
      icon: '😴'
    });
    
    // Motivation insight based on user goal
    if (userProfile?.bodyGoal) {
      insights.push({
        id: 'goal-motivation',
        title: `Stay Focused on ${userProfile.bodyGoal}`,
        description: `Remember your goal of ${userProfile.bodyGoal.toLowerCase()}. Every workout and healthy meal brings you closer to your target. Trust the process and stay consistent.`,
        category: 'motivation',
        priority: 'medium',
        actionable: false,
        icon: '🎯'
      });
    }
    
    return insights;
  }

  // Get workout recommendations
  async getWorkoutRecommendations(): Promise<AITrainerServiceResponse<WorkoutRecommendation[]>> {
    try {
      const userProfile = await userProfileService.getUserProfile();
      const recommendations = this.generateWorkoutRecommendations(userProfile.data);
      
      return {
        success: true,
        message: 'Recommendations generated successfully',
        data: recommendations
      };
      
    } catch (error) {
      console.error('❌ Error getting workout recommendations:', error);
      return {
        success: false,
        message: 'Failed to generate recommendations',
        data: []
      };
    }
  }

  // Generate workout recommendations
  private generateWorkoutRecommendations(userProfile: any): WorkoutRecommendation[] {
    const recommendations: WorkoutRecommendation[] = [];
    
    // Full body strength training
    recommendations.push({
      id: 'full-body-strength',
      title: 'Full Body Strength Circuit',
      description: 'A comprehensive strength training session targeting all major muscle groups. Perfect for building functional strength and muscle mass.',
      exercises: [
        { name: 'Squats', sets: 3, reps: '12-15', notes: 'Focus on proper form' },
        { name: 'Push-ups', sets: 3, reps: '10-12', notes: 'Modify as needed' },
        { name: 'Deadlifts', sets: 3, reps: '8-10', notes: 'Keep back straight' },
        { name: 'Plank', sets: 3, reps: '30-60 sec', notes: 'Engage core' },
        { name: 'Lunges', sets: 3, reps: '10 each leg' },
      ],
      duration: 45,
      difficulty: 'intermediate',
      focus: ['Strength', 'Full Body', 'Functional']
    });
    
    // HIIT cardio
    recommendations.push({
      id: 'hiit-cardio',
      title: 'High Intensity Interval Training',
      description: 'Burn calories efficiently with this intense cardio workout. Great for improving cardiovascular fitness and fat loss.',
      exercises: [
        { name: 'Jumping Jacks', sets: 4, reps: '30 sec', notes: 'High intensity' },
        { name: 'Burpees', sets: 4, reps: '20 sec', notes: 'Full body movement' },
        { name: 'Mountain Climbers', sets: 4, reps: '30 sec', notes: 'Keep core tight' },
        { name: 'Rest', sets: 4, reps: '30 sec', notes: 'Active recovery' },
      ],
      duration: 20,
      difficulty: 'advanced',
      focus: ['Cardio', 'Fat Loss', 'Conditioning']
    });
    
    // Beginner friendly
    recommendations.push({
      id: 'beginner-start',
      title: 'Beginner Foundation Workout',
      description: 'Perfect starting point for fitness beginners. Focus on learning proper movement patterns and building basic strength.',
      exercises: [
        { name: 'Bodyweight Squats', sets: 2, reps: '8-10', notes: 'Learn the movement' },
        { name: 'Wall Push-ups', sets: 2, reps: '8-10', notes: 'Build up strength' },
        { name: 'Assisted Lunges', sets: 2, reps: '5 each leg', notes: 'Use support if needed' },
        { name: 'Modified Plank', sets: 2, reps: '15-30 sec', notes: 'On knees if needed' },
      ],
      duration: 25,
      difficulty: 'beginner',
      focus: ['Foundation', 'Form', 'Confidence']
    });
    
    return recommendations;
  }

  // Generate dynamic conversation title based on context
  private async generateConversationTitle(
    conversation: ChatConversation,
    userMessage: string,
    latestAiMessage: string,
    category: string
  ): Promise<string> {
    try {
      // Get the first user message for title generation
      const firstUserMessage = conversation.messages.find(msg => msg.type === 'user');
      const messageToUse = firstUserMessage ? firstUserMessage.message : userMessage;
      
      // If this is the first exchange (1 user message + 1 AI message), use the first message
      if (conversation.messages.length <= 2) {
        return this.generateTitleFromMessage(messageToUse, category);
      }

      // For longer conversations, analyze the context to generate a better title
      // But still prioritize the first message
      const allMessages = conversation.messages.map(m => m.message).join(' ');
      const title = this.generateTitleFromContext(allMessages, category);
      
      // If the generated title is too generic, fall back to first message
      if (title === 'Fitness Chat' || title === 'Chat' || title === 'Workout Advice' || title === 'Diet Advice') {
        return this.generateTitleFromMessage(messageToUse, category);
      }
      
      return title;
    } catch (error) {
      console.error('❌ Error generating conversation title:', error);
      // Fallback to simple title from first message
      const firstUserMessage = conversation.messages.find(msg => msg.type === 'user');
      const messageToUse = firstUserMessage ? firstUserMessage.message : userMessage;
      return this.generateTitleFromMessage(messageToUse, category);
    }
  }

  // Generate title from a single message
  private generateTitleFromMessage(message: string, category: string): string {
    const lowerMsg = message.toLowerCase().trim();
    
    // Remove common greeting words and question words
    const cleanedMsg = message
      .replace(/^(hi|hello|hey|how|what|when|where|why|can|could|would|should|i|i'm|i am|help|need|want|looking|tell|give|show|explain|please)\s+/i, '')
      .trim();
    
    // Extract key phrases for workout-related
    if (category === 'workout') {
      if (lowerMsg.includes('workout plan') || lowerMsg.includes('training plan')) {
        return 'Workout Plan Discussion';
      }
      if (lowerMsg.includes('exercise') || lowerMsg.includes('routine')) {
        // Try to extract the specific exercise or body part
        const exerciseMatch = cleanedMsg.match(/\b(chest|back|legs|arms|shoulders|abs|biceps|triceps|squat|deadlift|bench|press|pull|push)\b/i);
        if (exerciseMatch) {
          return `${exerciseMatch[0].charAt(0).toUpperCase() + exerciseMatch[0].slice(1)} Workout`;
        }
        return 'Exercise Guidance';
      }
      if (lowerMsg.includes('muscle') || lowerMsg.includes('strength')) {
        return 'Strength Training';
      }
      if (lowerMsg.includes('cardio') || lowerMsg.includes('running')) {
        return 'Cardio Training';
      }
      // Try to create title from first meaningful words
      const words = cleanedMsg.split(' ').filter(w => w.length > 3 && !['workout', 'training', 'exercise'].includes(w.toLowerCase()));
      if (words.length > 0) {
        const title = words.slice(0, 3).join(' ');
        return title.length > 30 ? title.substring(0, 30) + '...' : title;
      }
      return 'Workout Advice';
    }
    
    // Extract key phrases for diet-related
    if (category === 'diet') {
      if (lowerMsg.includes('diet plan') || lowerMsg.includes('meal plan')) {
        return 'Diet Plan Discussion';
      }
      if (lowerMsg.includes('nutrition') || lowerMsg.includes('calories')) {
        return 'Nutrition Guidance';
      }
      if (lowerMsg.includes('protein') || lowerMsg.includes('macros')) {
        return 'Macronutrients';
      }
      if (lowerMsg.includes('weight loss') || lowerMsg.includes('lose weight')) {
        return 'Weight Loss';
      }
      // Try to create title from first meaningful words
      const words = cleanedMsg.split(' ').filter(w => w.length > 3 && !['diet', 'nutrition', 'food', 'meal'].includes(w.toLowerCase()));
      if (words.length > 0) {
        const title = words.slice(0, 3).join(' ');
        return title.length > 30 ? title.substring(0, 30) + '...' : title;
      }
      return 'Diet Advice';
    }
    
    // Extract key phrases for motivation
    if (category === 'motivation') {
      if (lowerMsg.includes('goal') || lowerMsg.includes('target')) {
        return 'Goal Setting';
      }
      if (lowerMsg.includes('progress') || lowerMsg.includes('results')) {
        return 'Progress Discussion';
      }
      return 'Motivation & Support';
    }
    
    // For general, try to extract a meaningful phrase from the first message
    // Remove common words and extract meaningful content
    const meaningfulWords = cleanedMsg
      .split(' ')
      .filter(w => {
        const word = w.toLowerCase();
        return w.length > 3 && 
               !['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should', 'about', 'there', 'their', 'they'].includes(word);
      });
    
    if (meaningfulWords.length > 0) {
      const title = meaningfulWords.slice(0, 4).join(' ');
      // Capitalize first letter
      const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);
      return capitalizedTitle.length > 40 ? capitalizedTitle.substring(0, 40) + '...' : capitalizedTitle;
    }
    
    return 'Chat';
  }

  // Generate title from conversation context
  private generateTitleFromContext(allMessages: string, category: string): string {
    const lowerMessages = allMessages.toLowerCase();
    
    // Analyze the conversation to find the main topic
    const topics: { [key: string]: number } = {
      'workout': (lowerMessages.match(/\b(workout|exercise|training|gym|lift|cardio|strength|muscle|sets|reps)\b/g) || []).length,
      'diet': (lowerMessages.match(/\b(diet|nutrition|food|meal|calories|protein|carbs|fat|eating)\b/g) || []).length,
      'motivation': (lowerMessages.match(/\b(motivation|encourage|goal|progress|mindset|confidence)\b/g) || []).length,
    };
    
    // Find the dominant topic
    const dominantTopic = Object.entries(topics).reduce((a, b) => topics[a[0]] > topics[b[0]] ? a : b)[0];
    
    // Generate category-specific titles
    if (dominantTopic === 'workout' || category === 'workout') {
      if (lowerMessages.includes('plan') || lowerMessages.includes('routine')) {
        return 'Workout Plan Discussion';
      }
      if (lowerMessages.includes('muscle') || lowerMessages.includes('strength')) {
        return 'Strength Training Chat';
      }
      return 'Workout Guidance';
    }
    
    if (dominantTopic === 'diet' || category === 'diet') {
      if (lowerMessages.includes('plan') || lowerMessages.includes('meal')) {
        return 'Diet Plan Discussion';
      }
      if (lowerMessages.includes('nutrition') || lowerMessages.includes('calories')) {
        return 'Nutrition Chat';
      }
      return 'Diet Advice';
    }
    
    if (dominantTopic === 'motivation' || category === 'motivation') {
      return 'Motivation & Support';
    }
    
    // Extract first meaningful phrase from conversation
    const sentences = allMessages.split(/[.!?]/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      const words = firstSentence.split(' ').filter(w => w.length > 3).slice(0, 5);
      if (words.length > 0) {
        const title = words.join(' ');
        return title.length > 40 ? title.substring(0, 40) + '...' : title;
      }
    }
    
    return 'Fitness Chat';
  }

  // Determine if title should be updated
  private shouldUpdateTitle(conversation: ChatConversation): boolean {
    // Update title if it's still generic and we have enough context (3+ messages)
    return conversation.title === 'New Chat' && conversation.messages.length >= 3;
  }

  // Clear chat history
  async clearChatHistory(): Promise<void> {
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        const [chatKey, conversationsKey, currentIdKey] = await Promise.all([
          getUserCacheKey('ai_trainer_chat', userId),
          getUserCacheKey('ai_trainer_conversations', userId),
          getUserCacheKey('ai_trainer_current_conversation_id', userId),
        ]);

        await Promise.all([
          Storage.removeItem(chatKey),
          Storage.removeItem(conversationsKey),
          Storage.removeItem(currentIdKey),
          // Also clear old global keys for migration
          Storage.removeItem('ai_trainer_chat'),
          Storage.removeItem('ai_trainer_conversations'),
          Storage.removeItem('ai_trainer_current_conversation_id'),
        ]);
      }
      console.log('🗑️ AI trainer chat history cleared');
    } catch (error) {
      console.error('❌ Error clearing chat history:', error);
    }
  }
}

export default new AITrainerService();
