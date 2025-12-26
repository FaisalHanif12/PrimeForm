const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// Create or update workout plan
const createWorkoutPlan = async (req, res) => {
  try {
    // Ensure we have a valid user object
    if (!req.user) {
      console.log('❌ createWorkoutPlan - No user object found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Extract userId - MongoDB uses _id, but we need to handle both cases
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const workoutPlanData = req.body;

    console.log('🔍 createWorkoutPlan - User ID:', userId);
    console.log('🔍 createWorkoutPlan - User object keys:', Object.keys(req.user));
    console.log('🔍 createWorkoutPlan - User _id:', req.user._id);
    console.log('🔍 createWorkoutPlan - User id:', req.user.id);

    // Validate that we have a userId
    if (!userId) {
      console.log('❌ createWorkoutPlan - No valid user ID found');
      return res.status(400).json({
        success: false,
        message: 'Invalid user authentication'
      });
    }

    // Validate required fields
    if (!workoutPlanData.goal || !workoutPlanData.duration || !workoutPlanData.weeklyPlan) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: goal, duration, weeklyPlan'
      });
    }

    // Deactivate old workout plans for this user
    await WorkoutPlan.deactivateOldPlans(userId);

    // Create new workout plan
    const workoutPlan = new WorkoutPlan({
      userId,
      ...workoutPlanData
    });

    await workoutPlan.save();

    // Create in-app notification for workout plan creation
    try {
      await notificationService.createWorkoutPlanNotification(userId, {
        planId: workoutPlan._id.toString(),
        goal: workoutPlan.goal,
        duration: workoutPlan.duration
      });
      console.log('✅ Workout plan notification created');
    } catch (notifError) {
      console.error('⚠️ Failed to create workout plan notification:', notifError);
      // Don't fail the request if notification creation fails
    }

    res.status(201).json({
      success: true,
      message: 'Workout plan created successfully',
      data: workoutPlan
    });

  } catch (error) {
    console.error('Error creating workout plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get active workout plan for user
const getActiveWorkoutPlan = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    const workoutPlan = await WorkoutPlan.getActiveWorkoutPlan(userId);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active workout plan found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workout plan retrieved successfully',
      data: workoutPlan
    });

  } catch (error) {
    console.error('Error getting workout plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all workout plans for user
const getUserWorkoutPlans = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const workoutPlans = await WorkoutPlan.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await WorkoutPlan.countDocuments({ userId });

    res.status(200).json({
      success: true,
      message: 'Workout plans retrieved successfully',
      data: {
        workoutPlans,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error getting workout plans:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Mark exercise as completed
const markExerciseCompleted = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { exerciseId, day, week } = req.body;

    if (!exerciseId || !day || !week) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: exerciseId, day, week'
      });
    }

    const workoutPlan = await WorkoutPlan.getActiveWorkoutPlan(userId);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active workout plan found'
      });
    }

    await workoutPlan.markExerciseCompleted(exerciseId, day, week);

    res.status(200).json({
      success: true,
      message: 'Exercise marked as completed',
      data: workoutPlan
    });

  } catch (error) {
    console.error('Error marking exercise completed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
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

    const workoutPlan = await WorkoutPlan.getActiveWorkoutPlan(userId);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active workout plan found'
      });
    }

    await workoutPlan.markDayCompleted(day, week);

    res.status(200).json({
      success: true,
      message: 'Day marked as completed',
      data: workoutPlan
    });

  } catch (error) {
    console.error('Error marking day completed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete workout plan
const deleteWorkoutPlan = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { planId } = req.params;

    const workoutPlan = await WorkoutPlan.findOneAndDelete({
      _id: planId,
      userId
    });

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Workout plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting workout plan:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get workout plan statistics
const getWorkoutStats = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;

    const workoutPlan = await WorkoutPlan.getActiveWorkoutPlan(userId);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active workout plan found'
      });
    }

    const stats = {
      totalDays: workoutPlan.weeklyPlan.length,
      completedDays: workoutPlan.completedDays.length,
      totalExercises: workoutPlan.weeklyPlan.reduce((total, day) => total + day.exercises.length, 0),
      completedExercises: workoutPlan.completedExercises.length,
      progress: workoutPlan.progress,
      startDate: workoutPlan.startDate,
      endDate: workoutPlan.endDate,
      duration: workoutPlan.duration
    };

    res.status(200).json({
      success: true,
      message: 'Workout statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error getting workout stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createWorkoutPlan,
  getActiveWorkoutPlan,
  getUserWorkoutPlans,
  markExerciseCompleted,
  markDayCompleted,
  deleteWorkoutPlan,
  getWorkoutStats
};



