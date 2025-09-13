import { UserProfile } from './userProfileService';
import dietPlanService from './dietPlanService';
import Storage from '../utils/storage';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://primeform.app';
const SITE_NAME = process.env.EXPO_PUBLIC_SITE_NAME || 'PrimeForm';

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
}

export interface AIDietResponse {
  success: boolean;
  data: DietPlan | null;
  message: string;
}

class AIDietService {
  private generatePrompt(userProfile: UserProfile): string {
    const prompt = `
You are a world-renowned nutritionist and certified dietitian with 20+ years of experience in creating EXTREMELY PERSONALIZED nutrition plans.  
Create a HIGHLY SPECIFIC and STRICTLY PERSONALIZED **7-day diet plan** based on this EXACT user profile:

### CRITICAL USER ANALYSIS
- Age: ${userProfile.age} years (${userProfile.age < 25 ? 'Young adult - higher metabolism, can handle more carbs' : userProfile.age < 40 ? 'Adult - balanced metabolism, moderate portions' : userProfile.age < 55 ? 'Middle-aged - slower metabolism, portion control important' : 'Mature - focus on nutrient density, smaller portions'})
- Gender: ${userProfile.gender} (${userProfile.gender === 'Male' ? 'Higher caloric needs, more protein required' : 'Moderate caloric needs, focus on iron and calcium'})
- Height: ${userProfile.height} cm | Weight: ${userProfile.currentWeight} kg → ${userProfile.targetWeight || userProfile.currentWeight} kg
- BMI: ${(Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)).toFixed(1)} (${(Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 18.5 ? 'UNDERWEIGHT - INCREASE CALORIES, FOCUS ON HEALTHY WEIGHT GAIN' : (Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 25 ? 'NORMAL - MAINTAIN WITH BALANCED NUTRITION' : (Number(userProfile.currentWeight) / Math.pow(Number(userProfile.height) / 100, 2)) < 30 ? 'OVERWEIGHT - CREATE CALORIC DEFICIT, HIGH PROTEIN' : 'OBESE - SIGNIFICANT CALORIC DEFICIT, MEDICAL SUPERVISION'})
- PRIMARY GOAL: ${userProfile.bodyGoal} (THIS IS THE #1 PRIORITY - EVERY MEAL MUST SUPPORT THIS GOAL)
- Diet Preference: ${userProfile.dietPreference || 'No specific preference'} (STRICTLY FOLLOW - NO EXCEPTIONS)
- Country: ${userProfile.country || 'Not specified'} (USE ONLY LOCAL CUISINES AND AVAILABLE INGREDIENTS)
- Medical Conditions: ${userProfile.medicalConditions || 'None'} (${userProfile.medicalConditions ? 'CRITICAL - MODIFY ALL MEALS FOR MEDICAL SAFETY' : 'NO DIETARY RESTRICTIONS'})
- Calculated Daily Calories: ${userProfile.gender === 'Male' ? Math.round(88.362 + (13.397 * Number(userProfile.currentWeight)) + (4.799 * Number(userProfile.height)) - (5.677 * userProfile.age)) * 1.4 : Math.round(447.593 + (9.247 * Number(userProfile.currentWeight)) + (3.098 * Number(userProfile.height)) - (4.330 * userProfile.age)) * 1.4} kcal (Harris-Benedict equation with activity factor)

### STRICT PERSONALIZATION RULES
1. **DIET PREFERENCE COMPLIANCE** (ABSOLUTE REQUIREMENT):
   - **Vegetarian**: ABSOLUTELY NO meat, fish, or poultry - ONLY plant-based proteins
   - **Vegan**: ZERO animal products - no dairy, eggs, honey, or any animal derivatives
   - **Non-Vegetarian**: Include variety of proteins including meat, fish, poultry
   - **Pescatarian**: Fish and seafood ONLY - NO meat or poultry
   - **Flexitarian**: Primarily plant-based with occasional meat/fish
   - NEVER suggest foods that violate the user's dietary preference!

2. **GOAL ALIGNMENT** (CRITICAL):
   - **Muscle Gain**: Higher protein (1.8-2.2g/kg body weight), caloric surplus of 300-500 kcal
   - **Fat Loss**: Caloric deficit of 500-750 kcal, high protein (1.6-2.0g/kg) to preserve muscle
   - **Maintain Weight**: Maintenance calories, balanced macros (40% carbs, 30% protein, 30% fats)
   - **General Training**: Well-rounded nutrition supporting active lifestyle
   - Every meal must directly support the user's specific goal!

3. **COUNTRY-SPECIFIC CUISINE** (MANDATORY): 
   - Use ONLY traditional foods and cooking methods from ${userProfile.country || 'the user\'s region'}
   - Include ONLY locally available ingredients and seasonal produce
   - Respect cultural dietary customs and meal timing preferences
   - Feature authentic regional dishes and cooking techniques
   - NEVER suggest foods not commonly available in the user's country!

4. **MEDICAL SAFETY** (NON-NEGOTIABLE):
   - ${userProfile.medicalConditions ? `CRITICAL MODIFICATIONS REQUIRED for: ${userProfile.medicalConditions}` : 'No medical restrictions - full dietary freedom'}
   - Account for any medical conditions with appropriate food modifications
   - Ensure nutritional safety and balance for this specific user

5. **CALORIC PRECISION**:
   - Target: ${userProfile.gender === 'Male' ? Math.round(88.362 + (13.397 * Number(userProfile.currentWeight)) + (4.799 * Number(userProfile.height)) - (5.677 * userProfile.age)) * 1.4 : Math.round(447.593 + (9.247 * Number(userProfile.currentWeight)) + (3.098 * Number(userProfile.height)) - (4.330 * userProfile.age)) * 1.4} kcal/day
   - Adjust based on goal: ${userProfile.bodyGoal.includes('Gain') ? '+300-500 kcal surplus' : userProfile.bodyGoal.includes('Loss') || userProfile.bodyGoal.includes('Fat') ? '-500-750 kcal deficit' : 'maintenance level'}

### MANDATORY STRUCTURE REQUIREMENTS
1. **Duration Analysis**: 
   - If goal = **Muscle Gain** → Recommend **3–6-9 months** duration (depending on target weight difference)
   - If goal = **Fat Loss/Lose Fat** → Recommend **3–6-9 months** duration  
   - If goal = **Maintain Weight/General Training** → Recommend **6–12 months** for lifestyle maintenance
   - Clearly show the chosen duration in the output

5. **7-Day Plan Structure**:
   - Each day must include: Breakfast, Lunch, Dinner, 2-3 Snacks
   - Provide exact calories, protein, carbs, fats for each meal
   - Include preparation time and serving size
   - Add brief cooking instructions for complex dishes
   - Suggest daily water intake
   - Include helpful notes and tips

6. **Medical Considerations**:
   - Account for any medical conditions mentioned
   - Ensure nutritional safety and balance
   - Provide modifications if needed

7. **Practical Guidelines**:
   - Use easily available ingredients
   - Provide meal prep tips where applicable
   - Include portion control guidance
   - Suggest healthy alternatives and substitutions

8. **Output Format** (must follow exactly):

**Goal:** [goal]  
**Duration:** [calculated duration]  
**Target Daily Calories:** [calculated calories]
**Country Cuisine:** [country-specific focus]

---

#### 🍽️ Week 1 — Daily Meal Plan  

**Day 1: [Day Name] 🌅**  
**Breakfast:** [Meal Name] – [Calories] kcal | Protein: [X]g | Carbs: [X]g | Fats: [X]g – Prep: [X] min  
- Ingredients: [list ingredients]
- Instructions: [brief cooking method]

**Lunch:** [Meal Name] – [Calories] kcal | Protein: [X]g | Carbs: [X]g | Fats: [X]g – Prep: [X] min  
- Ingredients: [list ingredients]
- Instructions: [brief cooking method]

**Dinner:** [Meal Name] – [Calories] kcal | Protein: [X]g | Carbs: [X]g | Fats: [X]g – Prep: [X] min  
- Ingredients: [list ingredients]
- Instructions: [brief cooking method]

**Snacks:**
- Snack 1: [Name] – [Calories] kcal | [macros]
- Snack 2: [Name] – [Calories] kcal | [macros]

**Daily Totals:** [Total Calories] kcal | Protein: [X]g | Carbs: [X]g | Fats: [X]g  
**Water Intake:** [X] liters  
**Notes:** [helpful tips for the day]

---

**Day 2: [Day Name] 🌤️**  
[Same format as Day 1]

---

Continue for all 7 days with varied, culturally appropriate, and goal-specific meals.

### Important Guidelines:
- Make meals **delicious and culturally authentic**
- Ensure **nutritional balance** throughout the week
- Provide **realistic preparation times**
- Include **seasonal and local ingredients**
- Add **practical cooking tips**
- Ensure **dietary preference compliance**
- Calculate **accurate nutritional values**

Generate the **complete personalized 7-day diet plan now.**
    `;

    return prompt;
  }

