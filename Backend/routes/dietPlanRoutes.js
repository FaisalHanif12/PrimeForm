const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createDietPlan,
  getUserDietPlan,
  updateDietPlan,
  deleteDietPlan,
  markMealCompleted,
  markDayCompleted,
  logWaterIntake,
  getDietStats,
  getAllUserDietPlans
} = require('../controllers/dietPlanController');

// Apply authentication middleware to all routes
router.use(protect);
 
// Diet Plan CRUD Routes
router.post('/', createDietPlan);                    // POST /api/diet-plans
router.get('/', getUserDietPlan);                    // GET /api/diet-plans
router.get('/active', getUserDietPlan);              // GET /api/diet-plans/active
router.get('/all', getAllUserDietPlans);             // GET /api/diet-plans/all
router.put('/:id', updateDietPlan);                  // PUT /api/diet-plans/:id
router.delete('/:id', deleteDietPlan);               // DELETE /api/diet-plans/:id

// Diet Progress Tracking Routes
router.post('/meal/complete', markMealCompleted);    // POST /api/diet-plans/meal/complete
router.post('/day/complete', markDayCompleted);      // POST /api/diet-plans/day/complete
router.post('/water/log', logWaterIntake);           // POST /api/diet-plans/water/log

// Diet Statistics Routes
router.get('/stats', getDietStats);                  // GET /api/diet-plans/stats

module.exports = router;
