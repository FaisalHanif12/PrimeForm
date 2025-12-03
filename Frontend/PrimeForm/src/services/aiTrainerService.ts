import { api } from '../config/api';
import Storage from '../utils/storage';
import aiWorkoutService from './aiWorkoutService';
import aiDietService from './aiDietService';
import userProfileService from './userProfileService';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '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';
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://primeform.app';
const SITE_NAME = process.env.EXPO_PUBLIC_SITE_NAME || 'PrimeForm';

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

      // Load current conversation from local storage
      const currentConversationId = await Storage.getItem('ai_trainer_current_conversation_id');
      
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

      // Fallback to old format for backward compatibility
      const chatHistory = await Storage.getItem('ai_trainer_chat') || '[]';
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
      const conversationsJson = await Storage.getItem('ai_trainer_conversations') || '[]';
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
      
      await Storage.setItem('ai_trainer_conversations', JSON.stringify(serializedConversations));
      await Storage.setItem('ai_trainer_current_conversation_id', conversationId);
      
      return conversationId;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw error;
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const conversations = await this.getAllConversations();
      const filtered = conversations.filter(conv => conv.id !== conversationId);
      await Storage.setItem('ai_trainer_conversations', JSON.stringify(filtered));
      
      // If deleted conversation was current, clear current conversation ID
      const currentId = await Storage.getItem('ai_trainer_current_conversation_id');
      if (currentId === conversationId) {
        await Storage.removeItem('ai_trainer_current_conversation_id');
      }
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

      await Storage.setItem('ai_trainer_current_conversation_id', conversationId);
      
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
  async sendMessage(message: string): Promise<AITrainerServiceResponse<{
    message: string;
    category: 'workout' | 'diet' | 'motivation' | 'general';
  }>> {
    try {
      // Check if API key is available
      if (!OPENROUTER_API_KEY) {
        throw new Error('Sorry for the inconvenience. AI is temporarily unavailable.');
      }
      
      console.log('🤖 Sending message to AI Trainer:', message);

      // Get user context for personalization
      const userProfile = await userProfileService.getUserProfile();
      const workoutPlan = await aiWorkoutService.loadWorkoutPlanFromDatabase();
      const dietPlan = await aiDietService.loadDietPlanFromDatabase();

      // Create context-aware prompt
      const contextPrompt = this.buildContextualPrompt(message, userProfile.data, workoutPlan, dietPlan);

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
          max_tokens: 1000,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.status}`);
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
  private buildContextualPrompt(userMessage: string, userProfile: any, workoutPlan: any, dietPlan: any): string {
    const context = [];
    
    // Add user profile context
    if (userProfile) {
      context.push(`User Profile:
- Goal: ${userProfile.bodyGoal}
- Age: ${userProfile.age}
- Weight: ${userProfile.currentWeight}kg
- Height: ${userProfile.height}cm
- Activity Level: Active
- Equipment: ${userProfile.availableEquipment}
- Medical Conditions: ${userProfile.medicalConditions || 'None'}`);
    }

    // Add workout plan context
    if (workoutPlan) {
      context.push(`Current Workout Plan:
- Duration: ${workoutPlan.duration}
- Goal: ${workoutPlan.goal}
- Total Weeks: ${workoutPlan.totalWeeks}`);
    }

    // Add diet plan context
    if (dietPlan) {
      context.push(`Current Diet Plan:
- Goal: ${dietPlan.goal}
- Target Calories: ${dietPlan.targetCalories}
- Target Protein: ${dietPlan.targetProtein}g
- Duration: ${dietPlan.duration}`);
    }

    const systemPrompt = `You are an expert AI Personal Trainer and Nutritionist with advanced knowledge in:
- Exercise science and biomechanics
- Nutrition and meal planning
- Sports psychology and motivation
- Injury prevention and recovery
- Progressive training methodologies

Your role is to provide:
✅ Personalized, science-based advice
✅ Motivational and encouraging responses
✅ Practical, actionable recommendations
✅ Safety-first approach to training
✅ Holistic fitness and wellness guidance

${context.length > 0 ? `\n**User Context:**\n${context.join('\n\n')}` : ''}

**User Question:** ${userMessage}

**Instructions:**
- Provide a helpful, personalized response based on the user's context
- Keep responses concise but comprehensive (under 200 words)
- Use encouraging and motivational language
- Include specific, actionable advice when possible
- Prioritize safety and proper form
- Reference the user's goals and current plans when relevant

**Response:**`;

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
      let currentConversationId = await Storage.getItem('ai_trainer_current_conversation_id');
      
      // Create new conversation if none exists
      if (!currentConversationId) {
        currentConversationId = await this.createNewConversation();
      }

      const conversations = await this.getAllConversations();
      const currentConversation = conversations.find(conv => conv.id === currentConversationId);
      
      if (!currentConversation) {
        // Fallback to old format
        const chatHistory = await Storage.getItem('ai_trainer_chat') || '[]';
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
        
        const recentMessages = messages.slice(-50);
        await Storage.setItem('ai_trainer_chat', JSON.stringify(recentMessages));
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
      if (currentConversation.title === 'New Chat' || this.shouldUpdateTitle(currentConversation)) {
        const newTitle = await this.generateConversationTitle(
          currentConversation, 
          userMessage, 
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
      
      await Storage.setItem('ai_trainer_conversations', JSON.stringify(updatedConversations));
      
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
      const completedExercises = await Storage.getItem('completed_exercises') || '[]';
      const completedMeals = await Storage.getItem('completed_meals') || '[]';
      
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
    latestUserMessage: string,
    latestAiMessage: string,
    category: string
  ): Promise<string> {
    try {
      // If this is the first exchange, use a smart title based on the message
      if (conversation.messages.length <= 2) {
        return this.generateTitleFromMessage(latestUserMessage, category);
      }

      // For longer conversations, analyze the context to generate a better title
      const allMessages = conversation.messages.map(m => m.message).join(' ');
      const title = this.generateTitleFromContext(allMessages, category);
      
      return title;
    } catch (error) {
      console.error('❌ Error generating conversation title:', error);
      // Fallback to simple title
      return this.generateTitleFromMessage(latestUserMessage, category);
    }
  }

  // Generate title from a single message
  private generateTitleFromMessage(message: string, category: string): string {
    const lowerMsg = message.toLowerCase();
    
    // Extract key phrases for workout-related
    if (category === 'workout') {
      if (lowerMsg.includes('workout plan') || lowerMsg.includes('training plan')) {
        return 'Workout Plan Discussion';
      }
      if (lowerMsg.includes('exercise') || lowerMsg.includes('routine')) {
        return 'Exercise Guidance';
      }
      if (lowerMsg.includes('muscle') || lowerMsg.includes('strength')) {
        return 'Strength Training';
      }
      if (lowerMsg.includes('cardio') || lowerMsg.includes('running')) {
        return 'Cardio Training';
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
    
    // For general, try to extract a meaningful phrase
    const words = message.split(' ').filter(w => w.length > 3);
    if (words.length > 0) {
      const title = words.slice(0, 4).join(' ');
      return title.length > 40 ? title.substring(0, 40) + '...' : title;
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
      await Storage.removeItem('ai_trainer_chat');
      await Storage.removeItem('ai_trainer_conversations');
      await Storage.removeItem('ai_trainer_current_conversation_id');
      console.log('🗑️ AI trainer chat history cleared');
    } catch (error) {
      console.error('❌ Error clearing chat history:', error);
    }
  }
}

export default new AITrainerService();
