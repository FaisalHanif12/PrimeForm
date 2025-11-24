const { asyncHandler } = require('../middleware/errorMiddleware');

// Simple in-memory fallback store keyed by user id
const chatMemory = new Map();

const buildDefaultMessage = (user) => ({
  id: 'ai_welcome',
  type: 'ai',
  message: `Hey ${user?.fullName || 'athlete'}! 👋 I'm your AI trainer, ready to keep you on track with workouts, recovery tips, and motivation whenever you need it.`,
  timestamp: new Date(),
  category: 'general'
});

const getChatHistory = asyncHandler(async (req, res) => {
  // Get user ID from req.user (set by protect middleware)
  const userId = req.user?.id || req.user?._id?.toString() || 'guest';
  
  if (!chatMemory.has(userId)) {
    chatMemory.set(userId, [buildDefaultMessage(req.user)]);
  }

  res.status(200).json({
    success: true,
    message: 'AI Trainer chat history fetched successfully',
    data: chatMemory.get(userId)
  });
});

module.exports = {
  getChatHistory
};

