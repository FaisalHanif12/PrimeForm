const express = require('express');
const { getDashboard, getStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all dashboard routes
router.use(protect);

// Dashboard routes
router.get('/', getDashboard);
router.get('/stats', getStats);

module.exports = router;
