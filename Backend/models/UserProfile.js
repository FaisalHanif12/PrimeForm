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
    ]
  },
  availableEquipment: {
    type: String,
    enum: [
      // English values
      'None', 'Basic Dumbbells', 'Resistance Bands', 'Home Gym', 'Full Gym Access',
      // Urdu values
      'کوئی نہیں', 'بنیادی ڈمبلز', 'مزاحمتی بینڈز', 'گھریلو جم', 'مکمل جم تک رسائی'
    ]
  },
  
  // Diet Preferences
  dietPreference: {
    type: String,
    enum: [
      // English values
      'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Flexitarian', 'Pescatarian',
      // Urdu values
      'سبزی خور', 'سبزی خور نہیں', 'ویگن', 'فلیکسیٹیرین', 'پیسکیٹیرین'
    ]
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
