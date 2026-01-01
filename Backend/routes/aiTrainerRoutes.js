const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getChatHistory, sendMessage } = require('../controllers/aiTrainerController');

router.get('/chat-history', protect, getChatHistory);
router.post('/send-message', protect, sendMessage);

module.exports = router;

