const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db.config');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const workoutPlanRoutes = require('./routes/workoutPlanRoutes');
const dietPlanRoutes = require('./routes/dietPlanRoutes');

// Import utilities
const { testEmailConfiguration } = require('./utils/emailService');

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use(limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081', // Expo dev server
      'http://192.168.0.117:8081', // Your specific IP address
      'http://192.168.0.117:5000', // Your API IP
      'exp://192.168.0.117:8081',  // Expo protocol
      'exp://localhost:8081',       // Expo localhost
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PrimeForm API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Base API route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏃‍♂️ PrimeForm API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      userProfile: '/api/user-profile',
      notifications: '/api/notifications',
      workoutPlans: '/api/workout-plans',
      dietPlans: '/api/diet-plans'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/workout-plans', workoutPlanRoutes);
app.use('/api/diet-plans', dietPlanRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏃‍♂️ Welcome to PrimeForm API!',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      user: '/api/users',
      workouts: '/api/workout-plans',
      nutrition: '/api/diet-plans'
    }
  });
});

// Catch 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
const server = app.listen(PORT, HOST, async () => {
  console.log('🚀 ================================');
  console.log(`🏃‍♂️ PrimeForm API Server Running`);
  console.log('🚀 ================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.0.117:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  
  // Test email configuration on startup
  console.log('📧 Testing email configuration...');
  const emailTest = await testEmailConfiguration();
  if (emailTest) {
    console.log('✅ Email service ready');
  } else {
    console.log('⚠️  Email service configuration issue - check your .env file');
  }
  
  console.log('🚀 ================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔴 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('🔴 Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🔴 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('🔴 Process terminated');
  });
});

module.exports = app;
