# Pure Body Backend API

🏃‍♂️ **Backend API for Pure Body fitness application**

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Gmail account with App Password

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   
   Configure your `.env` file with the following variables:
   
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/primeform?retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-complex
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Gmail Configuration for OTP and Password Reset
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   
   # Frontend URL (for redirects and CORS)
   FRONTEND_URL=http://localhost:8081
   
   # OTP Configuration
   OTP_EXPIRES_IN=10
   ```

3. **Gmail App Password Setup**
   
   To send emails through Gmail:
   - Go to your Google Account settings
   - Enable 2-Factor Authentication
   - Go to Security > App passwords
   - Generate a new app password for "Mail"
   - Use this 16-character password in `GMAIL_APP_PASSWORD`

4. **MongoDB Setup**
   
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster
   - Get your connection string
   - Replace the placeholder values in `MONGODB_URI`

### Running the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/signup` | Register new user | ❌ |
| `POST` | `/login` | User login | ❌ |
| `POST` | `/forgot-password` | Send password reset OTP | ❌ |
| `POST` | `/verify-reset-otp` | Verify reset OTP | ❌ |
| `POST` | `/reset-password` | Reset password with OTP | ❌ |
| `GET` | `/me` | Get current user profile | ✅ |
| `POST` | `/logout` | Logout user | ✅ |
| `POST` | `/send-verification-otp` | Send email verification OTP | ✅ |
| `POST` | `/verify-email` | Verify email with OTP | ✅ |
| `PUT` | `/profile` | Update user profile | ✅ |
| `PUT` | `/change-password` | Change password | ✅ |

### Dashboard Routes (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | Get dashboard data | ✅ |
| `GET` | `/stats` | Get user statistics | ✅ |

### Utility Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/` | API welcome message |

## 🔧 Authentication Flow

### 1. Signup Process
```json
POST /api/auth/signup
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
- ✅ Success: User created, JWT token returned
- ❌ Error: User already exists

### 2. Login Process
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
- ✅ Success: JWT token returned
- ❌ Error: Account not found (shows signup button)
- ❌ Error: Invalid credentials

### 3. Forgot Password Flow

**Step 1:** Request OTP
```json
POST /api/auth/forgot-password
{
  "email": "john@example.com"
}
```

**Step 2:** Verify OTP
```json
POST /api/auth/verify-reset-otp
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Step 3:** Reset Password
```json
POST /api/auth/reset-password
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass123"
}
```

## 🔒 Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcryptjs with salt rounds
- **Rate Limiting** to prevent abuse
- **Account Lockout** after failed login attempts
- **Input Validation** using express-validator
- **CORS Protection** with configurable origins
- **Helmet Security** headers
- **OTP Expiration** for secure password reset

## 📧 Email Templates

The API sends beautifully designed HTML emails for:
- 🔐 **OTP Verification** (Password Reset)
- 📧 **Email Verification** 
- 🎉 **Welcome Email** (Post Signup)

All emails are branded with Pure Body styling and include:
- Navy + Golden theme colors
- Responsive design
- Clear call-to-action buttons
- Professional formatting

## 🗄️ Database Schema

### User Model
```javascript
{
  fullName: String,
  email: String (unique),
  password: String (hashed),
  isEmailVerified: Boolean,
  isActive: Boolean,
  otp: {
    code: String,
    expiresAt: Date,
    purpose: String
  },
  profile: {
    dateOfBirth: Date,
    gender: String,
    height: Number,
    weight: Number,
    fitnessGoal: String,
    activityLevel: String
  },
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚦 Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
```

## 🔧 Development Tools

- **Nodemon** for auto-restart during development
- **Express Validator** for input validation
- **MongoDB Mongoose** for database operations
- **Nodemailer** for email functionality
- **CORS** for cross-origin requests
- **Helmet** for security headers

## 📝 Environment Variables

Create a `.env` file in the Backend directory with all required variables. The server will test email configuration on startup and notify you of any issues.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your `MONGODB_URI` in `.env`
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify username/password are correct

2. **Email Not Sending**
   - Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD`
   - Ensure 2FA is enabled on your Gmail account
   - Check that App Password is correctly generated

3. **CORS Errors**
   - Update `FRONTEND_URL` in `.env`
   - Check allowed origins in `server.js`

4. **JWT Token Issues**
   - Ensure `JWT_SECRET` is set and complex
   - Check token expiration settings

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use environment-specific MongoDB cluster
3. Configure proper CORS origins
4. Set up SSL/HTTPS
5. Use process manager (PM2, Docker)
6. Monitor logs and performance

---

**Built with ❤️ for Pure Body Fitness App**