  async generateDietPlan(userProfile: UserProfile): Promise<AIDietResponse> {
    try {
      console.log('🍽️ Generating AI diet plan for user:', userProfile);
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

      // Make API call without timeout - let it take as long as needed for better UX
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
          temperature: 0.3, // Optimal for Gemini
          max_tokens: 3000, // More tokens for detailed diet plans
          stream: false,
          top_p: 0.9,
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
      const dietPlan = this.parseAIResponse(aiResponse, userProfile);

      // Store the response in database for persistence with retry logic
      console.log('💾 Attempting to save diet plan to database...');
      let saveResponse;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          saveResponse = await dietPlanService.createDietPlan(dietPlan);
          if (saveResponse.success) {
            console.log('✅ Diet plan saved to database successfully');

            // Also cache locally as backup
            await Storage.setItem('cached_diet_plan', JSON.stringify(dietPlan));
            console.log('💾 Diet plan cached locally as backup');
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
            await Storage.setItem('cached_diet_plan', JSON.stringify(dietPlan));
            console.log('💾 Diet plan cached locally as fallback');
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
      console.error('❌ Error generating diet plan:', error);
      throw error;
    }
  }


  // Load diet plan from database
  async loadDietPlanFromDatabase(): Promise<DietPlan | null> {
    try {
      const response = await dietPlanService.getActiveDietPlan();
      if (response.success && response.data) {
        console.log('📱 Loading diet plan from database');
        return response.data;
      }
    } catch (error) {
      console.warn('⚠️ Could not load diet plan from database:', error);

      // Try to load from local cache as fallback
      try {
        const cachedPlan = await Storage.getItem('cached_diet_plan');
        if (cachedPlan) {
          console.log('📱 Loading diet plan from local cache');
          return JSON.parse(cachedPlan);
        }
      } catch (cacheError) {
        console.warn('⚠️ Could not load from cache either:', cacheError);
      }
    }
    return null;
  }

  // Clear diet plan from database
  async clearDietPlanFromDatabase(): Promise<void> {
    try {
      await dietPlanService.clearAllDietPlans();
      console.log('🗑️ Diet plans cleared from database');

      // Also clear local cache
      await Storage.removeItem('cached_diet_plan');
      console.log('🗑️ Local diet plan cache cleared');
    } catch (error) {
      console.warn('⚠️ Could not clear diet plans from database:', error);
    }
  }

  private parseAIResponse(aiResponse: string, userProfile: UserProfile): DietPlan {
    // Extract goal and duration from the AI response
    const goalMatch = aiResponse.match(/\*\*Goal:\*\*\s*(.+?)(?:\n|$)/i);
    const durationMatch = aiResponse.match(/\*\*Duration:\*\*\s*(.+?)(?:\n|$)/i);
    const caloriesMatch = aiResponse.match(/\*\*Target Daily Calories:\*\*\s*(\d+)/i);
    const countryMatch = aiResponse.match(/\*\*Country Cuisine:\*\*\s*(.+?)(?:\n|$)/i);

    const goal = goalMatch ? goalMatch[1].trim() : userProfile.bodyGoal || 'General Health';
    const duration = durationMatch ? durationMatch[1].trim() : '12 weeks';
    const targetCalories = caloriesMatch ? parseInt(caloriesMatch[1]) : 2000;
    const country = countryMatch ? countryMatch[1].trim() : userProfile.country || 'International';

    // Parse the AI response to extract diet days
    const weeklyPlan: DietDay[] = this.parseAIDietDays(aiResponse);

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

    // The backend expects a 7-day weekly pattern, similar to workout plan
    endDate.setDate(startDate.getDate() + (totalWeeks * 7));

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
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalWeeks: totalWeeks,
      targetCalories: targetCalories,
      targetProtein: Math.round(targetCalories * 0.2 / 4), // 20% protein
      targetCarbs: Math.round(targetCalories * 0.5 / 4), // 50% carbs
      targetFats: Math.round(targetCalories * 0.3 / 9), // 30% fats
    };
  }

