const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    
    let userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No profile found for user'
      });
    }
    
    res.status(200).json({
      success: true,
      data: userProfile,
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Save push notification token
exports.savePushToken = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    // Update user with push token
    await User.findByIdAndUpdate(userId, { pushToken });

    // Check for pending notifications and send them
    await NotificationService.sendPendingNotifications(userId);

    res.status(200).json({
      success: true,
      message: 'Push token saved successfully'
    });
  } catch (error) {
    console.error('Error saving push token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Create or update user profile
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const profileData = req.body;
    
    console.log('🔍 createOrUpdateProfile - Request from user ID:', userId);
    console.log('🔍 createOrUpdateProfile - User email:', req.user.email);
    console.log('🔍 createOrUpdateProfile - Profile data received:', profileData);
    
    // Validate required fields
    const requiredFields = ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    // Only require targetWeight for new profiles with weight-related goals
    // For existing profiles, targetWeight is optional
    if ((profileData.bodyGoal === 'Lose Fat' || profileData.bodyGoal === 'Gain Muscle') && !profileData.targetWeight && !userProfile) {
      missingFields.push('targetWeight');
    }
  
    if (userProfile && !profileData.targetWeight) {
      delete profileData.targetWeight;
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Convert age to number
    if (profileData.age) {
      profileData.age = parseInt(profileData.age);
      if (isNaN(profileData.age) || profileData.age < 13 || profileData.age > 120) {
        return res.status(400).json({
          success: false,
          message: 'Age must be between 13 and 120'
        });
      }
    }
    
    // Find existing profile or create new one
    let userProfile = await UserProfile.findOne({ userId });
    
    console.log('🔍 createOrUpdateProfile - Existing profile found:', userProfile ? 'Yes' : 'No');
    if (userProfile) {
      console.log('🔍 createOrUpdateProfile - Existing profile userId:', userProfile.userId);
    }
    
    if (userProfile) {
      // Update existing profile
      Object.assign(userProfile, profileData);
      userProfile.lastUpdated = new Date();
      console.log('🔍 createOrUpdateProfile - Updating existing profile');
    } else {
      // Create new profile
      userProfile = new UserProfile({
        userId,
        ...profileData
      });
      console.log('🔍 createOrUpdateProfile - Creating new profile with userId:', userId);
    }
    
    await userProfile.save();
    
    console.log('🔍 createOrUpdateProfile - Profile saved successfully with userId:', userProfile.userId);
    
    // Removed automatic plan creation notifications when user fills out profile
    // These notifications will be sent separately when plans are actually generated
    console.log('✅ Profile saved successfully - no automatic notifications sent');
    
    res.status(200).json({
      success: true,
      data: userProfile,
      message: userProfile.isProfileComplete ? 'Profile updated successfully' : 'Profile created successfully'
    });
  } catch (error) {
    console.error('💥 Error creating/updating user profile:', error);
    console.error('💥 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry. User profile already exists.',
        field: Object.keys(error.keyValue)[0]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create/update user profile',
      error: error.message
    });
  }
};

// Update specific profile fields
exports.updateProfileField = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { field, value } = req.body;
    
    if (!field || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Field and value are required'
      });
    }
    
    // Validate field name
    const allowedFields = [
      'country', 'age', 'gender', 'height', 'currentWeight', 'targetWeight',
      'bodyGoal', 'medicalConditions', 'occupationType', 'availableEquipment', 'dietPreference'
    ];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field name'
      });
    }
    
    // Special validation for age
    if (field === 'age') {
      const age = parseInt(value);
      if (isNaN(age) || age < 13 || age > 120) {
        return res.status(400).json({
          success: false,
          message: 'Age must be between 13 and 120'
        });
      }
    }
    
    let userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Please create a profile first.'
      });
    }
    
    // Special validation for bodyGoal changes - require targetWeight if switching to weight-related goals
    if (field === 'bodyGoal' && (value === 'Lose Fat' || value === 'Gain Muscle')) {
      if (!userProfile.targetWeight) {
        return res.status(400).json({
          success: false,
          message: 'Target weight is required for weight loss or muscle gain goals'
        });
      }
    }
    
    userProfile[field] = value;
    userProfile.lastUpdated = new Date();
    
    await userProfile.save();
    
    res.status(200).json({
      success: true,
      data: userProfile,
      message: 'Profile field updated successfully'
    });
  } catch (error) {
    console.error('💥 Error updating profile field:', error);
    console.error('💥 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update profile field',
      error: error.message
    });
  }
};

// Delete user profile
exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    
    const userProfile = await UserProfile.findOneAndDelete({ userId });
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check if user profile is complete
exports.checkProfileCompletion = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    
    const userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(200).json({
        success: true,
        data: {
          isComplete: false,
          missingFields: ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal'],
          badges: []
        },
        message: 'No profile found'
      });
    }
    
    const requiredFields = ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal'];
    const missingFields = requiredFields.filter(field => !userProfile[field]);
    
    res.status(200).json({
      success: true,
      data: {
        isComplete: userProfile.isProfileComplete,
        missingFields,
        badges: userProfile.badges || [],
        profile: userProfile
      },
      message: 'Profile completion status retrieved'
    });
  } catch (error) {
    console.error('Error checking profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user badges
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    
    const userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(200).json({
        success: true,
        data: {
          badges: [],
          hasProfileCompletionBadge: false
        },
        message: 'No profile found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        badges: userProfile.badges || [],
        hasProfileCompletionBadge: userProfile.badges.includes('profile_completion'),
        profile: userProfile
      },
      message: 'User badges retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
