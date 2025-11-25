const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStreakData, checkInStreak, resetStreak } = require('../controllers/streakController');

// Streak routes (all protected)
router.get('/data', protect, getStreakData);
router.post('/checkin', protect, checkInStreak);
router.post('/reset', protect, resetStreak);

module.exports = router;

