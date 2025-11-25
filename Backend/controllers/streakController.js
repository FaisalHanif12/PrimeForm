const { asyncHandler } = require('../middleware/errorMiddleware');

// In-memory streak data storage (replace with database in production)
const streakData = new Map();

// Helper function to get current date string
const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to build default streak data for a user
const buildDefaultStreakData = (user) => ({
  currentStreak: 0,
  longestStreak: 0,
  totalDays: 0,
  lastCheckIn: null,
  weeklyProgress: [
    { day: 'Mon', completed: false },
    { day: 'Tue', completed: false },
    { day: 'Wed', completed: false },
    { day: 'Thu', completed: false },
    { day: 'Fri', completed: false },
    { day: 'Sat', completed: false },
    { day: 'Sun', completed: false }
  ],
  milestones: [
    { days: 7, achieved: false, title: 'Week Warrior' },
    { days: 30, achieved: false, title: 'Monthly Master' },
    { days: 90, achieved: false, title: 'Quarter Champion' },
    { days: 365, achieved: false, title: 'Year Legend' }
  ]
});

// @desc    Get streak data
// @route   GET /api/streak/data
// @access  Private
const getStreakData = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString() || 'guest';
  
  // Get or initialize streak data for user
  if (!streakData.has(userId)) {
    streakData.set(userId, buildDefaultStreakData(req.user));
  }

  const data = streakData.get(userId);

  res.status(200).json({
    success: true,
    message: 'Streak data fetched successfully',
    data
  });
});

// @desc    Update streak (check in)
// @route   POST /api/streak/checkin
// @access  Private
const checkInStreak = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString() || 'guest';
  const today = getCurrentDateString();

  // Get or initialize streak data
  if (!streakData.has(userId)) {
    streakData.set(userId, buildDefaultStreakData(req.user));
  }

  const data = streakData.get(userId);

  // Check if already checked in today
  if (data.lastCheckIn === today) {
    return res.status(400).json({
      success: false,
      message: 'Already checked in today'
    });
  }

  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];

  if (data.lastCheckIn === yesterdayString) {
    // Continuing streak
    data.currentStreak += 1;
  } else if (data.lastCheckIn === null || data.lastCheckIn < yesterdayString) {
    // Starting new streak
    data.currentStreak = 1;
  }

  // Update longest streak
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  // Update total days
  data.totalDays += 1;
  data.lastCheckIn = today;

  // Update weekly progress
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0, Sun=6
  if (data.weeklyProgress[dayIndex]) {
    data.weeklyProgress[dayIndex].completed = true;
  }

  // Check milestones
  data.milestones.forEach(milestone => {
    if (data.currentStreak >= milestone.days) {
      milestone.achieved = true;
    }
  });

  streakData.set(userId, data);

  res.status(200).json({
    success: true,
    message: 'Streak updated successfully',
    data
  });
});

// @desc    Reset streak
// @route   POST /api/streak/reset
// @access  Private
const resetStreak = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id?.toString() || 'guest';

  streakData.set(userId, buildDefaultStreakData(req.user));

  res.status(200).json({
    success: true,
    message: 'Streak reset successfully',
    data: streakData.get(userId)
  });
});

module.exports = {
  getStreakData,
  checkInStreak,
  resetStreak
};

