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
const progressRoutes = require('./routes/progressRoutes');
const aiTrainerRoutes = require('./routes/aiTrainerRoutes');
const streakRoutes = require('./routes/streakRoutes');
const dailyReminderRoutes = require('./routes/dailyReminderRoutes');

// Import daily reminder service for cron job
const dailyReminderService = require('./services/dailyReminderService');

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
    // Mobile apps typically don't send an origin header, so we allow them
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin (mobile app)');
      return callback(null, true);
    }

    // ✅ DEVELOPMENT MODE: Allow all origins for flexibility
    // This prevents CORS issues when IP addresses change
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      console.log(`✅ CORS: Development mode - Allowing origin: ${origin}`);
      return callback(null, true);
    }

    // ✅ PRODUCTION MODE: Only allow specific domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081', // Expo dev server
      'http://localhost:5001', // Backend API
      // Add your production domain here
      process.env.FRONTEND_URL,
      process.env.ALLOWED_ORIGINS?.split(',') || []
    ].flat().filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS: Allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS: Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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
    message: 'Pure Body API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Base API route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏃‍♂️ Pure Body API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      userProfile: '/api/user-profile',
      notifications: '/api/notifications',
      workoutPlans: '/api/workout-plans',
      dietPlans: '/api/diet-plans',
      progress: '/api/progress'
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
app.use('/api/progress', progressRoutes);
app.use('/api/ai-trainer', aiTrainerRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/reminders', dailyReminderRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏃‍♂️ Welcome to Pure Body API!',
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
const HOST = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0';
const server = app.listen(PORT, HOST, async () => {
  console.log('🚀 ================================');
  console.log(`🏃‍♂️ Pure Body API Server Running`);
  console.log('🚀 ================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.48.129:${PORT}`); // Current network IP
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);

  // ✅ ENHANCED: Test email configuration on startup with detailed logging
  console.log('📧 [STARTUP] Testing email configuration...');
  const emailTest = await testEmailConfiguration();
  if (emailTest) {
    console.log('✅ [STARTUP] Email service ready');
    console.log('✅ [STARTUP] Email configured: YES');
  } else {
    console.log('⚠️  [STARTUP] Email service configuration issue - check your .env file');
    console.log('⚠️  [STARTUP] Email configured: NO');
    console.log('⚠️  [STARTUP] Welcome emails and password reset emails will fail');
    console.log('⚠️  [STARTUP] To fix: Set GMAIL_USER and GMAIL_APP_PASSWORD in .env or VPS environment');
  }

  console.log('🚀 ================================');

  // ✅ Setup daily reminder cron jobs (FREE - No external service needed)
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
    const cron = require('node-cron');
    const timezone = process.env.TIMEZONE || "Asia/Karachi";
    
    // Schedule 2 notifications at 9:00 AM (Diet & Workout reminders)
    cron.schedule('0 9 * * *', async () => {
      console.log('📱 [CRON] Running 9 AM reminder job (Diet & Workout)...');
      try {
        const users = await require('./models/User').find({
          pushToken: { $exists: true, $ne: null }
        }).select('_id');
        
        console.log(`📱 Sending 9 AM reminders to ${users.length} users`);
        
        for (const user of users) {
          try {
            // Send diet reminder
            await dailyReminderService.sendDietReminder(user._id.toString());
            // Send workout reminder
            await dailyReminderService.sendWorkoutReminder(user._id.toString());
          } catch (error) {
            console.error(`❌ Error sending 9 AM reminders to user ${user._id}:`, error.message);
          }
        }
        
        console.log('✅ [CRON] 9 AM reminders (Diet & Workout) sent successfully');
      } catch (error) {
        console.error('❌ [CRON] Error in 9 AM reminder job:', error);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });
    
    // Schedule 2 notifications at 6:00 PM (Gym & Streak reminders)
    cron.schedule('0 18 * * *', async () => {
      console.log('📱 [CRON] Running 6 PM reminder job (Gym & Streak)...');
      try {
        const users = await require('./models/User').find({
          pushToken: { $exists: true, $ne: null }
        }).select('_id');
        
        console.log(`📱 Sending 6 PM reminders to ${users.length} users`);
        
        for (const user of users) {
          try {
            // Send gym reminder
            await dailyReminderService.sendGymReminder(user._id.toString());
            // Send streak reminder
            await dailyReminderService.sendStreakBrokenReminder(user._id.toString());
          } catch (error) {
            console.error(`❌ Error sending 6 PM reminders to user ${user._id}:`, error.message);
          }
        }
        
        console.log('✅ [CRON] 6 PM reminders (Gym & Streak) sent successfully');
      } catch (error) {
        console.error('❌ [CRON] Error in 6 PM reminder job:', error);
      }
    }, {
      scheduled: true,
      timezone: timezone
    });
    
    console.log('⏰ [CRON] Daily reminder jobs scheduled:');
    console.log('   - 9:00 AM: Diet & Workout reminders');
    console.log('   - 6:00 PM: Gym & Streak reminders');
    console.log(`   - Timezone: ${timezone}`);
  } else {
    console.log('ℹ️  [CRON] Daily reminders disabled (set ENABLE_CRON=true to enable)');
  }
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
