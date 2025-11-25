const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

// Progress statistics routes (protected)
router.get('/stats', protect, progressController.getProgressStats);
router.get('/chart-data', protect, progressController.getChartData);
router.get('/health-remarks', protect, progressController.getHealthRemarks);
router.get('/available-weeks', protect, progressController.getAvailableWeeks);
router.get('/available-months', protect, progressController.getAvailableMonths);

// Progress tracking routes (protected)
router.post('/track-exercise', protect, progressController.trackExercise);
router.post('/track-meal', protect, progressController.trackMeal);
router.post('/track-water', protect, progressController.trackWater);
router.post('/track-weight', protect, progressController.trackWeight);

// Progress analytics routes (protected)
router.get('/analytics/trends', protect, progressController.getTrends);
router.get('/analytics/insights', protect, progressController.getInsights);
router.get('/analytics/recommendations', protect, progressController.getRecommendations);

module.exports = router;
