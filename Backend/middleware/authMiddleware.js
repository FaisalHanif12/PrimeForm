const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('🔐 protect - JWT token decoded successfully');
      console.log('🔐 protect - Decoded token payload:', decoded);
      console.log('🔐 protect - User ID from token:', decoded.id);
      
      // Get user from token and add to request object
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('❌ protect - No user found with ID:', decoded.id);
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }

      console.log('✅ protect - User found:', {
        id: user._id,
        email: user.email,
        fullName: user.fullName
      });

      // Check if user account is active
      if (!user.isActive) {
        console.log('❌ protect - User account is deactivated:', user.email);
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      req.user = user;
      console.log('🔐 protect - User added to request object:', {
        id: req.user.id,
        email: req.user.email
      });
      next();
    } catch (error) {
      console.error('❌ protect - JWT verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('❌ protect - Middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Optional authentication - doesn't throw error if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// Restrict to specific roles (for future use)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Create token
  const token = generateToken(user._id);

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Remove password from output
  user.password = undefined;

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      token,
      data: {
        user
      }
    });
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
  generateToken,
  sendTokenResponse
};
