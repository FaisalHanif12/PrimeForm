const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendContactEmail: sendContactEmailService } = require('../utils/emailService');

// @desc    Send contact form email
// @route   POST /api/contact/send-email
// @access  Public
const sendContactEmail = asyncHandler(async (req, res) => {
  const { name, email, problem } = req.body;

  // Validation
  if (!name || !email || !problem) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, email, and problem'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  // Problem length validation
  if (problem.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Problem description must be at least 10 characters long'
    });
  }

  try {
    // Send email to admin (mehrfaisal111@gmail.com)
    const emailResult = await sendContactEmailService({
      fromName: name,
      fromEmail: email,
      problem: problem
    });

    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'Contact form submitted successfully. We\'ll get back to you soon!',
        data: {
          submittedAt: new Date(),
          reference: `CF-${Date.now()}`
        }
      });
    } else {
      throw new Error(emailResult.error || 'Failed to send email');
    }
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form. Please try again later.',
      error: error.message
    });
  }
});

module.exports = {
  sendContactEmail
};
