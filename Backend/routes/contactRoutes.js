const express = require('express');
const { sendContactEmail } = require('../controllers/contactController');

const router = express.Router();

// POST /api/contact/send-email
router.post('/send-email', sendContactEmail);

module.exports = router;