  private parseAIDietDays(aiResponse: string): DietDay[] {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklyPlan: DietDay[] = [];

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
        const meals = this.parseAIMeals(daySection);
        const dailyTotals = this.calculateDailyTotals(meals);
        const waterIntake = this.extractWaterIntake(daySection);
        const notes = this.extractDayNotes(daySection);
        
        weeklyPlan.push({
          day: i + 1,
          dayName: days[i],
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
          dayName: days[i],
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
    const breakfast = this.parseMealSection(daySection, 'breakfast') || this.getDefaultMeal('Breakfast', '🍳');
    const lunch = this.parseMealSection(daySection, 'lunch') || this.getDefaultMeal('Lunch', '🥗');
    const dinner = this.parseMealSection(daySection, 'dinner') || this.getDefaultMeal('Dinner', '🍽️');
    const snacks = this.parseSnacksSection(daySection);

    return { breakfast, lunch, dinner, snacks };
  }

  private parseMealSection(daySection: string, mealType: string): DietMeal | null {
    const mealRegex = new RegExp(`\\*\\*${mealType}:\\*\\*\\s*(.+?)\\s*–\\s*(\\d+)\\s*kcal.*?Protein:\\s*(\\d+)g.*?Carbs:\\s*(\\d+)g.*?Fats:\\s*(\\d+)g.*?Prep:\\s*([^\\n]+)`, 'i');
    const match = daySection.match(mealRegex);
    
    if (match) {
      const [, name, calories, protein, carbs, fats, prepTime] = match;
      const ingredients = this.extractIngredients(daySection, mealType);
      const instructions = this.extractInstructions(daySection, mealType);
      
      return {
        name: name.trim(),
        emoji: this.getMealEmoji(name.trim()),
        ingredients: ingredients,
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fats: parseInt(fats) || 0,
        preparationTime: prepTime.trim(),
        servingSize: '1 serving',
        instructions: instructions
      };
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
        servingSize: '1 serving'
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
      instructions: 'Prepare with fresh, wholesome ingredients'
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
