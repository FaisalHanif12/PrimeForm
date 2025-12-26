const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Validate MongoDB URI exists
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Validate connection string format
    if (!process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      throw new Error('Invalid MongoDB connection string format');
    }

    console.log('🔄 Attempting to connect to MongoDB...');
    console.log(`📍 Connection string: ${process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Connection timeout
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain at least 2 socket connections
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Provide specific error guidance
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.log('\n🔒 IP WHITELIST ISSUE DETECTED');
      console.log('📝 Steps to fix:');
      console.log('   1. Go to MongoDB Atlas Dashboard');
      console.log('   2. Navigate to Network Access');
      console.log('   3. Click "Add IP Address"');
      console.log('   4. Add your current IP or use "0.0.0.0/0" for development (NOT recommended for production)');
      console.log('   5. Wait a few minutes for changes to propagate\n');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔐 AUTHENTICATION ISSUE DETECTED');
      console.log('📝 Check your MongoDB username and password in MONGODB_URI');
    } else if (error.message.includes('timeout')) {
      console.log('\n⏱️  TIMEOUT ISSUE DETECTED');
      console.log('📝 Possible causes:');
      console.log('   - Network connectivity issues');
      console.log('   - Firewall blocking MongoDB ports (27017 or 27017-27019)');
      console.log('   - VPN or proxy interfering with connection');
    } else if (error.message.includes('MONGODB_URI')) {
      console.log('\n📋 CONFIGURATION ISSUE DETECTED');
      console.log('📝 Make sure MONGODB_URI is set in your .env file');
    }
    
    console.log('⚠️  Server will continue running without database connection');
    console.log('💡 Please check your MongoDB Atlas IP whitelist and network connection');
    // Don't exit process - let server run without DB for now
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
  console.log('🔄 Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
  if (err.message.includes('IP') || err.message.includes('whitelist')) {
    console.log('💡 IP whitelist issue - check MongoDB Atlas Network Access settings');
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔴 MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;