const User = require('../models/User');
const { sendTokenResponse } = require('../middleware/authMiddleware');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');
const { asyncHandler } = require('../middleware/errorMiddleware');
const NotificationService = require('../services/notificationService');

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  // Validation
  if (!fullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    password
  });

  // Send welcome email in background (don't block response)
  sendWelcomeEmail(email, fullName)
    .then(result => {
      if (result.success) {
        console.log('✅ Welcome email sent successfully');
      } else {
        console.log('⚠️ Welcome email failed but user created:', result.error);
      }
    })
    .catch(error => {
      console.log('⚠️ Welcome email error (non-blocking):', error.message);
    });

  // Create welcome notification in background
  NotificationService.createWelcomeNotification(user._id, fullName)
    .then(() => {
      console.log('✅ Welcome notification created successfully');
    })
    .catch(error => {
      console.log('⚠️ Welcome notification error (non-blocking):', error.message);
    });

  // Send token response
  sendTokenResponse(user, 201, res, 'Account created successfully! Welcome to PrimeForm');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password'
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address'
    });
  }

  // Check for user and include password field
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Account not found. Please sign up first.',
      showSignupButton: true
    });
  }

  // Check if account is locked
  if (user.isLocked) {
    return res.status(423).json({
      success: false,
      message: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
    });
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  
  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incLoginAttempts();
    
    return res.status(401).json({
      success: false,
      message: 'Incorrect password. Please check your password and try again.'
    });
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Send token response
  sendTokenResponse(user, 200, res, 'Login successful! Welcome back');
});

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  console.log('=== Forgot Password Debug ===');
  console.log('Received email:', email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your email address'
    });
  }

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  console.log('User found:', !!user);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email address'
    });
  }

  // Generate OTP
  const otp = user.generateOTP('password_reset');
  console.log('Generated OTP:', otp);
  console.log('User OTP data before save:', user.otp);
  
  try {
    await user.save();
    console.log('User saved successfully');
    console.log('User OTP data after save:', user.otp);
    
    // Send OTP email
    await sendOTPEmail(email, otp, user.fullName, 'password_reset');
    console.log('OTP email sent successfully');
    
    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email'
    });
  } catch (error) {
    console.log('Error in forgot password:', error);
    // Clear OTP if email fails
    user.clearOTP();
    await user.save();
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send reset email. Please try again.'
    });
  }
});

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verify-reset-otp
// @access  Public
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  console.log('=== OTP Verification Debug ===');
  console.log('Received email:', email);
  console.log('Received OTP:', otp);
  console.log('Request body:', req.body);

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and OTP'
    });
  }

  // Find user with OTP data
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp.code +otp.expiresAt +otp.purpose');
  console.log('User found:', !!user);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  console.log('User OTP data:', user.otp);
  console.log('Expected OTP:', user.otp?.code);
  console.log('Received OTP:', otp);
  console.log('OTP purpose:', user.otp?.purpose);
  console.log('OTP expires at:', user.otp?.expiresAt);
  console.log('Current time:', new Date());

  // Verify OTP
  const otpResult = user.verifyOTP(otp, 'password_reset');
  console.log('OTP verification result:', otpResult);
  
  if (!otpResult.valid) {
    return res.status(400).json({
      success: false,
      message: otpResult.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully. You can now reset your password.'
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  console.log('=== Reset Password Debug ===');
  console.log('Received email:', email);
  console.log('Received OTP:', otp);
  console.log('New password length:', newPassword?.length);

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, OTP, and new password'
    });
  }

  // Validate password strength
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Find user with OTP data
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+otp.code +otp.expiresAt +otp.purpose');
  console.log('User found:', !!user);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  console.log('User OTP data:', user.otp);
  console.log('Expected OTP:', user.otp?.code);
  console.log('Received OTP for reset:', otp);

  // Verify OTP one more time
  const otpResult = user.verifyOTP(otp, 'password_reset');
  console.log('Reset password OTP verification result:', otpResult);
  
  if (!otpResult.valid) {
    return res.status(400).json({
      success: false,
      message: otpResult.message
    });
  }

  // Update password
  user.password = newPassword;
  user.clearOTP();
  
  // Reset login attempts if any
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  await user.save();
  console.log('Password reset successfully for user:', email);

  // Generate authentication token for automatic login
  const { generateToken } = require('../middleware/authMiddleware');
  const token = generateToken(user._id);
  console.log('Generated auth token for user after password reset');

  res.status(200).json({
    success: true,
    message: 'Password updated successfully!',
    token,
    data: {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Send OTP for email verification
// @route   POST /api/auth/send-verification-otp
// @access  Private
const sendVerificationOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Generate OTP
  const otp = user.generateOTP('email_verification');
  await user.save();

  try {
    // Send OTP email
    await sendOTPEmail(user.email, otp, user.fullName, 'email_verification');
    
    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    // Clear OTP if email fails
    user.clearOTP();
    await user.save();
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.'
    });
  }
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Private
const verifyEmail = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'Please provide the verification code'
    });
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified'
    });
  }

  // Verify OTP
  const otpResult = user.verifyOTP(otp, 'email_verification');
  
  if (!otpResult.valid) {
    return res.status(400).json({
      success: false,
      message: otpResult.message
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.clearOTP();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully!'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    fullName: req.body.fullName,
    'profile.dateOfBirth': req.body.dateOfBirth,
    'profile.gender': req.body.gender,
    'profile.height': req.body.height,
    'profile.weight': req.body.weight,
    'profile.fitnessGoal': req.body.fitnessGoal,
    'profile.activityLevel': req.body.activityLevel
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordCorrect) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
});

module.exports = {
  signup,
  login,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  sendVerificationOTP,
  verifyEmail,
  getMe,
  updateProfile,
  changePassword,
  logout
};
