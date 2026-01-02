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

    // ✅ ENHANCED LOGGING: Comprehensive logging for debugging
    console.log('📱 [BACKEND] === Push Token Save Request ===');
    console.log('📱 [BACKEND] User ID:', userId);
    console.log('📱 [BACKEND] Push token present:', !!pushToken);
    console.log('📱 [BACKEND] Push token length:', pushToken ? pushToken.length : 0);
    console.log('📱 [BACKEND] Push token (first 20 chars):', pushToken ? pushToken.substring(0, 20) + '...' : 'null');
    console.log('📱 [BACKEND] Push token (last 10 chars):', pushToken ? '...' + pushToken.substring(pushToken.length - 10) : 'null');

    if (!pushToken) {
      console.error('❌ [BACKEND] Push token is missing in request');
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    // Update user with push token
    await User.findByIdAndUpdate(userId, { pushToken });
    console.log('✅ [BACKEND] Push token saved to user document');
    console.log('✅ [BACKEND] User document updated with pushToken field');

    // Check for pending notifications and send them
    try {
      console.log('📬 [BACKEND] Checking for pending notifications for user:', userId);
      await NotificationService.sendPendingNotifications(userId);
      console.log('✅ [BACKEND] Pending notifications processed');
    } catch (notificationError) {
      // Don't fail the token save if notification sending fails
      console.error('⚠️ [BACKEND] Error sending pending notifications (non-critical):', notificationError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Push token saved successfully'
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error saving push token:', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id ? req.user._id.toString() : req.user.id
    });
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
    
    // Find existing profile first (needed for validation logic)
    let userProfile = await UserProfile.findOne({ userId });
    
    // Validate required fields
    const requiredFields = ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
    // Only require targetWeight for new profiles with weight-related goals
    // For existing profiles, targetWeight is optional
    if ((profileData.bodyGoal === 'Lose Fat' || profileData.bodyGoal === 'Gain Muscle') && !profileData.targetWeight && !userProfile) {
      missingFields.push('targetWeight');
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
    
    // ✅ CRITICAL: Validate target weight logic (realistic constraints)
    if (profileData.currentWeight && profileData.targetWeight && 
        (profileData.bodyGoal === 'Lose Fat' || profileData.bodyGoal === 'Gain Muscle')) {
      const currentWeight = parseFloat(profileData.currentWeight);
      const targetWeight = parseFloat(profileData.targetWeight);
      
      if (!isNaN(currentWeight) && !isNaN(targetWeight) && currentWeight > 0 && targetWeight > 0) {
        const goal = profileData.bodyGoal?.toLowerCase() || '';
        const isWeightLoss = goal.includes('lose') || goal.includes('fat');
        const isWeightGain = goal.includes('gain') || goal.includes('muscle');
        
        // For weight loss: target must be less than current
        if (isWeightLoss && targetWeight >= currentWeight) {
          return res.status(400).json({
            success: false,
            message: 'Target weight must be less than current weight for weight loss goals'
          });
        }
        
        // For weight gain: target must be greater than current
        if (isWeightGain && targetWeight <= currentWeight) {
          return res.status(400).json({
            success: false,
            message: 'Target weight must be greater than current weight for muscle gain goals'
          });
        }
        
        // Validate that target weight is not more than 50% away from current weight
        const weightDelta = Math.abs(currentWeight - targetWeight);
        const maxAllowedDelta = currentWeight * 0.5; // Maximum 50% of current weight
        
        if (weightDelta > maxAllowedDelta) {
          return res.status(400).json({
            success: false,
            message: `Target weight cannot be more than ${Math.round(maxAllowedDelta)}kg away from current weight (maximum 50% change). Please set a more realistic goal.`
          });
        }
      }
    }
    
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

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    
    const user = await User.findById(userId).select('notificationSettings');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return default values if notificationSettings is not set
    const settings = user.notificationSettings || {
      pushNotifications: true,
      workoutReminders: true,
      dietReminders: true
    };
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Notification settings retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : req.user.id;
    const { pushNotifications, workoutReminders, dietReminders } = req.body;
    
    // Validate input
    const updates = {};
    if (typeof pushNotifications === 'boolean') {
      updates['notificationSettings.pushNotifications'] = pushNotifications;
    }
    if (typeof workoutReminders === 'boolean') {
      updates['notificationSettings.workoutReminders'] = workoutReminders;
    }
    if (typeof dietReminders === 'boolean') {
      updates['notificationSettings.dietReminders'] = dietReminders;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one notification setting must be provided'
      });
    }
    
    // Update user notification settings
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('notificationSettings');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.notificationSettings || {
        pushNotifications: true,
        workoutReminders: true,
        dietReminders: true
      },
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};