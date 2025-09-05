const mongoose = require('mongoose');

const workoutExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  emoji: {
    type: String,
    required: true
  },
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  reps: {
    type: Number,
    required: true,
    min: 1
  },
  rest: {
    type: String,
    required: true
  },
  targetMuscles: [{
    type: String,
    required: true
  }],
  caloriesBurned: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const workoutDaySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  dayName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  isRestDay: {
    type: Boolean,
    default: false
  },
  exercises: [workoutExerciseSchema],
  warmUp: {
    type: String,
    default: ''
  },
  coolDown: {
    type: String,
    default: ''
  },
  totalCalories: {
    type: Number,
    default: 0
  }
}, { _id: false });

const workoutPlanSchema = new mongoose.Schema({
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
  },
  duration: {
    type: String,
    required: true
  },
  keyNotes: [{
    type: String,
    trim: true
  }],
  weeklyPlan: [workoutDaySchema],
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completedExercises: [{
    exerciseId: String,
    completedAt: Date,
    day: Number,
    week: Number
  }],
  completedDays: [{
    day: Number,
    week: Number,
    completedAt: Date
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
    medicalConditions: String,
    availableEquipment: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
workoutPlanSchema.index({ userId: 1, isActive: 1 });
workoutPlanSchema.index({ userId: 1, createdAt: -1 });
workoutPlanSchema.index({ 'completedExercises.exerciseId': 1 });

// Virtual for progress calculation
workoutPlanSchema.virtual('progress').get(function() {
  const totalDays = this.weeklyPlan.length;
  const completedDaysCount = this.completedDays.length;
  return totalDays > 0 ? (completedDaysCount / totalDays) * 100 : 0;
});

// Method to mark exercise as completed
workoutPlanSchema.methods.markExerciseCompleted = function(exerciseId, day, week) {
  const existingIndex = this.completedExercises.findIndex(
    ex => ex.exerciseId === exerciseId && ex.day === day && ex.week === week
  );
  
  if (existingIndex === -1) {
    this.completedExercises.push({
      exerciseId,
      completedAt: new Date(),
      day,
      week
    });
  }
  
  return this.save();
};

// Method to mark day as completed
workoutPlanSchema.methods.markDayCompleted = function(day, week) {
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

// Method to check if exercise is completed
workoutPlanSchema.methods.isExerciseCompleted = function(exerciseId, day, week) {
  return this.completedExercises.some(
    ex => ex.exerciseId === exerciseId && ex.day === day && ex.week === week
  );
};

// Method to check if day is completed
workoutPlanSchema.methods.isDayCompleted = function(day, week) {
  return this.completedDays.some(
    d => d.day === day && d.week === week
  );
};

// Static method to get active workout plan for user
workoutPlanSchema.statics.getActiveWorkoutPlan = function(userId) {
  return this.findOne({ userId, isActive: true }).sort({ createdAt: -1 });
};

// Static method to deactivate old workout plans
workoutPlanSchema.statics.deactivateOldPlans = function(userId) {
  return this.updateMany(
    { userId, isActive: true },
    { isActive: false }
  );
};

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

module.exports = WorkoutPlan;
