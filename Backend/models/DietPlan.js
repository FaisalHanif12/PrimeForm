const mongoose = require('mongoose');

// Meal Schema
const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  emoji: {
    type: String,
    default: '🍽️'
  },
  ingredients: [{
    type: String,
    required: false, // Made optional for flexibility
    default: []
  }],
  calories: {
    type: Number,
    required: true,
    min: 0
  },
  protein: {
    type: Number,
    required: true,
    min: 0
  },
  carbs: {
    type: Number,
    required: true,
    min: 0
  },
  fats: {
    type: Number,
    required: true,
    min: 0
  },
  preparationTime: {
    type: String,
    required: true
  },
  servingSize: {
    type: String,
    default: '1 serving'
  },
  instructions: {
    type: String,
    required: false, // Made optional since AI parsing might not always provide this
    default: 'Prepare according to standard cooking methods'
  }
});

// Diet Day Schema
const dietDaySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  dayName: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  date: {
    type: String,
    required: true
  },
  totalCalories: {
    type: Number,
    required: true,
    min: 0
  },
  totalProtein: {
    type: Number,
    required: true,
    min: 0
  },
  totalCarbs: {
    type: Number,
    required: true,
    min: 0
  },
  totalFats: {
    type: Number,
    required: true,
    min: 0
  },
  meals: {
    breakfast: {
      type: mealSchema,
      required: true
    },
    lunch: {
      type: mealSchema,
      required: true
    },
    dinner: {
      type: mealSchema,
      required: true
    },
    snacks: [{
      type: mealSchema
    }]
  },
  waterIntake: {
    type: String,
    required: true,
    default: '2-3 liters'
  },
  notes: {
    type: String,
    default: ''
  }
});

// Diet Plan Schema
const dietPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goal: {
    type: String,
    required: true,
    trim: true
    // Removed enum restriction to allow flexible AI-generated goals
  },
  duration: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  keyNotes: [{
    type: String
  }],
  weeklyPlan: [{
    type: dietDaySchema,
    required: true
  }],
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  totalWeeks: {
    type: Number,
    required: true,
    min: 1
  },
  targetCalories: {
    type: Number,
    required: true,
    min: 0
  },
  targetProtein: {
    type: Number,
    required: true,
    min: 0
  },
  targetCarbs: {
    type: Number,
    required: true,
    min: 0
  },
  targetFats: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completedMeals: [{
    mealId: String,
    completedAt: Date,
    day: Number,
    week: Number,
    mealType: String
  }],
  completedDays: [{
    day: Number,
    week: Number,
    completedAt: Date
  }],
  waterIntakeLog: [{
    day: Number,
    week: Number,
    amount: Number,
    loggedAt: Date
  }],
  // AI generation metadata
  aiModel: {
    type: String,
    default: 'deepseek/deepseek-r1-0528'
  },
  generationTime: {
    type: Number, // in milliseconds
    default: 0
  },
  userProfileSnapshot: {
    age: Number,
    gender: String,
    height: Number,
    currentWeight: Number,
    bodyGoal: String,
    targetWeight: Number,
    dietPreference: String,
    medicalConditions: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
dietPlanSchema.index({ userId: 1, isActive: 1 });
dietPlanSchema.index({ createdAt: -1 });
dietPlanSchema.index({ 'completedMeals.mealId': 1 });

// Instance methods
dietPlanSchema.methods.toJSON = function() {
  const dietPlan = this.toObject();
  
  // Remove sensitive fields if needed
  delete dietPlan.__v;
  
  return dietPlan;
};

// Static methods
dietPlanSchema.statics.findActiveByUserId = function(userId) {
  return this.findOne({ 
    userId: userId, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

dietPlanSchema.statics.deactivateUserPlans = function(userId) {
  return this.updateMany(
    { userId: userId },
    { $set: { isActive: false } }
  );
};

// Virtual for progress calculation
dietPlanSchema.virtual('progress').get(function() {
  const totalDays = this.weeklyPlan.length;
  const completedDaysCount = this.completedDays.length;
  return totalDays > 0 ? (completedDaysCount / totalDays) * 100 : 0;
});

// Method to mark meal as completed
dietPlanSchema.methods.markMealCompleted = function(mealId, day, week, mealType) {
  const existingIndex = this.completedMeals.findIndex(
    meal => meal.mealId === mealId && meal.day === day && meal.week === week
  );
  
  if (existingIndex === -1) {
    this.completedMeals.push({
      mealId,
      completedAt: new Date(),
      day,
      week,
      mealType
    });
  }
  
  return this.save();
};

// Method to mark day as completed
dietPlanSchema.methods.markDayCompleted = function(day, week) {
  const existingIndex = this.completedDays.findIndex(
    d => d.day === day && d.week === week
  );
  
  if (existingIndex === -1) {
    this.completedDays.push({
      day,
      week,
      completedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to log water intake
dietPlanSchema.methods.logWaterIntake = function(day, week, amount) {
  this.waterIntakeLog.push({
    day,
    week,
    amount,
    loggedAt: new Date()
  });
  
  return this.save();
};

// Method to check if meal is completed
dietPlanSchema.methods.isMealCompleted = function(mealId, day, week) {
  return this.completedMeals.some(
    meal => meal.mealId === mealId && meal.day === day && meal.week === week
  );
};

// Method to check if day is completed
dietPlanSchema.methods.isDayCompleted = function(day, week) {
  return this.completedDays.some(
    d => d.day === day && d.week === week
  );
};

// Static method to get active diet plan for user
dietPlanSchema.statics.getActiveDietPlan = function(userId) {
  return this.findOne({ userId, isActive: true }).sort({ createdAt: -1 });
};

// Pre-save middleware
dietPlanSchema.pre('save', function(next) {
  // Ensure only one active plan per user
  if (this.isNew && this.isActive) {
    this.constructor.deactivateUserPlans(this.userId)
      .then(() => next())
      .catch(next);
  } else {
    next();
  }
});

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

module.exports = DietPlan;
