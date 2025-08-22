const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
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

    const purposeText = purpose === 'password_reset' ? 'Password Reset' : 'Account Verification';
    const actionText = purpose === 'password_reset' ? 'reset your password' : 'verify your account';

    const mailOptions = {
      from: {
        name: 'PrimeForm',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: `PrimeForm - ${purposeText} Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PrimeForm - ${purposeText}</title>
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
              <h1>🏃‍♂️ PrimeForm</h1>
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
                Enter this code in the PrimeForm app to continue with your ${actionText}.
              </p>
            </div>
            
            <div class="footer">
              <p>
                <strong class="logo">PrimeForm</strong><br>
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
    console.log(`✅ ${purposeText} email sent successfully to ${email}`);
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Send welcome email after successful signup
const sendWelcomeEmail = async (email, fullName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'PrimeForm',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: 'Welcome to PrimeForm - Let\'s Start Your Fitness Journey!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to PrimeForm</title>
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
              <h1>🎉 Welcome to PrimeForm!</h1>
              <p>Get ready to transform your fitness journey</p>
            </div>
            
            <div class="content">
              <div class="welcome-message">
                <h2>Hello ${fullName}!</h2>
                <p>Congratulations on taking the first step towards a healthier, stronger you! We're thrilled to have you join the PrimeForm family.</p>
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
                <strong>PrimeForm</strong><br>
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
    console.log(`✅ Welcome email sent successfully to ${email}`);
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error for welcome email failure - just log it
    return {
      success: false,
      error: error.message
    };
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  testEmailConfiguration
};
