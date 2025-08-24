const UserProfile = require('../models/UserProfile');
const User = require('../models/User');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
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

// Create or update user profile
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;
    
    // Validate required fields
    const requiredFields = ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal'];
    const missingFields = requiredFields.filter(field => !profileData[field]);
    
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
    
    if (userProfile) {
      // Update existing profile
      Object.assign(userProfile, profileData);
      userProfile.lastUpdated = new Date();
    } else {
      // Create new profile
      userProfile = new UserProfile({
        userId,
        ...profileData
      });
    }
    
    await userProfile.save();
    
    res.status(200).json({
      success: true,
      data: userProfile,
      message: userProfile.isProfileComplete ? 'Profile updated successfully' : 'Profile created successfully'
    });
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update specific profile fields
exports.updateProfileField = async (req, res) => {
  try {
    const userId = req.user.id;
    const { field, value } = req.body;
    
    if (!field || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Field and value are required'
      });
    }
    
    // Validate field name
    const allowedFields = [
      'country', 'age', 'gender', 'height', 'currentWeight', 'goalWeight',
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
    
    userProfile[field] = value;
    userProfile.lastUpdated = new Date();
    
    await userProfile.save();
    
    res.status(200).json({
      success: true,
      data: userProfile,
      message: 'Profile field updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile field:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete user profile
exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
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
    const userId = req.user.id;
    
    const userProfile = await UserProfile.findOne({ userId });
    
    if (!userProfile) {
      return res.status(200).json({
        success: true,
        data: {
          isComplete: false,
          missingFields: ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal']
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
