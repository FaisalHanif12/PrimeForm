const DietPlan = require('../models/DietPlan');
const User = require('../models/User');

// Create a new diet plan
const createDietPlan = async (req, res) => {
  try {
    // Ensure we have a valid user object
    if (!req.user) {
      console.log('❌ createDietPlan - No user object found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Extract userId - MongoDB uses _id, but we need to handle both cases
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    console.log('🔍 createDietPlan - User ID:', userId);
    console.log('🔍 createDietPlan - User object keys:', Object.keys(req.user));
    console.log('🔍 createDietPlan - User _id:', req.user._id);
    console.log('🔍 createDietPlan - User id:', req.user.id);
    console.log('📦 Diet plan data received:', JSON.stringify(req.body, null, 2));

    // Validate that we have a userId
    if (!userId) {
      console.log('❌ createDietPlan - No valid user ID found');
      return res.status(400).json({
        success: false,
        message: 'Invalid user authentication'
      });
    }

    const {
      goal,
      duration,
      country,
      keyNotes,
      weeklyPlan,
      startDate,
      endDate,
      totalWeeks,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats
    } = req.body;

    // Validate required fields
    if (!goal || !duration || !country || !weeklyPlan || !Array.isArray(weeklyPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: goal, duration, country, weeklyPlan'
      });
    }

    // Validate weeklyPlan structure
    if (weeklyPlan.length === 0 || weeklyPlan.length > 7) {
      return res.status(400).json({
        success: false,
        message: 'WeeklyPlan must contain 1-7 days'
      });
    }

    // Validate each day in weeklyPlan
    for (let i = 0; i < weeklyPlan.length; i++) {
      const day = weeklyPlan[i];
      if (!day.meals || !day.meals.breakfast || !day.meals.lunch || !day.meals.dinner) {
        console.log(`❌ Day ${i + 1} meal validation failed:`, {
          hasMeals: !!day.meals,
          hasBreakfast: !!(day.meals && day.meals.breakfast),
          hasLunch: !!(day.meals && day.meals.lunch),
          hasDinner: !!(day.meals && day.meals.dinner)
        });
        return res.status(400).json({
          success: false,
          message: `Day ${i + 1} must have breakfast, lunch, and dinner meals`
        });
      }
      
      // Ensure each meal has required properties
      const meals = [day.meals.breakfast, day.meals.lunch, day.meals.dinner];
      if (day.meals.snacks && Array.isArray(day.meals.snacks)) {
        meals.push(...day.meals.snacks);
      }
      
      for (let j = 0; j < meals.length; j++) {
        const meal = meals[j];
        if (!meal.name || meal.calories === undefined || meal.protein === undefined || meal.carbs === undefined || meal.fats === undefined) {
          console.log(`❌ Meal validation failed for day ${i + 1}, meal ${j + 1}:`, meal);
          return res.status(400).json({
            success: false,
            message: `Day ${i + 1} has incomplete meal data - missing required nutritional information`
          });
        }
        
        // Ensure numeric values are properly formatted
        meal.calories = Number(meal.calories) || 0;
        meal.protein = Number(meal.protein) || 0;
        meal.carbs = Number(meal.carbs) || 0;
        meal.fats = Number(meal.fats) || 0;
        
        // Ensure meal has instructions (add default if missing)
        if (!meal.instructions) {
          meal.instructions = 'Prepare according to standard cooking methods';
        }
        
        // Ensure meal has ingredients (add default if missing)
        if (!meal.ingredients || !Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
          meal.ingredients = ['Healthy ingredients'];
        }
      }
      
      // Ensure day-level numeric values are properly formatted
      day.totalCalories = Number(day.totalCalories) || 0;
      day.totalProtein = Number(day.totalProtein) || 0;
      day.totalCarbs = Number(day.totalCarbs) || 0;
      day.totalFats = Number(day.totalFats) || 0;
      day.day = Number(day.day) || (i + 1);
      
      // Ensure required day fields
      if (!day.dayName) day.dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i];
      if (!day.date) day.date = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (!day.waterIntake) day.waterIntake = '2-3 liters';
      if (!day.notes) day.notes = '';
    }

    // Deactivate existing diet plans for this user
    await DietPlan.deactivateUserPlans(userId);
    console.log('🔄 Deactivated existing diet plans for user');

    // Create new diet plan with validated numeric fields
    const dietPlan = new DietPlan({
      userId: userId,
      goal,
      duration,
      country,
      keyNotes: keyNotes || [],
      weeklyPlan,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalWeeks: Number(totalWeeks) || 12,
      targetCalories: Number(targetCalories) || 2000,
      targetProtein: Number(targetProtein) || 100,
      targetCarbs: Number(targetCarbs) || 250,
      targetFats: Number(targetFats) || 67,
      isActive: true
    });

    const savedDietPlan = await dietPlan.save();
    console.log('✅ Diet plan created successfully:', savedDietPlan._id);

    res.status(201).json({
      success: true,
      message: 'Diet plan created successfully',
      data: savedDietPlan
    });

  } catch (error) {
    console.error('❌ Error creating diet plan:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating diet plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's active diet plan
const getUserDietPlan = async (req, res) => {
  try {
    // Extract userId - MongoDB uses _id, but we need to handle both cases
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    console.log('📖 Fetching diet plan for user:', userId);
    console.log('🔍 getUserDietPlan - User object keys:', Object.keys(req.user));
    console.log('🔍 getUserDietPlan - User _id:', req.user._id);
    console.log('🔍 getUserDietPlan - User id:', req.user.id);

    const dietPlan = await DietPlan.getActiveDietPlan(userId);

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active diet plan found'
      });
    }

    console.log('✅ Diet plan found:', dietPlan._id);

    res.json({
      success: true,
      message: 'Diet plan retrieved successfully',
      data: dietPlan
    });

  } catch (error) {
    console.error('❌ Error fetching diet plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching diet plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update diet plan
const updateDietPlan = async (req, res) => {
  try {
    const dietPlanId = req.params.id;
    console.log('📝 Updating diet plan:', dietPlanId);

    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    const dietPlan = await DietPlan.findOne({
      _id: dietPlanId,
      userId: userId,
      isActive: true
    });

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found or access denied'
      });
    }

    // Update fields
    const allowedUpdates = [
      'goal', 'duration', 'country', 'keyNotes', 'weeklyPlan',
      'startDate', 'endDate', 'totalWeeks', 'targetCalories',
      'targetProtein', 'targetCarbs', 'targetFats'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        dietPlan[field] = req.body[field];
      }
    });

    const updatedDietPlan = await dietPlan.save();
    console.log('✅ Diet plan updated successfully:', updatedDietPlan._id);

    res.json({
      success: true,
      message: 'Diet plan updated successfully',
      data: updatedDietPlan
    });

  } catch (error) {
    console.error('❌ Error updating diet plan:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating diet plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete diet plan (deactivate)
const deleteDietPlan = async (req, res) => {
  try {
    const dietPlanId = req.params.id;
    console.log('🗑️ Deleting diet plan:', dietPlanId);

    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    const dietPlan = await DietPlan.findOne({
      _id: dietPlanId,
      userId: userId
    });

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found or access denied'
      });
    }

    dietPlan.isActive = false;
    await dietPlan.save();

    console.log('✅ Diet plan deactivated successfully');

    res.json({
      success: true,
      message: 'Diet plan deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting diet plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting diet plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark meal as completed
const markMealCompleted = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { mealId, day, week, mealType } = req.body;

    if (!mealId || !day || !week || !mealType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: mealId, day, week, mealType'
      });
    }

    const dietPlan = await DietPlan.getActiveDietPlan(userId);

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active diet plan found'
      });
    }

    await dietPlan.markMealCompleted(mealId, day, week, mealType);

    res.status(200).json({
      success: true,
      message: 'Meal marked as completed',
      data: dietPlan
    });

  } catch (error) {
    console.error('❌ Error marking meal completed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking meal completed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark day as completed
const markDayCompleted = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { day, week } = req.body;

    if (!day || !week) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: day, week'
      });
    }

    const dietPlan = await DietPlan.getActiveDietPlan(userId);

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active diet plan found'
      });
    }

    await dietPlan.markDayCompleted(day, week);

    res.status(200).json({
      success: true,
      message: 'Diet day marked as completed',
      data: dietPlan
    });

  } catch (error) {
    console.error('❌ Error marking diet day completed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking diet day completed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Log water intake
const logWaterIntake = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { day, week, amount } = req.body;

    if (!day || !week || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: day, week, amount'
      });
    }

    const dietPlan = await DietPlan.getActiveDietPlan(userId);

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active diet plan found'
      });
    }

    await dietPlan.logWaterIntake(day, week, amount);

    res.status(200).json({
      success: true,
      message: 'Water intake logged',
      data: dietPlan
    });

  } catch (error) {
    console.error('❌ Error logging water intake:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while logging water intake',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get diet stats
const getDietStats = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    console.log('📊 Fetching diet stats for user:', userId);

    const dietPlan = await DietPlan.getActiveDietPlan(userId);

    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active diet plan found'
      });
    }

    // Calculate basic stats
    const stats = {
      totalDays: dietPlan.weeklyPlan.length * dietPlan.totalWeeks,
      currentWeek: Math.ceil((new Date() - new Date(dietPlan.startDate)) / (7 * 24 * 60 * 60 * 1000)),
      averageCalories: dietPlan.weeklyPlan.reduce((sum, day) => sum + day.totalCalories, 0) / dietPlan.weeklyPlan.length,
      averageProtein: dietPlan.weeklyPlan.reduce((sum, day) => sum + day.totalProtein, 0) / dietPlan.weeklyPlan.length,
      targetCalories: dietPlan.targetCalories,
      targetProtein: dietPlan.targetProtein,
      startDate: dietPlan.startDate,
      endDate: dietPlan.endDate,
      duration: dietPlan.duration,
      goal: dietPlan.goal
    };

    console.log('✅ Diet stats calculated');

    res.json({
      success: true,
      message: 'Diet stats retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('❌ Error fetching diet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching diet stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all diet plans for user (including inactive)
const getAllUserDietPlans = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    console.log('📚 Fetching all diet plans for user:', userId);

    const dietPlans = await DietPlan.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(10); // Limit to last 10 plans

    console.log('✅ Found', dietPlans.length, 'diet plans');

    res.json({
      success: true,
      message: 'Diet plans retrieved successfully',
      data: dietPlans
    });

  } catch (error) {
    console.error('❌ Error fetching diet plans:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching diet plans',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createDietPlan,
  getUserDietPlan,
  updateDietPlan,
  deleteDietPlan,
  markMealCompleted,
  markDayCompleted,
  logWaterIntake,
  getDietStats,
  getAllUserDietPlans
};
