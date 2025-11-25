const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getChatHistory } = require('../controllers/aiTrainerController');

router.get('/chat-history', protect, getChatHistory);

module.exports = router;

