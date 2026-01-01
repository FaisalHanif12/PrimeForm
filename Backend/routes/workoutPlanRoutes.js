const express = require('express');
const router = express.Router();
const {
  createWorkoutPlan,
  getActiveWorkoutPlan,
  getUserWorkoutPlans,
  markExerciseCompleted,
  markDayCompleted,
  deleteWorkoutPlan,
  getWorkoutStats,
  generateWorkoutPlan
} = require('../controllers/workoutPlanController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Create workout plan
router.post('/', createWorkoutPlan);

// Generate workout plan via AI (OpenRouter proxy)
router.post('/generate', generateWorkoutPlan);

// Get active workout plan
router.get('/active', getActiveWorkoutPlan);

// Get all workout plans for user
router.get('/', getUserWorkoutPlans);

// Mark exercise as completed
router.post('/exercise/complete', markExerciseCompleted);

// Mark day as completed
router.post('/day/complete', markDayCompleted);

// Get workout statistics
router.get('/stats', getWorkoutStats);

// Delete workout plan
router.delete('/:planId', deleteWorkoutPlan);

module.exports = router;
