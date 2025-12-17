# How to Get JWT Token for Testing

## Method 1: Login via API (Easiest for Testing) ✅

### Using cURL

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3...",
  "data": {
    "user": {
      "_id": "...",
      "email": "...",
      ...
    }
  }
}
```

**Copy the `token` value** - that's your JWT token!

### Using Postman

1. **Create new POST request**
2. **URL:** `http://localhost:5000/api/auth/login`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```
5. **Send** - Copy the `token` from response

### Using Browser Console (if app is running)

Open browser DevTools console and run:
```javascript
// This only works if you have access to the app's storage
// Not recommended, use API method instead
```

## Method 2: Get Token from App's AsyncStorage (If Already Logged In)

If you're already logged in to the app, the token is stored in AsyncStorage.

### Option A: Using React Native Debugger

1. Open React Native Debugger
2. Go to AsyncStorage tab
3. Look for key: `authToken`
4. Copy the value

### Option B: Add Temporary Debug Code

Add this to any screen temporarily:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// In your component
useEffect(() => {
  const getToken = async () => {
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔑 JWT Token:', token);
    // Copy this from console
  };
  getToken();
}, []);
```

### Option C: Using Expo Dev Tools

1. Open Expo Dev Tools (shake device or `Cmd+D`)
2. Go to "Debug Remote JS"
3. Open browser console
4. Run:
```javascript
// This requires access to AsyncStorage API
// Better to use API login method
```

## Method 3: Quick Test Script

I've created a helper script. Update it with your credentials:

```javascript
// test-login.js
const axios = require('axios');

async function getToken() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'your-email@example.com',
      password: 'your-password'
    });
    
    if (response.data.success && response.data.token) {
      console.log('\n✅ Login successful!');
      console.log('🔑 JWT Token:');
      console.log(response.data.token);
      console.log('\n📋 Copy this token to test-push-notification.js\n');
      return response.data.token;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

getToken();
```

Run: `node test-login.js`

## Method 4: Update Test Script to Auto-Login

I can update the test script to automatically login first. Would you like me to do that?

## Quick Reference

**Login Endpoint:**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "YOUR_JWT_TOKEN_HERE",
  "data": { ... }
}
```

## Using the Token

Once you have the token, update `test-push-notification.js`:

```javascript
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Paste your token here
```

Then run:
```bash
npm run test:push
```

## Troubleshooting

**"Invalid credentials"**
- Check email and password are correct
- Make sure user exists in database

**"Account not found"**
- User doesn't exist - sign up first

**Token expired**
- Tokens expire after 7 days (default)
- Just login again to get a new token

**Connection error**
- Make sure backend server is running
- Check the API URL is correct

