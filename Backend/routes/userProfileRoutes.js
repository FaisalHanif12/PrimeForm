const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Get user profile
router.get('/', userProfileController.getUserProfile);

// Create or update user profile
router.post('/', userProfileController.createOrUpdateProfile);

// Update specific profile field
router.patch('/field', userProfileController.updateProfileField);

// Delete user profile
router.delete('/', userProfileController.deleteProfile);

// Check profile completion status
router.get('/completion', userProfileController.checkProfileCompletion);

module.exports = router;
