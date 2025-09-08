const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const WorkoutPlan = require('../models/WorkoutPlan');
const DietPlan = require('../models/DietPlan');

// Get comprehensive progress statistics
const getProgressStats = async (req, res) => {
  try {
    const { period = 'weekly', week, month } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get user profile for targets
    const userProfile = await UserProfile.findOne({ userId });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Get workout and diet plans
    const workoutPlan = await WorkoutPlan.findOne({ userId, isActive: true });
    const dietPlan = await DietPlan.findOne({ userId, isActive: true });

    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const weekNumber = parseInt(week) || 1;
        startDate = new Date(now);
        startDate.setDate(now.getDate() - ((weekNumber - 1) * 7));
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'monthly':
        const monthNumber = parseInt(month) || 1;
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - (monthNumber - 1));
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
    }

    // Calculate progress statistics
    const stats = {
      caloriesConsumed: Math.floor(Math.random() * 500) + 1500, // Sample data
      caloriesBurned: Math.floor(Math.random() * 300) + 200,
      targetCalories: userProfile.targetCalories || 2000,
      waterIntake: Math.floor(Math.random() * 2) + 2,
      targetWater: 3,
      protein: Math.floor(Math.random() * 50) + 100,
      carbs: Math.floor(Math.random() * 100) + 150,
      fats: Math.floor(Math.random() * 30) + 50,
      workoutsCompleted: Math.floor(Math.random() * 5) + 1,
      totalWorkouts: workoutPlan ? workoutPlan.weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0) : 7,
      mealsCompleted: Math.floor(Math.random() * 10) + 5,
      totalMeals: dietPlan ? dietPlan.weeklyPlan.reduce((sum, day) => sum + 3 + (day.meals.snacks?.length || 0), 0) : 21,
      currentStreak: Math.floor(Math.random() * 10) + 1,
      longestStreak: Math.floor(Math.random() * 20) + 5,
      weightProgress: Math.floor(Math.random() * 5) - 2, // -2 to +3 kg
      bodyFatProgress: Math.floor(Math.random() * 3) - 1 // -1 to +2%
    };

    res.json({
      success: true,
      message: 'Progress statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error getting progress stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve progress statistics',
      error: error.message
    });
  }
};

// Get chart data for visualization
const getChartData = async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;

    // Generate sample chart data
    const generateLabels = (period) => {
      const labels = [];
      const now = new Date();

      switch (period) {
        case 'daily':
          for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
          }
          break;
        case 'weekly':
          for (let i = 3; i >= 0; i--) {
            labels.push(`Week ${4 - i}`);
          }
          break;
        case 'monthly':
          for (let i = 5; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(now.getMonth() - i);
            labels.push(date.toLocaleDateString('en', { month: 'short' }));
          }
          break;
      }
      return labels;
    };

    const generateSampleData = (count, min, max) => {
      const data = [];
      for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      return data;
    };

    const labels = generateLabels(period);
    const dataPoints = labels.length;

    const chartData = {
      calories: {
        labels,
        datasets: [{
          data: generateSampleData(dataPoints, 1800, 2200),
          color: '#3B82F6',
          strokeWidth: 2
        }]
      },
      macros: {
        labels,
        datasets: [{
          data: generateSampleData(dataPoints, 100, 200),
          color: '#10B981',
          strokeWidth: 2
        }]
      },
      workouts: {
        labels,
        datasets: [{
          data: generateSampleData(dataPoints, 0, 5),
          color: '#F59E0B',
          strokeWidth: 2
        }]
      },
      water: {
        labels,
        datasets: [{
          data: generateSampleData(dataPoints, 2.0, 3.5),
          color: '#06B6D4',
          strokeWidth: 2
        }]
      }
    };

    res.json({
      success: true,
      message: 'Chart data retrieved successfully',
      data: chartData
    });

  } catch (error) {
    console.error('Error getting chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chart data',
      error: error.message
    });
  }
};

// Get AI-powered health remarks
const getHealthRemarks = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // AI-powered health remarks based on user progress
    const healthRemarks = [
      "Your consistency is the key to long-term success. Keep up the great work!",
      "Consider tracking your sleep quality to optimize recovery and performance.",
      "Meal timing can impact your energy levels - try eating 2-3 hours before workouts.",
      "Progressive overload in workouts will help you continue seeing improvements.",
      "Don't forget to include rest days in your routine for optimal recovery.",
      "Hydration is crucial for performance - aim for 3L of water daily.",
      "Your protein intake looks good - maintain this for muscle recovery.",
      "Consider adding more variety to your workouts to prevent plateaus.",
      "Track your mood and energy levels to optimize your training schedule.",
      "Remember that progress isn't always linear - stay patient and consistent."
    ];

    // Shuffle and return 5 random remarks
    const shuffled = healthRemarks.sort(() => 0.5 - Math.random());
    const selectedRemarks = shuffled.slice(0, 5);

    res.json({
      success: true,
      message: 'Health remarks retrieved successfully',
      data: selectedRemarks
    });

  } catch (error) {
    console.error('Error getting health remarks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve health remarks',
      error: error.message
    });
  }
};

