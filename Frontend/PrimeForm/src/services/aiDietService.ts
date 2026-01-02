import { UserProfile } from './userProfileService';
import dietPlanService from './dietPlanService';
import Storage from '../utils/storage';
import { getUserCacheKey, getCurrentUserId, validateCachedData } from '../utils/cacheKeys';
import { calculatePlanDuration, formatDurationForPrompt, PlanDuration } from '../utils/planDurationCalculator';
import { getHeightInCm, formatHeightForPrompt } from '../utils/heightConverter';
import { api } from '../config/api';

export interface DietMeal {
  name: string;
  emoji: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  preparationTime: string;
  servingSize: string;
  instructions?: string;
}

export interface DietDay {
  day: number;
  dayName: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  meals: {
    breakfast: DietMeal;
    lunch: DietMeal;
    dinner: DietMeal;
    snacks: DietMeal[];
  };
  waterIntake: string;
  notes: string;
}

export interface DietPlan {
  _id?: string;
  id?: string;
  goal: string;
  duration: string;
  country: string;
  totalWeeks?: number;
  weeklyPlan: DietDay[];
  startDate: string;
  endDate: string;
  keyNotes: string[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  completedMeals?: string[];
  completedDays?: string[];
}

export interface AIDietResponse {
  success: boolean;
  data: DietPlan | null;
  message: string;
}

class AIDietService {
  private loadingCache: Map<string, Promise<any>> = new Map();
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache - diet plan rarely changes

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
    console.log('✅ AI Diet Service in-memory cache cleared');
  }

