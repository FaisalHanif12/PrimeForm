const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');

// Create or update workout plan
const createWorkoutPlan = async (req, res) => {
  try {
    const { userId } = req.user;
    const workoutPlanData = req.body;

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
    const { userId } = req.user;

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
    const { userId } = req.user;
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
    const { userId } = req.user;
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
    const { userId } = req.user;
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
    const { userId } = req.user;
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
    const { userId } = req.user;

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
