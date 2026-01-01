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

// Proxy OpenRouter API call for AI Trainer chat
const sendMessage = asyncHandler(async (req, res) => {
  const { prompt, language = 'en' } = req.body;

  // Input validation
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is required and must be a non-empty string'
    });
  }

  // Note: Contextual prompts from frontend can be very long (includes user profile, workout plan, diet plan)
  // OpenRouter supports up to 1M tokens, so we allow up to 50000 characters to match original behavior
  // The buildContextualPrompt() function creates comprehensive prompts with all user context
  if (prompt.length > 50000) {
    return res.status(400).json({
      success: false,
      message: 'Prompt is too long (max 50000 characters)'
    });
  }

  // Get OpenRouter config from backend env (SECURE - not exposed to frontend)
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const OPENROUTER_API_URL = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || 'https://primeform.app';
  const OPENROUTER_SITE_NAME = process.env.OPENROUTER_SITE_NAME || 'PrimeForm';

  if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY is missing from backend environment variables');
    return res.status(500).json({
      success: false,
      message: 'AI service is temporarily unavailable. Please try again later.'
    });
  }

  let timeoutId;
  try {
    // Create timeout controller (30 seconds max)
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000);

    // Forward request to OpenRouter
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': OPENROUTER_SITE_URL,
        'X-Title': OPENROUTER_SITE_NAME,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200) // Limit error log length
      });
      
      return res.status(response.status).json({
        success: false,
        message: `AI service error: ${response.statusText}`
      });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      return res.status(500).json({
        success: false,
        message: 'No response from AI'
      });
    }

    // Return response in same format frontend expects
    res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: aiMessage,
        category: 'general' // Frontend will categorize it
      }
    });

  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error('❌ OpenRouter API timeout');
      return res.status(504).json({
        success: false,
        message: 'AI service timeout. Please try again.'
      });
    }

    console.error('❌ Error proxying OpenRouter API:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to communicate with AI service. Please try again later.'
    });
  }
});

module.exports = {
  getChatHistory,
  sendMessage
};

