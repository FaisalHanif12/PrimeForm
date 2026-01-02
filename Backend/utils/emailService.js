const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // ✅ ENHANCED VALIDATION: Check for required environment variables with detailed logging
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    const missingVars = [];
    if (!process.env.GMAIL_USER) missingVars.push('GMAIL_USER');
    if (!process.env.GMAIL_APP_PASSWORD) missingVars.push('GMAIL_APP_PASSWORD');
    
    console.error('❌ [EMAIL] === Email Configuration Error ===');
    console.error('❌ [EMAIL] Missing environment variables:', missingVars.join(', '));
    console.error('❌ [EMAIL] Please set these in your .env file or VPS environment:');
    console.error('❌ [EMAIL]   GMAIL_USER=your-email@gmail.com');
    console.error('❌ [EMAIL]   GMAIL_APP_PASSWORD=your-app-specific-password');
    console.error('❌ [EMAIL] Note: GMAIL_APP_PASSWORD is NOT your regular Gmail password.');
    console.error('❌ [EMAIL] Generate it at: https://myaccount.google.com/apppasswords');
    console.error('❌ [EMAIL] To verify on VPS, run: pm2 env <process-id> | grep GMAIL');
    throw new Error(`Missing email configuration: ${missingVars.join(', ')}`);
  }

  // ✅ ENHANCED LOGGING: Log email configuration (without exposing password)
  console.log('📧 [EMAIL] Email service configured');
  console.log('📧 [EMAIL] Gmail user:', process.env.GMAIL_USER);
  console.log('📧 [EMAIL] Gmail app password:', process.env.GMAIL_APP_PASSWORD ? '***SET***' : 'NOT SET');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, fullName, purpose = 'verification') => {
  try {
    const transporter = createTransporter();
    console.log(`📧 Attempting to send OTP email to: ${email} (purpose: ${purpose})`);

    const purposeText = purpose === 'password_reset' ? 'Password Reset' : 'Account Verification';
    const actionText = purpose === 'password_reset' ? 'reset your password' : 'verify your account';

    const mailOptions = {
      from: {
        name: 'Pure Body',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: `Pure Body - ${purposeText} Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pure Body - ${purposeText}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #1e3a8a, #3b82f6);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-container {
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              display: inline-block;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #1f2937;
              letter-spacing: 8px;
              margin: 0;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .otp-label {
              color: #374151;
              font-size: 14px;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .message {
              font-size: 16px;
              color: #4b5563;
              margin: 20px 0;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #92400e;
              font-size: 14px;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              background: linear-gradient(135deg, #1e3a8a, #3b82f6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏃‍♂️ Pure Body</h1>
              <p>Your Fitness Journey Starts Here</p>
            </div>
            
            <div class="content">
              <h2>Hello ${fullName}!</h2>
              <p class="message">
                We received a request to ${actionText}. Please use the verification code below:
              </p>
              
              <div class="otp-container">
                <div class="otp-label">VERIFICATION CODE</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                ⚠️ This code will expire in ${process.env.OTP_EXPIRES_IN || 10} minutes. 
                If you didn't request this, please ignore this email.
              </div>
              
              <p class="message">
                Enter this code in the Pure Body app to continue with your ${actionText}.
              </p>
            </div>
            
            <div class="footer">
              <p>
                <strong class="logo">Pure Body</strong><br>
                Transform Your Body, Transform Your Life<br>
                <em>This is an automated email. Please do not reply.</em>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL] ${purposeText} email sent successfully to ${email}`);
    console.log(`📧 [EMAIL] Email message ID: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    // ✅ ENHANCED LOGGING: Comprehensive error logging with SMTP details
    console.error('❌ [EMAIL] === Error sending OTP email ===');
    console.error('❌ [EMAIL] Error message:', error.message);
    console.error('❌ [EMAIL] Error code:', error.code);
    console.error('❌ [EMAIL] Error command:', error.command);
    console.error('❌ [EMAIL] SMTP response:', error.response);
    console.error('❌ [EMAIL] SMTP response code:', error.responseCode);
    console.error('❌ [EMAIL] Target email:', email);
    console.error('❌ [EMAIL] Purpose:', purpose);
    console.error('❌ [EMAIL] Full error:', error);
    
    // Check for common SMTP errors
    if (error.code === 'EAUTH') {
      console.error('❌ [EMAIL] Authentication failed - check GMAIL_APP_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('❌ [EMAIL] Connection failed - check SMTP ports (587/465) are not blocked');
      console.error('❌ [EMAIL] Test from VPS: telnet smtp.gmail.com 587');
    } else if (error.responseCode === 535) {
      console.error('❌ [EMAIL] Invalid credentials - verify GMAIL_APP_PASSWORD');
    }
    
    // Re-throw with more context
    throw new Error(`Failed to send ${purpose} email: ${error.message}`);
  }
};

// Send welcome email after successful signup
const sendWelcomeEmail = async (email, fullName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Pure Body',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: 'Welcome to Pure Body - Let\'s Start Your Fitness Journey!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Pure Body</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #1e3a8a, #3b82f6);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-message {
              text-align: center;
              margin-bottom: 30px;
            }
            .features {
              margin: 30px 0;
            }
            .feature {
              display: flex;
              align-items: center;
              margin: 15px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .feature-icon {
              font-size: 24px;
              margin-right: 15px;
              width: 40px;
            }
            .cta {
              text-align: center;
              margin: 30px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              color: #1f2937;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
            }
            .footer {
              background: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Pure Body!</h1>
              <p>Get ready to transform your fitness journey</p>
            </div>
            
            <div class="content">
              <div class="welcome-message">
                <h2>Hello ${fullName}!</h2>
                <p>Congratulations on taking the first step towards a healthier, stronger you! We're thrilled to have you join the Pure Body family.</p>
              </div>
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">💪</div>
                  <div>
                    <strong>Personalized Workouts</strong><br>
                    Custom fitness plans tailored to your goals and fitness level
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">🍎</div>
                  <div>
                    <strong>Nutrition Guidance</strong><br>
                    Custom meal plans and nutrition tracking to fuel your workouts
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <div>
                    <strong>Progress Tracking</strong><br>
                    Monitor your journey with detailed analytics and insights
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">🏆</div>
                  <div>
                    <strong>Achievement System</strong><br>
                    Unlock badges and milestones as you reach your goals
                  </div>
                </div>
              </div>
              
              <div class="cta">
                <p>Ready to start your transformation?</p>
                <a href="#" class="cta-button">Begin Your Journey</a>
              </div>
              
              <p style="text-align: center; color: #6b7280; margin-top: 30px;">
                Need help getting started? Our support team is here for you 24/7!
              </p>
            </div>
            
            <div class="footer">
              <p>
                <strong>Pure Body</strong><br>
                Transform Your Body, Transform Your Life<br>
                <em>This is an automated email. Please do not reply.</em>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL] Welcome email sent successfully to ${email}`);
    console.log(`📧 [EMAIL] Email message ID: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    // ✅ ENHANCED LOGGING: Comprehensive error logging with SMTP details
    console.error('❌ [EMAIL] === Error sending welcome email ===');
    console.error('❌ [EMAIL] Error message:', error.message);
    console.error('❌ [EMAIL] Error code:', error.code);
    console.error('❌ [EMAIL] SMTP response:', error.response);
    console.error('❌ [EMAIL] SMTP response code:', error.responseCode);
    console.error('❌ [EMAIL] Target email:', email);
    console.error('❌ [EMAIL] Full error:', error);
    
    // Check for common SMTP errors
    if (error.code === 'EAUTH') {
      console.error('❌ [EMAIL] Authentication failed - check GMAIL_APP_PASSWORD');
    } else if (error.code === 'ECONNECTION') {
      console.error('❌ [EMAIL] Connection failed - check SMTP ports (587/465) are not blocked');
      console.error('❌ [EMAIL] Test from VPS: telnet smtp.gmail.com 587');
    }
    
    // Don't throw error for welcome email failure - just log it
    return {
      success: false,
      error: error.message
    };
  }
};

// Send contact form email
const sendContactEmail = async ({ fromName, fromEmail, problem }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Pure Body Contact Form',
        address: process.env.GMAIL_USER
      },
      to: 'mehrfaisal111@gmail.com', // Your email address
      subject: `Pure Body Contact Form - ${fromName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pure Body Contact Form</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #1e3a8a, #3b82f6);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
            }
            .content {
              padding: 40px 30px;
            }
            .contact-info {
              background: #f8fafc;
              border-radius: 12px;
              padding: 25px;
              margin: 20px 0;
            }
            .contact-info h3 {
              color: #1e3a8a;
              margin-top: 0;
            }
            .contact-info p {
              margin: 10px 0;
              color: #4b5563;
            }
            .contact-info strong {
              color: #1f2937;
            }
            .problem-section {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 20px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }
            .problem-section h3 {
              color: #92400e;
              margin-top: 0;
            }
            .problem-text {
              color: #78350f;
              font-style: italic;
              line-height: 1.8;
            }
            .footer {
              background: #f1f5f9;
              padding: 20px 30px;
              text-align: center;
              color: #64748b;
            }
            .timestamp {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 New Contact Form Submission</h1>
              <p>Someone has reached out through the Pure Body app</p>
            </div>
            
            <div class="content">
              <div class="contact-info">
                <h3>👤 Contact Information</h3>
                <p><strong>Name:</strong> ${fromName}</p>
                <p><strong>Email:</strong> ${fromEmail}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="problem-section">
                <h3>❓ Problem Description</h3>
                <p class="problem-text">${problem.replace(/\n/g, '<br>')}</p>
              </div>
              
              <p style="text-align: center; color: #6b7280; margin-top: 30px;">
                Please respond to this user at: <strong>${fromEmail}</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>
                <strong>Pure Body</strong><br>
                Contact Form Submission<br>
                <em>This is an automated email from the Pure Body app.</em>
              </p>
              <div class="timestamp">
                Sent on: ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Contact form email sent successfully from ${fromName} (${fromEmail})`);
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('❌ Error sending contact form email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    // ✅ ENHANCED VALIDATION: Check environment variables first with detailed logging
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      const missingVars = [];
      if (!process.env.GMAIL_USER) missingVars.push('GMAIL_USER');
      if (!process.env.GMAIL_APP_PASSWORD) missingVars.push('GMAIL_APP_PASSWORD');
      
      console.error('❌ [EMAIL] === Email Configuration Test Failed ===');
      console.error('❌ [EMAIL] Missing environment variables:', missingVars.join(', '));
      console.error('❌ [EMAIL] Required .env variables:');
      console.error('❌ [EMAIL]   GMAIL_USER=your-email@gmail.com');
      console.error('❌ [EMAIL]   GMAIL_APP_PASSWORD=your-app-specific-password');
      console.error('❌ [EMAIL] Note: GMAIL_APP_PASSWORD is NOT your regular Gmail password.');
      console.error('❌ [EMAIL] Generate it at: https://myaccount.google.com/apppasswords');
      console.error('❌ [EMAIL] To verify on VPS:');
      console.error('❌ [EMAIL]   pm2 env <process-id> | grep GMAIL');
      console.error('❌ [EMAIL]   OR: printenv | grep GMAIL');
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ [EMAIL] Email configuration is valid');
    console.log(`✅ [EMAIL] Using Gmail account: ${process.env.GMAIL_USER}`);
    console.log('✅ [EMAIL] SMTP connection verified successfully');
    return true;
  } catch (error) {
    // ✅ ENHANCED LOGGING: Comprehensive error logging
    console.error('❌ [EMAIL] === Email Configuration Test Failed ===');
    console.error('❌ [EMAIL] Error message:', error.message);
    console.error('❌ [EMAIL] Error code:', error.code);
    console.error('❌ [EMAIL] Error command:', error.command);
    console.error('❌ [EMAIL] SMTP response:', error.response);
    console.error('❌ [EMAIL] SMTP response code:', error.responseCode);
    
    // Check for common SMTP errors
    if (error.code === 'EAUTH') {
      console.error('❌ [EMAIL] Authentication failed - check GMAIL_APP_PASSWORD');
      console.error('❌ [EMAIL] Verify app password at: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNECTION') {
      console.error('❌ [EMAIL] Connection failed - check SMTP ports (587/465) are not blocked');
      console.error('❌ [EMAIL] Test from VPS:');
      console.error('❌ [EMAIL]   telnet smtp.gmail.com 587');
      console.error('❌ [EMAIL]   OR: nc -zv smtp.gmail.com 587');
    } else if (error.responseCode === 535) {
      console.error('❌ [EMAIL] Invalid credentials - verify GMAIL_APP_PASSWORD');
    }
    
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendContactEmail,
  testEmailConfiguration
};