  private generatePrompt(userProfile: UserProfile): string {
    // ✅ CRITICAL: Normalize height to cm for calculations (handles both cm and inches)
    const heightCm = getHeightInCm(userProfile.height);
    const formattedHeight = formatHeightForPrompt(userProfile.height, heightCm);
    
    const dailyCalories = userProfile.gender === 'Male' ?
      Math.round(88.362 + (13.397 * Number(userProfile.currentWeight)) + (4.799 * heightCm) - (5.677 * userProfile.age)) * 1.4 :
      Math.round(447.593 + (9.247 * Number(userProfile.currentWeight)) + (3.098 * heightCm) - (4.330 * userProfile.age)) * 1.4;

    const targetWeightLine =
      userProfile.bodyGoal?.includes('Gain') || userProfile.bodyGoal?.includes('Lose') || userProfile.bodyGoal?.includes('Fat')
        ? `- Target Weight: ${userProfile.targetWeight ? `${userProfile.targetWeight}kg` : 'Not provided'}`
        : null;

    // Calculate optimal plan duration based on user profile
    const planDuration = calculatePlanDuration(userProfile);
    const durationForPrompt = formatDurationForPrompt(planDuration);

    const prompt = `
You are a certified nutritionist. Create a **7-day diet plan** for this user:

**USER PROFILE:**
- Age: ${userProfile.age}, Gender: ${userProfile.gender}, Height: ${formattedHeight}, Weight: ${userProfile.currentWeight}kg
- Goal: ${userProfile.bodyGoal} (PRIORITY)
${targetWeightLine ? `${targetWeightLine}\n` : ''}- Diet: ${userProfile.dietPreference || 'No restriction'}
- Country: ${userProfile.country || 'International'}
- Calories: ${dailyCalories} kcal/day
- Medical: ${userProfile.medicalConditions || 'None'}

**REQUIREMENTS:**
- Follow ${userProfile.dietPreference || 'no restrictions'} diet strictly
- Use ${userProfile.country || 'international'} cuisine 
- ${userProfile.bodyGoal.includes('Gain') ? 'High protein, caloric surplus' : userProfile.bodyGoal.includes('Loss') || userProfile.bodyGoal.includes('Fat') ? 'High protein, caloric deficit' : 'Balanced nutrition'}
- ${userProfile.medicalConditions ? `Modify for: ${userProfile.medicalConditions}` : 'No medical restrictions'}

**CRITICAL - DIET TYPE & REGIONAL CUISINE:**
- **Diet Type Compliance:** The diet MUST strictly follow ${userProfile.dietPreference || 'no restrictions'} diet type. If vegetarian - NO meat, fish, or poultry. If pescatarian - include fish but NO meat or poultry. If non-vegetarian - can include all protein sources. If vegan - NO animal products whatsoever.
- **Regional Authenticity:** Since the user is from ${userProfile.country || 'International'}, create meals using POPULAR, AUTHENTIC, and HEALTHY dishes from ${userProfile.country || 'international'} cuisine that are commonly eaten in that region.
- **Diet Type + Regional Balance:** Combine regional authenticity with diet type - select traditional ${userProfile.country || 'international'} dishes that naturally fit the ${userProfile.dietPreference || 'no restrictions'} diet type. For example, if vegetarian and from India, use dishes like "Dal Tadka", "Palak Paneer", "Chana Masala". If non-vegetarian and from Pakistan, use dishes like "Chicken Karahi", "Beef Biryani", "Mutton Curry".
- **Cultural Relevance:** Ensure all meals reflect the cooking styles, spices, and ingredients commonly used in ${userProfile.country || 'international'} cuisine while maintaining nutritional balance and diet type restrictions.

**CRITICAL - PLAN DURATION:**
- This plan must be designed for a total duration of **${durationForPrompt}**
- The 7-day plan you create will repeat weekly for ${planDuration.totalWeeks} weeks
- Ensure the plan supports sustainable progress over this entire period
- Use Duration: **${planDuration.duration}** in your output (exactly as specified)

**OUTPUT FORMAT:**

**Goal:** [goal]  
**Duration:** ${planDuration.duration} (MUST use this exact duration)  
**Target Daily Calories:** [calories]

#### 🍽️ 7-Day Plan  

**Day 1: [Day Name]**  
**Breakfast:** [ACTUAL MEAL NAME like "Oatmeal with Berries" or "Scrambled Eggs with Toast"] – [Cal] kcal | P: [X]g | C: [X]g | F: [X]g – [Time] min  
- Ingredients: [list]
- Instructions: [brief method]

**Lunch:** [ACTUAL MEAL NAME like "Grilled Chicken Salad" or "Vegetable Curry"] – [Cal] kcal | P: [X]g | C: [X]g | F: [X]g – [Time] min  
- Ingredients: [list]
- Instructions: [brief method]

**Dinner:** [ACTUAL MEAL NAME like "Baked Salmon with Vegetables" or "Lentil Soup"] – [Cal] kcal | P: [X]g | C: [X]g | F: [X]g – [Time] min  
- Ingredients: [list]
- Instructions: [brief method]

**Snacks:**
- Snack 1: [ACTUAL SNACK NAME like "Apple with Almonds" or "Greek Yogurt"] – [Cal] kcal
- Snack 2: [ACTUAL SNACK NAME like "Trail Mix" or "Protein Bar"] – [Cal] kcal

**CRITICAL MEAL NAMING RULES:**
1. NEVER use generic labels like "Breakfast", "Lunch", "Dinner", or "Snack" as the meal name
2. ALWAYS use SPECIFIC, DESCRIPTIVE names that describe the actual food using ${userProfile.country || 'regional'} dish names when applicable
3. Each meal name should be unique and tell the user exactly what dish they're eating
4. Use authentic ${userProfile.country || 'regional'} dish names when possible (e.g., for ${userProfile.country || 'international'} cuisine: use traditional dish names from that region)
5. Examples of GOOD names: ${userProfile.dietPreference?.toLowerCase().includes('veg') ? '"Dal Tadka with Rice", "Palak Paneer with Roti", "Chana Masala"' : userProfile.dietPreference?.toLowerCase().includes('pescatarian') || userProfile.dietPreference?.toLowerCase().includes('fish') ? '"Grilled Fish Curry", "Fish Biryani", "Salmon Tikka"' : '"Chicken Karahi", "Beef Biryani", "Mutton Curry"'} or international dishes like "Oatmeal with Berries", "Grilled Chicken Salad", "Baked Salmon with Vegetables"
6. Examples of BAD names: "Breakfast", "Lunch", "Dinner", "Meal 1", "Food"
7. The meal name should appear immediately after "**Breakfast:**", "**Lunch:**", or "**Dinner:**" and before the "–" symbol
8. Prioritize popular, healthy, and authentic ${userProfile.country || 'regional'} dishes that fit the ${userProfile.dietPreference || 'diet'} type

**Daily Totals:** [Total] kcal | P: [X]g | C: [X]g | F: [X]g  
**Water Intake:** [X] liters  
**Notes:** [tips]

---

**Day 2: [Day Name]**  
[Same concise format for remaining 6 days]

Generate complete 7-day plan now.
    `;

    return prompt;
  }

