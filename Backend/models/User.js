const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Account Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // OTP for email verification and password reset
  otp: {
    code: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date,
      select: false
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      select: false
    }
  },
  
  // Password Reset Token
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // User Profile Information (for future use)
  profile: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    height: Number, // in cm
    weight: Number, // in kg
    fitnessGoal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness']
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']
    }
  },
  
  // Push notification token
  pushToken: {
    type: String,
    default: null
  },
  
  // Notification preferences (default: all enabled)
  notificationSettings: {
    pushNotifications: {
      type: Boolean,
      default: true
    },
    workoutReminders: {
      type: Boolean,
      default: true
    },
    dietReminders: {
      type: Boolean,
      default: true
    }
  },
  
  // Authentication tracking
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes for performance

userSchema.index({ createdAt: 1 });
userSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function(purpose = 'email_verification') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
  const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN) * 60 * 1000); // OTP expires in minutes
  
  this.otp = {
    code: otp,
    expiresAt,
    purpose
  };
  
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(candidateOTP, purpose) {
  if (!this.otp || !this.otp.code) {
    return { valid: false, message: 'No OTP found' };
  }
  
  if (this.otp.expiresAt < new Date()) {
    return { valid: false, message: 'OTP has expired' };
  }
  
  if (this.otp.purpose !== purpose) {
    return { valid: false, message: 'Invalid OTP purpose' };
  }
  
  if (this.otp.code !== candidateOTP) {
    return { valid: false, message: 'Invalid OTP' };
  }
  
  return { valid: true, message: 'OTP verified successfully' };
};

// Clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Handle login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Clean expired OTPs (called by a cron job or cleanup service)
userSchema.statics.cleanExpiredOTPs = function() {
  return this.updateMany(
    { 'otp.expiresAt': { $lt: new Date() } },
    { $unset: { otp: 1 } }
  );
};

const User = mongoose.model('User', userSchema);

module.exports = User;
