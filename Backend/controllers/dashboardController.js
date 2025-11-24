const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id ? req.user._id.toString() : req.user.id;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Calculate days since joining
  const daysSinceJoining = Math.floor((new Date() - user.createdAt) / (1000 * 60 * 60 * 24));

  // Basic dashboard data
  const dashboardData = {
    user: {
      fullName: user.fullName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      memberSince: user.createdAt,
      daysSinceJoining,
      lastLogin: user.lastLogin
    },
    stats: {
      totalWorkouts: 0, // Placeholder for future implementation
      totalCaloriesBurned: 0, // Placeholder
      currentStreak: 0, // Placeholder
      achievements: [] // Placeholder
    },
    quickActions: [
      {
        title: 'Start Workout',
        description: 'Begin your fitness journey',
        icon: '💪',
        action: 'start_workout'
      },
      {
        title: 'Track Nutrition',
        description: 'Log your meals',
        icon: '🍎',
        action: 'track_nutrition'
      },
      {
        title: 'View Progress',
        description: 'Check your achievements',
        icon: '📊',
        action: 'view_progress'
      },
      {
        title: 'Update Profile',
        description: 'Complete your fitness profile',
        icon: '👤',
        action: 'update_profile'
      }
    ],
    notifications: []
  };

  // Add welcome notification for new users
  if (daysSinceJoining === 0) {
    dashboardData.notifications.push({
      type: 'welcome',
      title: 'Welcome to PrimeForm! 🎉',
      message: 'Start your fitness journey by completing your profile and setting your goals.',
      priority: 'high'
    });
  }

  // Add email verification notification if not verified
  if (!user.isEmailVerified) {
    dashboardData.notifications.push({
      type: 'email_verification',
      title: 'Verify Your Email',
      message: 'Please verify your email address to unlock all features.',
      priority: 'medium'
    });
  }

  res.status(200).json({
    success: true,
    message: `Welcome ${user.fullName.split(' ')[0]}! 🏃‍♂️`,
    data: dashboardData
  });
});

// @desc    Get user statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = asyncHandler(async (req, res) => {
  // Placeholder for future implementation
  const stats = {
    thisWeek: {
      workouts: 0,
      calories: 0,
      activeMinutes: 0
    },
    thisMonth: {
      workouts: 0,
      calories: 0,
      activeMinutes: 0
    },
    allTime: {
      workouts: 0,
      calories: 0,
      activeMinutes: 0,
      joinDate: req.user.createdAt
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getDashboard,
  getStats
};

