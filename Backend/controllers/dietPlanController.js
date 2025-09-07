const DietPlan = require('../models/DietPlan');
const User = require('../models/User');

// Create a new diet plan
const createDietPlan = async (req, res) => {
  try {
    console.log('📝 Creating diet plan for user:', req.user.id);
    console.log('📦 Diet plan data received:', JSON.stringify(req.body, null, 2));

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
    for (const day of weeklyPlan) {
      if (!day.meals || !day.meals.breakfast || !day.meals.lunch || !day.meals.dinner) {
        return res.status(400).json({
          success: false,
          message: 'Each day must have breakfast, lunch, and dinner meals'
        });
      }
    }

    // Deactivate existing diet plans for this user
    await DietPlan.deactivateUserPlans(req.user.id);
    console.log('🔄 Deactivated existing diet plans for user');

    // Create new diet plan
    const dietPlan = new DietPlan({
      userId: req.user.id,
      goal,
      duration,
      country,
      keyNotes: keyNotes || [],
      weeklyPlan,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalWeeks: totalWeeks || 12,
      targetCalories: targetCalories || 2000,
      targetProtein: targetProtein || 100,
      targetCarbs: targetCarbs || 250,
      targetFats: targetFats || 67,
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
    console.log('📖 Fetching diet plan for user:', req.user.id);

    const dietPlan = await DietPlan.findActiveByUserId(req.user.id);

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

    const dietPlan = await DietPlan.findOne({
      _id: dietPlanId,
      userId: req.user.id,
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

    const dietPlan = await DietPlan.findOne({
      _id: dietPlanId,
      userId: req.user.id
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
    const { mealId, day, week, mealType } = req.body;
    console.log('🍽️ Marking meal completed:', { mealId, day, week, mealType });

    // For now, we'll just return success since we're storing completion state locally
    // In a full implementation, you might want to store completion stats in the database

    res.json({
      success: true,
      message: 'Meal marked as completed',
      data: {
        mealId,
        day,
        week,
        mealType,
        completedAt: new Date().toISOString()
      }
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
    const { day, week } = req.body;
    console.log('📅 Marking day completed:', { day, week });

    // For now, we'll just return success since we're storing completion state locally
    // In a full implementation, you might want to store completion stats in the database

    res.json({
      success: true,
      message: 'Day marked as completed',
      data: {
        day,
        week,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error marking day completed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while marking day completed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Log water intake
const logWaterIntake = async (req, res) => {
  try {
    const { day, week, amount } = req.body;
    console.log('💧 Logging water intake:', { day, week, amount });

    // For now, we'll just return success since we're storing water intake locally
    // In a full implementation, you might want to store water intake in the database

    res.json({
      success: true,
      message: 'Water intake logged',
      data: {
        day,
        week,
        amount,
        loggedAt: new Date().toISOString()
      }
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
    console.log('📊 Fetching diet stats for user:', req.user.id);

    const dietPlan = await DietPlan.findActiveByUserId(req.user.id);

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
    console.log('📚 Fetching all diet plans for user:', req.user.id);

    const dietPlans = await DietPlan.find({ userId: req.user.id })
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
