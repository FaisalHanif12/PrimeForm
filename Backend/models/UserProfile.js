const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic Information
  country: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 13,
    max: 120
  },
  gender: {
    type: String,
    enum: [
      // English values
      'male', 'female', 'other',
      // Urdu values
      'مرد', 'خواتین', 'دیگر'
    ],
    required: true
  },
  
  // Physical Information
  height: {
    type: String,
    required: true
  },
  currentWeight: {
    type: String,
    required: true
  },
  targetWeight: {
    type: String,
    required: false
  },
  bodyGoal: {
    type: String,
    enum: [
      // English values
      'Lose Fat', 'Gain Muscle', 'Maintain Weight', 'General Training', 'Improve Fitness',
      // Urdu values
      'چربی کم کریں', 'پٹھے بنائیں', 'وزن برقرار رکھیں', 'عمومی تربیت', 'فٹنس بہتر کریں'
    ],
    required: true
  },
  
  // Lifestyle & Health
  medicalConditions: {
    type: String,
    default: ''
  },
  occupationType: {
    type: String,
    enum: [
      // English values
      'Sedentary Desk Job', 'Active Job', 'Shift Worker', 'Student', 'Retired', 'Other',
      // Urdu values
      'بیٹھے ہوئے ڈیسک کا کام', 'متحرک کام', 'شفٹ ورکر', 'طالب علم', 'ریٹائرڈ', 'دیگر'
    ],
    required: false
  },
  availableEquipment: {
    type: String,
    enum: [
      // English values
      'None', 'Basic Dumbbells', 'Resistance Bands', 'Home Gym', 'Full Gym Access',
      // Urdu values
      'کوئی نہیں', 'بنیادی ڈمبلز', 'مزاحمتی بینڈز', 'گھریلو جم', 'مکمل جم تک رسائی'
    ],
    required: false
  },
  
  // Diet Preferences
  dietPreference: {
    type: String,
    enum: [
      // English values
      'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Flexitarian', 'Pescatarian',
      // Urdu values
      'سبزی خور', 'سبزی خور نہیں', 'ویگن', 'فلیکسیٹیرین', 'پیسکیٹیرین'
    ],
    required: false
  },
  
  // Metadata
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  badges: {
    type: [String],
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update isProfileComplete and add badges when required fields are filled
userProfileSchema.pre('save', function(next) {
  const requiredFields = ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal'];
  this.isProfileComplete = requiredFields.every(field => this[field]);
  
  // Add profile completion badge if profile is complete and doesn't already have it
  if (this.isProfileComplete && !this.badges.includes('profile_completion')) {
    this.badges.push('profile_completion');
  }
  
  next();
});

// Post-save middleware to send notifications when badge is earned
userProfileSchema.post('save', async function(doc) {
  try {
    // Check if this is a new profile completion badge
    // Only create notification if profile is complete AND badge was just added
    if (doc.isProfileComplete && doc.badges.includes('profile_completion')) {
      // Get the user details for the notification
      const User = require('./User');
      const user = await User.findById(doc.userId);
      
      if (user) {
        // Import and call the notification service
        const NotificationService = require('../services/notificationService');
        
        // Send profile completion badge notification
        // The service will handle duplicate prevention
        const notification = await NotificationService.createProfileCompletionBadgeNotification(
          doc.userId,
          user.fullName
        );
        
        if (notification) {
          console.log('🏆 Profile completion badge notification created for user:', user.email);
        } else {
          console.log('ℹ️ Profile completion badge notification already exists for user:', user.email);
        }
      }
    }
  } catch (error) {
    console.error('⚠️ Error sending profile completion notification:', error.message);
    // Don't throw error to avoid breaking the save operation
  }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