  async generateDietPlan(userProfile: UserProfile): Promise<AIDietResponse> {
    try {
      const prompt = this.generatePrompt(userProfile);

      const startTime = Date.now();

      // Call backend proxy endpoint instead of OpenRouter directly
      const response = await api.post('/diet-plans/generate', {
        prompt: prompt
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.success || !response.data?.content) {
        throw new Error(response.message || 'Invalid response format from AI');
      }

      const aiResponse = response.data.content;

      // Parse the AI response into structured data
      const dietPlan = this.parseAIResponse(aiResponse, userProfile);

      // Store the response in database for persistence with retry logic
      let saveResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          saveResponse = await dietPlanService.createDietPlan(dietPlan);
          if (saveResponse.success) {
            // Also cache locally as backup with user-specific key
            const userId = await getCurrentUserId();
            if (userId) {
              const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
              const dataToCache = { ...dietPlan, userId };
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
              const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
              const dataToCache = { ...dietPlan, userId };
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
        data: dietPlan,
        message: `Diet plan generated successfully in ${(responseTime / 1000).toFixed(2)}s`
      };

    } catch (error) {
      throw error;
    }
  }


  // Load diet plan - prioritizes local cache to minimize API calls
  async loadDietPlanFromDatabase(forceRefresh = false): Promise<DietPlan | null> {
    const cacheKey = 'diet-plan-active';

    // If forcing refresh, clear any existing loading cache
    if (forceRefresh) {
      this.loadingCache.delete(cacheKey);
      this.clearCache(cacheKey);
    } else {
      // Check if there's already a request in flight
      if (this.loadingCache.has(cacheKey)) {
        return this.loadingCache.get(cacheKey);
      }
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
        // OPTIMIZATION: Try local storage first to avoid API call (skip if forceRefresh)
        if (!forceRefresh) {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
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
        const response = await dietPlanService.getActiveDietPlan();
        if (response.success && response.data) {
          await this.setCachedData(cacheKey, response.data);
          // Also update local cache with user-specific key
          const userId = await getCurrentUserId();
          if (userId) {
            const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
            // Add userId to cached data for validation
            const dataToCache = { ...response.data, userId };
            await Storage.setItem(userCacheKey, JSON.stringify(dataToCache));
          }
          return response.data;
        }
      } catch (error) {
        // Only try to load from local cache as fallback if NOT forcing refresh
        if (!forceRefresh) {
          try {
            const userId = await getCurrentUserId();
            if (userId) {
              const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
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

  // Force refresh diet plan from database (use after completing actions)
  async refreshDietPlanFromDatabase(): Promise<DietPlan | null> {
    return this.loadDietPlanFromDatabase(true);
  }

  // Clear diet plan from database
  async clearDietPlanFromDatabase(): Promise<void> {
    try {
      // Clear loading cache first to prevent any in-flight requests
      this.loadingCache.delete('diet-plan-active');
      
      // Clear from database
      await dietPlanService.clearAllDietPlans();

      // Clear local cache (both user-specific and old global)
      const userId = await getCurrentUserId();
      if (userId) {
        const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
        await Storage.removeItem(userCacheKey);
        
        // ✅ CRITICAL FIX: DO NOT delete completion data when clearing diet plan
        // User's meal completions and water intake are valuable progress data that should persist
        // even when they generate a new diet plan. Only clear the plan itself, not the progress!
        // Completion data: completed_meals, completed_diet_days, water_intake, water_completed
        // These should ONLY be cleared if user explicitly resets their entire progress
      }
      
      // Clear old global keys for migration (plan only, not completion data)
      await Storage.removeItem('cached_diet_plan');
      // ✅ DO NOT clear: completed_meals, completed_diet_days, water_intake, water_completed

      // Clear memory cache
      this.clearCache('diet-plan-active');
      
      // Clear ALL loading cache entries related to diet
      for (const key of this.loadingCache.keys()) {
        if (key.includes('diet')) {
          this.loadingCache.delete(key);
        }
      }
      
      if (__DEV__) {
        console.log('✅ Diet plan cleared successfully (completion data preserved)');
      }
    } catch (error) {
      console.error('❌ Error clearing diet plan from database:', error);
      // Still try to clear local cache even if database clear fails
      try {
        // Clear loading cache
        this.loadingCache.delete('diet-plan-active');
        
        const userId = await getCurrentUserId();
        if (userId) {
          const userCacheKey = await getUserCacheKey('cached_diet_plan', userId);
          await Storage.removeItem(userCacheKey);
        }
        await Storage.removeItem('cached_diet_plan');
        this.clearCache('diet-plan-active');
      } catch (cacheError) {
        console.error('❌ Error clearing local cache:', cacheError);
      }
    }
  }

  private parseAIResponse(aiResponse: string, userProfile: UserProfile): DietPlan {
    // Calculate optimal plan duration based on user profile (PRIORITY - use this over AI response)
    const planDuration = calculatePlanDuration(userProfile);
    
    // Extract goal and calories from the AI response (still parse these from AI)
    const goalMatch = aiResponse.match(/\*\*Goal:\*\*\s*(.+?)(?:\n|$)/i);
    const caloriesMatch = aiResponse.match(/\*\*Target Daily Calories:\*\*\s*(\d+)/i);
    const countryMatch = aiResponse.match(/\*\*Country Cuisine:\*\*\s*(.+?)(?:\n|$)/i);

    // Ensure goal matches user profile more closely and normalize format
    let goal = goalMatch ? goalMatch[1].trim() : userProfile.bodyGoal || 'General Health';

    // Normalize goal to match expected values
    if (goal.toLowerCase().includes('gain') && goal.toLowerCase().includes('muscle')) {
      goal = 'Muscle Gain';
    } else if (goal.toLowerCase().includes('lose') || goal.toLowerCase().includes('fat')) {
      goal = 'Fat Loss';
    } else if (goal.toLowerCase().includes('maintain') || goal.toLowerCase().includes('general')) {
      goal = 'General Health';
    }

    // Use calculated duration (not from AI) to ensure consistency
    const duration = planDuration.duration;
    const totalWeeks = planDuration.totalWeeks;
    const targetCalories = caloriesMatch ? parseInt(caloriesMatch[1]) : 2000;
    const country = countryMatch ? countryMatch[1].trim() : userProfile.country || 'International';

    // Parse the AI response to extract diet days
    const weeklyPlan: DietDay[] = this.parseAIDietDays(aiResponse);

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
      country: country,
      keyNotes: [
        'Stay hydrated - drink plenty of water throughout the day',
        'Eat slowly and mindfully to aid digestion',
        'Prepare meals in advance when possible',
        'Listen to your body and adjust portions as needed',
        'Include variety to ensure all nutrients are covered'
      ],
      weeklyPlan: weeklyPlan, // Keep the 7-day pattern
      startDate: formatLocalDate(startDate),
      endDate: formatLocalDate(endDate),
      totalWeeks: totalWeeks,
      targetCalories: targetCalories,
      targetProtein: Math.round(targetCalories * 0.2 / 4), // 20% protein
      targetCarbs: Math.round(targetCalories * 0.5 / 4), // 50% carbs
      targetFats: Math.round(targetCalories * 0.3 / 9), // 30% fats
    };
  }

  private parseAIDietDays(aiResponse: string): DietDay[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyPlan: DietDay[] = [];

    // Split the response into day sections using --- as delimiter
    const daySections = aiResponse.split(/---/).filter(section => section.trim());

    // Get today's day of week to start first week from current day
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Calculate the day name based on current day rotation
      const actualDayIndex = (currentDayOfWeek + i) % 7;
      const dayName = days[actualDayIndex];

      // Find the corresponding day section - look for Day 1:, Day 2:, etc.
      const dayNumber = i + 1;
      const daySection = daySections.find(section => {
        const sectionText = section.toLowerCase();
        return sectionText.includes(`day ${dayNumber}:`) ||
          sectionText.includes(`**day ${dayNumber}:`) ||
          sectionText.includes(`day ${dayNumber} `);
      });

      if (daySection) {
        const meals = this.parseAIMeals(daySection);
        const dailyTotals = this.calculateDailyTotals(meals);
        const waterIntake = this.extractWaterIntake(daySection);
        const notes = this.extractDayNotes(daySection);

        weeklyPlan.push({
          day: i + 1,
          dayName: dayName, // Use calculated day name
          date: date.toISOString().split('T')[0],
          totalCalories: dailyTotals.calories,
          totalProtein: dailyTotals.protein,
          totalCarbs: dailyTotals.carbs,
          totalFats: dailyTotals.fats,
          meals: meals,
          waterIntake: waterIntake,
          notes: notes
        });
      } else {
        // If no day section found, create a default day
        weeklyPlan.push({
          day: i + 1,
          dayName: dayName, // Use calculated day name
          date: date.toISOString().split('T')[0],
          totalCalories: 2000,
          totalProtein: 100,
          totalCarbs: 250,
          totalFats: 67,
          meals: {
            breakfast: this.getDefaultMeal('Breakfast', '🍳'),
            lunch: this.getDefaultMeal('Lunch', '🥗'),
            dinner: this.getDefaultMeal('Dinner', '🍽️'),
            snacks: [this.getDefaultMeal('Snack', '🍎')]
          },
          waterIntake: '2-3 liters',
          notes: 'Follow a balanced diet with variety'
        });
      }
    }

    return weeklyPlan;
  }

  private parseAIMeals(daySection: string): {
    breakfast: DietMeal;
    lunch: DietMeal;
    dinner: DietMeal;
    snacks: DietMeal[];
  } {
    // Parse breakfast, lunch, dinner, and snacks from the day section
    // Try to parse each meal, and only use default if parsing completely fails
    let breakfast = this.parseMealSection(daySection, 'breakfast');
    let lunch = this.parseMealSection(daySection, 'lunch');
    let dinner = this.parseMealSection(daySection, 'dinner');
    
    // If parsing failed, try alternative patterns or extract from raw text
    if (!breakfast) {
      breakfast = this.parseMealSectionAlternative(daySection, 'breakfast') || this.getDefaultMeal('Breakfast', '🍳');
    }
    if (!lunch) {
      lunch = this.parseMealSectionAlternative(daySection, 'lunch') || this.getDefaultMeal('Lunch', '🥗');
    }
    if (!dinner) {
      dinner = this.parseMealSectionAlternative(daySection, 'dinner') || this.getDefaultMeal('Dinner', '🍽️');
    }
    
    const snacks = this.parseSnacksSection(daySection);

    return { breakfast, lunch, dinner, snacks };
  }

  // Alternative parsing method - tries to extract meal name even from less structured formats
  private parseMealSectionAlternative(daySection: string, mealType: string): DietMeal | null {
    // Look for meal type followed by colon and meal name
    const patterns = [
      new RegExp(`${mealType}:\\s*([A-Z][^–\\n]+?)(?:\\s*–|\\s*\\||\\n)`, 'i'),
      new RegExp(`\\*\\*${mealType}:\\*\\*\\s*([A-Z][^–\\n]+?)(?:\\s*–|\\s*\\||\\n)`, 'i'),
      new RegExp(`${mealType}\\s+([A-Z][^–\\n]+?)(?:\\s*–|\\s*\\||\\n)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = daySection.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Only accept if it's a real meal name (not just "Breakfast", "Lunch", etc.)
        if (name && name.toLowerCase() !== mealType.toLowerCase() && name.length > 3) {
          // Try to extract calories from nearby text
          const caloriesMatch = daySection.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]*?(\\d+)\\s*kcal`, 'i'));
          const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 300;
          
          return {
            name: name,
            emoji: this.getMealEmoji(name),
            ingredients: this.extractIngredients(daySection, mealType),
            calories: calories,
            protein: Math.round(calories * 0.2 / 4),
            carbs: Math.round(calories * 0.5 / 4),
            fats: Math.round(calories * 0.3 / 9),
            preparationTime: '15 min',
            servingSize: '1 serving',
            instructions: this.extractInstructions(daySection, mealType) || 'Prepare according to standard cooking methods'
          };
        }
      }
    }

    return null;
  }

  private parseMealSection(daySection: string, mealType: string): DietMeal | null {
    // Try multiple regex patterns to handle different AI response formats
    // Pattern 1: Full format with all fields
    let mealRegex = new RegExp(`\\*\\*${mealType}:\\*\\*\\s*(.+?)\\s*[–-]\\s*(\\d+)\\s*kcal.*?[Pp]rotein:\\s*(\\d+)g.*?[Cc]arbs?:\\s*(\\d+)g.*?[Ff]ats?:\\s*(\\d+)g.*?[Pp]rep?:\\s*([^\\n]+)`, 'i');
    let match = daySection.match(mealRegex);

    // Pattern 2: Format with | separator (P: Xg | C: Xg | F: Xg)
    if (!match) {
      mealRegex = new RegExp(`\\*\\*${mealType}:\\*\\*\\s*(.+?)\\s*[–-]\\s*(\\d+)\\s*kcal.*?[Pp]:\\s*(\\d+)g.*?[Cc]:\\s*(\\d+)g.*?[Ff]:\\s*(\\d+)g`, 'i');
      match = daySection.match(mealRegex);
    }

    // Pattern 3: Just name and calories (minimal format)
    if (!match) {
      mealRegex = new RegExp(`\\*\\*${mealType}:\\*\\*\\s*(.+?)\\s*[–-]\\s*(\\d+)\\s*kcal`, 'i');
      match = daySection.match(mealRegex);
    }

    // Pattern 4: Without ** markers (some AI responses might not use them)
    if (!match) {
      mealRegex = new RegExp(`${mealType}:\\s*(.+?)\\s*[–-]\\s*(\\d+)\\s*kcal`, 'i');
      match = daySection.match(mealRegex);
    }

    if (match) {
      const name = match[1]?.trim() || '';
      const calories = parseInt(match[2]) || 0;
      
      // Extract macros if available
      let protein = 0, carbs = 0, fats = 0;
      if (match[3] && match[4] && match[5]) {
        protein = parseInt(match[3]) || 0;
        carbs = parseInt(match[4]) || 0;
        fats = parseInt(match[5]) || 0;
      } else {
        // Try to extract macros separately if not in main match
        const proteinMatch = daySection.match(new RegExp(`[Pp]rotein:?\\s*(\\d+)g`, 'i')) || daySection.match(new RegExp(`[Pp]:\\s*(\\d+)g`, 'i'));
        const carbsMatch = daySection.match(new RegExp(`[Cc]arbs?:?\\s*(\\d+)g`, 'i')) || daySection.match(new RegExp(`[Cc]:\\s*(\\d+)g`, 'i'));
        const fatsMatch = daySection.match(new RegExp(`[Ff]ats?:?\\s*(\\d+)g`, 'i')) || daySection.match(new RegExp(`[Ff]:\\s*(\\d+)g`, 'i'));
        
        protein = proteinMatch ? parseInt(proteinMatch[1]) : Math.round(calories * 0.2 / 4);
        carbs = carbsMatch ? parseInt(carbsMatch[1]) : Math.round(calories * 0.5 / 4);
        fats = fatsMatch ? parseInt(fatsMatch[1]) : Math.round(calories * 0.3 / 9);
      }

      // Extract prep time if available
      const prepTimeMatch = daySection.match(new RegExp(`[Pp]rep?:?\\s*([^\\n]+)`, 'i')) || 
                           daySection.match(new RegExp(`[Tt]ime:?\\s*([^\\n]+)`, 'i'));
      const prepTime = prepTimeMatch ? prepTimeMatch[1].trim() : '15 min';

      const ingredients = this.extractIngredients(daySection, mealType);
      const instructions = this.extractInstructions(daySection, mealType);

      // Only return if we have a valid name (not empty and not just the meal type)
      if (name && name.toLowerCase() !== mealType.toLowerCase() && name.length > 2) {
        const parsedMeal = {
          name: name.trim(),
          emoji: this.getMealEmoji(name.trim()),
          ingredients: ingredients.length > 0 ? ingredients : ['Healthy ingredients'],
          calories: calories,
          protein: protein,
          carbs: carbs,
          fats: fats,
          preparationTime: prepTime,
          servingSize: '1 serving',
          instructions: instructions || 'Prepare according to standard cooking methods'
        };
        
        if (__DEV__) {
          console.log(`✅ Successfully parsed ${mealType}: "${parsedMeal.name}"`);
        }
        
        return parsedMeal;
      } else {
        if (__DEV__) {
          console.warn(`⚠️ Parsed ${mealType} but name is invalid: "${name}"`);
        }
      }
    }

    if (__DEV__) {
      console.warn(`⚠️ Failed to parse ${mealType} from day section. Trying alternative methods...`);
    }
    
    return null;
  }

  private parseSnacksSection(daySection: string): DietMeal[] {
    const snacks: DietMeal[] = [];
    const snackRegex = /- Snack \d+:\s*(.+?)\s*–\s*(\d+)\s*kcal/gi;
    let match;

    while ((match = snackRegex.exec(daySection)) !== null) {
      const [, name, calories] = match;
      snacks.push({
        name: name.trim(),
        emoji: this.getMealEmoji(name.trim()),
        ingredients: [name.trim()],
        calories: parseInt(calories) || 100,
        protein: Math.round(parseInt(calories) * 0.15 / 4), // Estimate
        carbs: Math.round(parseInt(calories) * 0.6 / 4), // Estimate
        fats: Math.round(parseInt(calories) * 0.25 / 9), // Estimate
        preparationTime: '5 min',
        servingSize: '1 serving',
        instructions: 'Enjoy as a healthy snack'
      });
    }

    return snacks.length > 0 ? snacks : [this.getDefaultMeal('Healthy Snack', '🍎')];
  }

  private extractIngredients(daySection: string, mealType: string): string[] {
    const ingredientsRegex = new RegExp(`\\*\\*${mealType}:\\*\\*[\\s\\S]*?- Ingredients:\\s*([^\\n]+)`, 'i');
    const match = daySection.match(ingredientsRegex);

    if (match) {
      return match[1].split(',').map(ing => ing.trim());
    }

    return ['Various healthy ingredients'];
  }

  private extractInstructions(daySection: string, mealType: string): string {
    const instructionsRegex = new RegExp(`\\*\\*${mealType}:\\*\\*[\\s\\S]*?- Instructions:\\s*([^\\n]+)`, 'i');
    const match = daySection.match(instructionsRegex);

    return match ? match[1].trim() : 'Prepare according to standard cooking methods';
  }

  private extractWaterIntake(daySection: string): string {
    const waterRegex = /\*\*Water Intake:\*\*\s*([^\n]+)/i;
    const match = daySection.match(waterRegex);
    return match ? match[1].trim() : '2-3 liters';
  }

  private extractDayNotes(daySection: string): string {
    const notesRegex = /\*\*Notes:\*\*\s*([^\n]+)/i;
    const match = daySection.match(notesRegex);
    return match ? match[1].trim() : 'Stay consistent with your nutrition goals';
  }

  private calculateDailyTotals(meals: {
    breakfast: DietMeal;
    lunch: DietMeal;
    dinner: DietMeal;
    snacks: DietMeal[];
  }): { calories: number; protein: number; carbs: number; fats: number } {
    let calories = meals.breakfast.calories + meals.lunch.calories + meals.dinner.calories;
    let protein = meals.breakfast.protein + meals.lunch.protein + meals.dinner.protein;
    let carbs = meals.breakfast.carbs + meals.lunch.carbs + meals.dinner.carbs;
    let fats = meals.breakfast.fats + meals.lunch.fats + meals.dinner.fats;

    meals.snacks.forEach(snack => {
      calories += snack.calories;
      protein += snack.protein;
      carbs += snack.carbs;
      fats += snack.fats;
    });

    return { calories, protein, carbs, fats };
  }

  private getDefaultMeal(name: string, emoji: string): DietMeal {
    return {
      name,
      emoji,
      ingredients: ['Healthy ingredients'],
      calories: 300,
      protein: 20,
      carbs: 30,
      fats: 10,
      preparationTime: '15 min',
      servingSize: '1 serving',
      instructions: 'Prepare with fresh, wholesome ingredients according to standard cooking methods'
    };
  }

  private getMealEmoji(mealName: string): string {
    const name = mealName.toLowerCase();
    if (name.includes('egg') || name.includes('omelette')) return '🍳';
    if (name.includes('salad')) return '🥗';
    if (name.includes('rice')) return '🍚';
    if (name.includes('chicken')) return '🍗';
    if (name.includes('fish')) return '🐟';
    if (name.includes('soup')) return '🍲';
    if (name.includes('smoothie')) return '🥤';
    if (name.includes('fruit')) return '🍎';
    if (name.includes('nuts')) return '🥜';
    if (name.includes('yogurt')) return '🥛';
    if (name.includes('bread') || name.includes('toast')) return '🍞';
    if (name.includes('pasta')) return '🍝';
    if (name.includes('curry')) return '🍛';
    return '🍽️'; // Default meal emoji
  }
}

export default new AIDietService();
