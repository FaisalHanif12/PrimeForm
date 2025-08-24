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
    enum: ['male', 'female', 'other'],
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
  goalWeight: {
    type: String
  },
  bodyGoal: {
    type: String,
    enum: ['Lose Fat', 'Gain Muscle', 'Maintain Weight', 'General Training', 'Improve Fitness'],
    required: true
  },
  
  // Lifestyle & Health
  medicalConditions: {
    type: String,
    default: ''
  },
  occupationType: {
    type: String,
    enum: ['Sedentary Desk Job', 'Active Job', 'Shift Worker', 'Student', 'Retired', 'Other']
  },
  availableEquipment: {
    type: String,
    enum: ['None', 'Basic Dumbbells', 'Resistance Bands', 'Home Gym', 'Full Gym Access']
  },
  
  // Diet Preferences
  dietPreference: {
    type: String,
    enum: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Flexitarian', 'Pescatarian']
  },
  
  // Metadata
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update isProfileComplete when required fields are filled
userProfileSchema.pre('save', function(next) {
  const requiredFields = ['country', 'age', 'gender', 'height', 'currentWeight', 'bodyGoal'];
  this.isProfileComplete = requiredFields.every(field => this[field]);
  next();
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
