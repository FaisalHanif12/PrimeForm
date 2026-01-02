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

    // Check if user has a completed active plan
    const existingPlan = await WorkoutPlan.getActiveWorkoutPlan(userId);
    if (existingPlan) {
      // Calculate progress based on weeks completed
      const today = new Date();
      const startDate = new Date(existingPlan.startDate);
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const startDayOfWeek = startDate.getDay();
      const currentDayOfWeek = today.getDay();
      
      let currentWeek = 1;
      if (daysDiff < 0) {
        currentWeek = 1;
      } else if (daysDiff === 0) {
        currentWeek = 1;
      } else {
        const daysInFirstWeek = startDayOfWeek === 0 ? 1 : (7 - startDayOfWeek);
        if (daysDiff <= daysInFirstWeek) {
          currentWeek = 1;
        } else {
          const firstSundayDate = new Date(startDate);
          const daysToFirstSunday = startDayOfWeek === 0 ? 0 : (7 - startDayOfWeek);
          firstSundayDate.setDate(startDate.getDate() + daysToFirstSunday);
          const firstMondayDate = new Date(firstSundayDate);
          firstMondayDate.setDate(firstSundayDate.getDate() + 1);
          const daysFromFirstMonday = Math.floor((today.getTime() - firstMondayDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysFromFirstMonday < 0) {
            currentWeek = 1;
          } else {
            currentWeek = 2 + Math.floor(daysFromFirstMonday / 7);
          }
        }
      }
      
      const totalWeeks = existingPlan.totalWeeks || 12;
      const completedWeeks = Math.max(0, currentWeek - 1);
      const progress = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;
      
      // If plan is completed (100%), prevent creating new plan
      if (progress >= 100) {
        return res.status(400).json({
          success: false,
          message: 'Only premium users can create new plans. Please upgrade to premium to create additional plans.'
        });
      }
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

// Proxy OpenRouter API call for workout plan generation
const generateWorkoutPlan = async (req, res) => {
  const { prompt } = req.body;

  // Input validation
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is required and must be a non-empty string'
    });
  }

  // Workout plan prompts can be long (includes full user profile details)
  // OpenRouter supports up to 1M tokens, so we allow up to 50000 characters to match original behavior
  if (prompt.length > 50000) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is too long (max 50000 characters)'
    });
  }

  // Get OpenRouter config from backend env (SECURE - not exposed to frontend)
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || 'https://primeform.app';
  const OPENROUTER_SITE_NAME = process.env.OPENROUTER_SITE_NAME || 'PrimeForm';

  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY is missing from backend environment variables');
    return res.status(500).json({
      success: false,
      message: 'AI service is temporarily unavailable. Please try again later.'
    });
  }

  let timeoutId;
  try {
    // Create timeout controller (60 seconds max for workout plan generation)
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 60000);

    // Forward request to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': OPENROUTER_SITE_URL,
        'X-Title': OPENROUTER_SITE_NAME,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        stream: false,
        top_p: 0.8,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200) // Limit error log length
      });
      
      return res.status(response.status).json({
        success: false,
        message: `AI service error: ${response.statusText}`
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return res.status(500).json({
        success: false,
        message: 'Invalid response format from AI'
      });
    }

    // Return response in same format frontend expects
    res.status(200).json({
      success: true,
      data: {
        content: aiResponse
      },
      message: 'Workout plan generated successfully'
    });

  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('❌ OpenRouter API timeout');
      return res.status(504).json({
        success: false,
        message: 'AI service timeout. Please try again.'
      });
    }

    console.error('❌ Error proxying OpenRouter API:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to communicate with AI service. Please try again later.'
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
  getWorkoutStats,
  generateWorkoutPlan
};



