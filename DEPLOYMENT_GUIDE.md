# Complete Deployment Guide - Pure Body App

## Table of Contents
1. [Backend Deployment to Hostinger](#backend-deployment-to-hostinger)
2. [Android APK Build & Testing](#android-apk-build--testing)
3. [Google Play Store Deployment](#google-play-store-deployment)
4. [iOS Build & App Store Deployment](#ios-build--app-store-deployment)
5. [GitHub Push Instructions](#github-push-instructions)

---

## Backend Deployment to Hostinger

### Prerequisites
- Hostinger account with Node.js hosting
- MongoDB Atlas account (or MongoDB on Hostinger)
- Domain name (optional, can use Hostinger subdomain)

### Step 1: Prepare Backend Code

1. **Update Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   GMAIL_USER=your-production-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   FRONTEND_URL=https://your-frontend-domain.com
   ENABLE_CRON=true
   TIMEZONE=Asia/Karachi
   ```

2. **Remove Development Files:**
   - Remove `test-*.js` files (or keep them, they're harmless)
   - Ensure `.env` is in `.gitignore`

### Step 2: Deploy to Hostinger

#### Option A: Using Hostinger Node.js Hosting

1. **Access Hostinger Control Panel:**
   - Login to Hostinger
   - Go to "Hosting" → "Node.js"

2. **Upload Backend Code:**
   ```bash
   # On your local machine, create a deployment package
   cd PrimeForm/Backend
   tar -czf backend-deploy.tar.gz \
     --exclude='node_modules' \
     --exclude='.env' \
     --exclude='*.log' \
     .
   ```

3. **Upload via File Manager:**
   - Upload `backend-deploy.tar.gz` to Hostinger
   - Extract in your Node.js app directory

4. **Install Dependencies:**
   ```bash
   npm install --production
   ```

5. **Set Environment Variables:**
   - In Hostinger Node.js panel, add all environment variables
   - Or create `.env` file in the app directory

6. **Start Application:**
   ```bash
   npm start
   ```
   Or configure Hostinger to auto-start with PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "pure-body-api"
   pm2 save
   pm2 startup
   ```

#### Option B: Using Hostinger VPS (Recommended)

1. **SSH into VPS:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2:**
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone/Upload Code:**
   ```bash
   cd /var/www
   # Upload your backend code here (via SFTP or git)
   ```

5. **Install Dependencies:**
   ```bash
   cd /var/www/PrimeForm/Backend
   npm install --production
   ```

6. **Create .env File:**
   ```bash
   nano .env
   # Paste all environment variables
   ```

7. **Start with PM2:**
   ```bash
   pm2 start server.js --name "pure-body-api"
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

8. **Configure Nginx (Reverse Proxy):**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Enable HTTPS (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Step 3: Verify Backend Deployment

1. **Test Health Endpoint:**
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **Test API:**
   ```bash
   curl https://api.yourdomain.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

3. **Check Logs:**
   ```bash
   pm2 logs pure-body-api
   ```

### Step 4: Update Frontend API URL

Update `PrimeForm/Frontend/PrimeForm/src/config/api.ts`:
```typescript
export const API_BASE_URL = 'https://api.yourdomain.com';
```

---

## Android APK Build & Testing

### Prerequisites
- EAS Build account (free tier available)
- Expo CLI installed: `npm install -g eas-cli`

### Step 1: Configure EAS Build

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure Project:**
   ```bash
   cd PrimeForm/Frontend/PrimeForm
   eas build:configure
   ```

4. **Update `eas.json` (if exists) or create it:**
   ```json
   {
     "cli": {
       "version": ">= 5.0.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "android": {
           "buildType": "apk"
         },
         "distribution": "internal"
       },
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```

### Step 2: Build Android APK

1. **Build Preview APK (for testing):**
   ```bash
   cd PrimeForm/Frontend/PrimeForm
   eas build --platform android --profile preview
   ```

2. **Wait for Build:**
   - Build will be queued on Expo servers
   - You'll get a URL to track progress
   - Download link will be provided when complete

3. **Download & Install:**
   - Download APK to your Android device
   - Enable "Install from unknown sources" in device settings
   - Install the APK
   - Test all features

### Step 3: Test APK

**Test Checklist:**
- [ ] App launches successfully
- [ ] Login/Signup works
- [ ] Push notifications work (register token)
- [ ] Urdu mode works correctly
- [ ] Account switching works
- [ ] All screens load correctly
- [ ] API calls work (update API_BASE_URL first)

---

## Google Play Store Deployment

### Prerequisites
- Google Play Console account ($25 one-time fee)
- App signing key (EAS will handle this)

### Step 1: Prepare App Store Listing

1. **App Information:**
   - App name: "Pure Body"
   - Short description: "AI-powered fitness companion"
   - Full description: (Write compelling description)
   - App icon: `assets/images/PrimeIcon.png`
   - Feature graphic: Create 1024x500 image

2. **Content Rating:**
   - Complete content rating questionnaire
   - Get rating certificate

3. **Privacy Policy:**
   - Create privacy policy page
   - Add URL to Play Console

### Step 2: Build Production AAB

1. **Build Production AAB:**
   ```bash
   cd PrimeForm/Frontend/PrimeForm
   eas build --platform android --profile production
   ```

2. **Download AAB:**
   - Download the `.aab` file from EAS
   - This is the format Play Store requires

### Step 3: Upload to Play Store

1. **Go to Google Play Console:**
   - https://play.google.com/console

2. **Create New App:**
   - Click "Create app"
   - Fill in app details
   - Select default language

3. **Upload AAB:**
   - Go to "Production" → "Create new release"
   - Upload the `.aab` file
   - Add release notes

4. **Complete Store Listing:**
   - Add screenshots (phone, tablet)
   - Add feature graphic
   - Complete app description
   - Add privacy policy URL

5. **Submit for Review:**
   - Review all information
   - Submit app for review
   - Wait 1-3 days for approval

### Step 4: Post-Launch

1. **Monitor Reviews:**
   - Respond to user reviews
   - Fix reported issues

2. **Update App:**
   ```bash
   # After making changes
   eas build --platform android --profile production
   # Upload new AAB to Play Console
   ```

---

## iOS Build & App Store Deployment

### Prerequisites
- Apple Developer Account ($99/year)
- Mac computer (for some steps)

### Step 1: Configure iOS Build

1. **Update `app.json`:**
   ```json
   {
     "ios": {
       "bundleIdentifier": "com.yourcompany.purebody",
       "buildNumber": "1",
       "supportsTablet": true
     }
   }
   ```

2. **Configure EAS:**
   ```bash
   eas build:configure
   ```

### Step 2: Build iOS IPA

1. **Build for Testing:**
   ```bash
   eas build --platform ios --profile preview
   ```

2. **Install via TestFlight:**
   - Build will be uploaded to App Store Connect
   - Add testers in TestFlight
   - Test on iOS devices

### Step 3: Submit to App Store

1. **Create App in App Store Connect:**
   - https://appstoreconnect.apple.com
   - Create new app
   - Fill in app information

2. **Build Production IPA:**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit for Review:**
   - Upload IPA via App Store Connect
   - Complete app information
   - Submit for review
   - Wait 1-7 days for approval

---

## GitHub Push Instructions

### Step 1: Check Current Branch

```bash
cd /Users/faisalhanif/MyProfile/Mern\ Project/PrimeForm
git status
git branch
```

### Step 2: Create/Checkout Branch

```bash
# If branch doesn't exist, create it
git checkout -b AiFunctionality

# If branch exists, switch to it
git checkout AiFunctionality
```

### Step 3: Stage All Changes

```bash
# Add all changes
git add .

# Or add specific files
git add PrimeForm/Backend/
git add PrimeForm/Frontend/
```

### Step 4: Commit Changes

```bash
git commit -m "feat: Add push notifications, daily reminders, and Urdu support

- Added in-app notifications for diet/workout plan creation
- Implemented daily push notification reminders (9 AM & 6 PM)
- Added test endpoint for push notifications
- Verified account-based notification isolation
- Confirmed Urdu transliteration for dynamic content
- Added deployment documentation
- Configured cron jobs for daily reminders"
```

### Step 5: Push to GitHub

```bash
# If branch doesn't exist on remote
git push -u origin AiFunctionality

# If branch already exists
git push origin AiFunctionality
```

### Step 6: Verify Push

1. Go to GitHub repository
2. Check `AiFunctionality` branch
3. Verify all files are pushed

### Alternative: Force Push (if needed)

```bash
# Only if you need to overwrite remote branch
git push -f origin AiFunctionality
```

---

## Quick Reference Commands

### Backend Deployment
```bash
# On Hostinger VPS
cd /var/www/PrimeForm/Backend
npm install --production
pm2 start server.js --name "pure-body-api"
pm2 save
```

### Frontend Build
```bash
# Android APK
cd PrimeForm/Frontend/PrimeForm
eas build --platform android --profile preview

# Android AAB (Play Store)
eas build --platform android --profile production

# iOS IPA
eas build --platform ios --profile production
```

### GitHub Push
```bash
git checkout AiFunctionality
git add .
git commit -m "Your commit message"
git push origin AiFunctionality
```

---

## Important Notes

1. **Environment Variables:** Never commit `.env` files to GitHub
2. **API URLs:** Update frontend API URL before building
3. **Push Notifications:** Require built apps, not Expo Go
4. **Testing:** Always test APK/IPA on physical devices
5. **Credentials:** Keep Expo/Apple/Google credentials secure

---

## Support

If you encounter issues:
1. Check server logs: `pm2 logs pure-body-api`
2. Check build logs on EAS dashboard
3. Verify environment variables are set
4. Check API connectivity