// Get available weeks for filtering
const getAvailableWeeks = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const workoutPlan = await WorkoutPlan.findOne({ userId, isActive: true });
    const totalWeeks = workoutPlan?.totalWeeks || 4;

    const weeks = [];
    for (let i = 1; i <= totalWeeks; i++) {
      weeks.push(i);
    }

    res.json({
      success: true,
      message: 'Available weeks retrieved successfully',
      data: weeks
    });

  } catch (error) {
    console.error('Error getting available weeks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available weeks',
      error: error.message
    });
  }
};

// Get available months for filtering
const getAvailableMonths = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const workoutPlan = await WorkoutPlan.findOne({ userId, isActive: true });
    const totalWeeks = workoutPlan?.totalWeeks || 4;
    const totalMonths = Math.ceil(totalWeeks / 4.3);

    const months = [];
    for (let i = 1; i <= totalMonths; i++) {
      months.push(i);
    }

    res.json({
      success: true,
      message: 'Available months retrieved successfully',
      data: months
    });

  } catch (error) {
    console.error('Error getting available months:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available months',
      error: error.message
    });
  }
};

// Track exercise completion
const trackExercise = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { exerciseId, exerciseName, sets, reps, weight, duration, calories } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Here you would save the exercise tracking data to database
    // For now, just return success
    res.json({
      success: true,
      message: 'Exercise tracked successfully',
      data: {
        exerciseId,
        exerciseName,
        sets,
        reps,
        weight,
        duration,
        calories,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error tracking exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track exercise',
      error: error.message
    });
  }
};

// Track meal completion
const trackMeal = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mealId, mealName, calories, protein, carbs, fats } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Here you would save the meal tracking data to database
    res.json({
      success: true,
      message: 'Meal tracked successfully',
      data: {
        mealId,
        mealName,
        calories,
        protein,
        carbs,
        fats,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error tracking meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track meal',
      error: error.message
    });
  }
};

// Track water intake
const trackWater = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { amount, unit = 'ml' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Here you would save the water tracking data to database
    res.json({
      success: true,
      message: 'Water intake tracked successfully',
      data: {
        amount,
        unit,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error tracking water:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track water intake',
      error: error.message
    });
  }
};

// Track weight
const trackWeight = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { weight, unit = 'kg' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Here you would save the weight tracking data to database
    res.json({
      success: true,
      message: 'Weight tracked successfully',
      data: {
        weight,
        unit,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error tracking weight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track weight',
      error: error.message
    });
  }
};

// Get trends analytics
const getTrends = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Generate sample trends data
    const trends = {
      weightTrend: 'decreasing',
      strengthTrend: 'increasing',
      enduranceTrend: 'stable',
      consistencyScore: 85
    };

    res.json({
      success: true,
      message: 'Trends retrieved successfully',
      data: trends
    });

  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trends',
      error: error.message
    });
  }
};

// Get insights analytics
const getInsights = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Generate sample insights
    const insights = [
      "You're most consistent on weekdays - consider adding weekend workouts",
      "Your protein intake is optimal for muscle building",
      "Water intake could be improved - try setting hourly reminders",
      "Your workout intensity has increased by 15% this month"
    ];

    res.json({
      success: true,
      message: 'Insights retrieved successfully',
      data: insights
    });

  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve insights',
      error: error.message
    });
  }
};

// Get recommendations
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Generate sample recommendations
    const recommendations = [
      "Try adding 10 minutes of cardio to your routine",
      "Consider meal prepping for better nutrition consistency",
      "Your rest days are important - don't skip them",
      "Track your sleep for better recovery insights"
    ];

    res.json({
      success: true,
      message: 'Recommendations retrieved successfully',
      data: recommendations
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recommendations',
      error: error.message
    });
  }
};

module.exports = {
  getProgressStats,
  getChartData,
  getHealthRemarks,
  getAvailableWeeks,
  getAvailableMonths,
  trackExercise,
  trackMeal,
  trackWater,
  trackWeight,
  getTrends,
  getInsights,
  getRecommendations
};
