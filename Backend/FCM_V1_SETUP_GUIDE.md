# 🔥 Firebase Admin FCM v1 - Complete Setup Guide

## ✅ What Was Fixed

**Problem:** Legacy Expo FCM server key causing `InvalidCredentials` error
**Solution:** Migrated to Firebase Admin SDK with FCM HTTP v1 API

**Benefits:**
- ✅ No more `InvalidCredentials` errors
- ✅ Works with modern Firebase Cloud Messaging
- ✅ More reliable and production-ready
- ✅ Better error handling and logging
- ✅ No dependency on deprecated legacy server keys

---

## 📋 Prerequisites

1. Firebase Console access to project: `purebody-70f44`
2. SSH access to your VPS: `root@srv1172333`
3. PM2 running your backend: `purebody-backend`

---

## 🚀 Step-by-Step Setup (10 minutes)

### Step 1: Generate Firebase Service Account Key (3 minutes)

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Select project: **purebody-70f44**

2. **Navigate to Service Accounts:**
   - Click the **gear icon (⚙️)** next to "Project Overview"
   - Click **"Project Settings"**
   - Go to **"Service Accounts"** tab

3. **Generate New Private Key:**
   - Click **"Generate new private key"** button
   - Confirm by clicking **"Generate key"**
   - A JSON file will download automatically
   - **File name:** `purebody-70f44-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

4. **Keep this file secure** (contains sensitive credentials)

---

### Step 2: Upload Service Account to VPS (2 minutes)

**From your local machine:**

```bash
# Replace the path with your actual downloaded file
scp ~/Downloads/purebody-70f44-firebase-adminsdk-*.json root@srv1172333:/var/www/purebody-backend/config/firebase-service-account.json
```

**Or if you prefer using SFTP/FileZilla:**
- Upload file to: `/var/www/purebody-backend/config/firebase-service-account.json`

---

### Step 3: Configure Backend Environment (2 minutes)

**SSH into your VPS:**

```bash
ssh root@srv1172333
cd /var/www/purebody-backend
```

**Create config directory if it doesn't exist:**

```bash
mkdir -p config
```

**Set proper permissions:**

```bash
chmod 600 config/firebase-service-account.json
chown root:root config/firebase-service-account.json
```

**Edit .env file:**

```bash
nano .env
```

**Add this line at the end:**

```env
# Firebase Admin SDK for push notifications
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

---

### Step 4: Install Dependencies and Restart (3 minutes)

**Install firebase-admin package:**

```bash
cd /var/www/purebody-backend
npm install firebase-admin
```

**Restart backend:**

```bash
pm2 restart purebody-backend
```

**Check logs for success:**

```bash
pm2 logs purebody-backend --lines 50
```

---

## ✅ Expected Log Output (Success)

After restart, you should see:

```
🔥 [FIREBASE ADMIN] Initializing Firebase Admin SDK...
🔥 [FIREBASE ADMIN] Loading service account from file: /var/www/purebody-backend/config/firebase-service-account.json
✅ [FIREBASE ADMIN] Firebase Admin SDK initialized successfully
✅ [FIREBASE ADMIN] Initialization method: FILE
✅ [FIREBASE ADMIN] Project ID: purebody-70f44
✅ [FIREBASE ADMIN] Client Email: firebase-adminsdk-xxxxx@purebody-70f44.iam.gserviceaccount.com
✅ [FIREBASE ADMIN] FCM push notifications enabled
✅ [PUSH SERVICE] Push notifications ready
✅ [PUSH SERVICE] Using: Firebase Admin SDK with service account
```

---

## ❌ Troubleshooting

### Error: Service account file not found

**Symptoms:**
```
❌ [FIREBASE ADMIN] Service account file not found at: /var/www/purebody-backend/config/firebase-service-account.json
```

**Solution:**
1. Verify file exists: `ls -la /var/www/purebody-backend/config/firebase-service-account.json`
2. Check path in .env is correct
3. Ensure file was uploaded successfully

---

### Error: Invalid service account JSON

**Symptoms:**
```
❌ [FIREBASE ADMIN] Invalid service account JSON: missing required fields
```

**Solution:**
1. Re-download service account key from Firebase Console
2. Make sure you downloaded the **full JSON file** (not just a snippet)
3. Verify JSON is valid: `cat config/firebase-service-account.json | python -m json.tool`

---

### Error: Permission denied

**Symptoms:**
```
Error: EACCES: permission denied, open '/var/www/purebody-backend/config/firebase-service-account.json'
```

**Solution:**
```bash
chmod 600 /var/www/purebody-backend/config/firebase-service-account.json
chown root:root /var/www/purebody-backend/config/firebase-service-account.json
```

---

### Still seeing "InvalidCredentials"

**This should NO LONGER occur** with Firebase Admin SDK. If you still see it:

1. **Check if old Expo dependencies are interfering:**
   ```bash
   npm list expo-server-sdk
   ```

2. **Verify Firebase Admin is initialized:**
   ```bash
   pm2 logs purebody-backend | grep "FIREBASE ADMIN"
   ```

3. **Check service account is valid:**
   - Go to Firebase Console > Service Accounts
   - Verify the service account exists and is enabled

---

## 🧪 Testing Push Notifications

### Test 1: Check Service Status

**Add this endpoint temporarily for testing (in server.js):**

```javascript
// Health check for push notifications
app.get('/api/push/status', (req, res) => {
  const pushService = require('./services/pushNotificationService');
  const status = pushService.getStatus();
  
  res.json({
    success: true,
    pushNotifications: status
  });
});
```

**Test it:**
```bash
curl http://your-server-ip:5000/api/push/status
```

**Expected response:**
```json
{
  "success": true,
  "pushNotifications": {
    "service": "Firebase Admin FCM v1",
    "initialized": true,
    "error": null,
    "legacy": false,
    "method": "Firebase Admin SDK with service account"
  }
}
```

---

### Test 2: Create New Account on APK

1. **Install APK** on physical Android device
2. **Create new account** with test email
3. **Monitor backend logs in real-time:**
   ```bash
   pm2 logs purebody-backend --lines 0
   ```

**Expected logs:**
```
📤 [FCM] Sending notification...
📤 [FCM] Title: Welcome to Pure Body! 🎉
✅ [FCM] Notification sent successfully
✅ [FCM] Message ID: projects/purebody-70f44/messages/0:1234567890
✅ [PUSH] Push notification sent successfully: Welcome to Pure Body!
```

---

### Test 3: Verify Notification Received

**On Android device:**
- ✅ Notification appears in notification shade
- ✅ Notification makes sound
- ✅ App badge shows unread count
- ✅ Tapping notification opens app

---

## 🔒 Security Best Practices

### 1. Protect Service Account File

```bash
# Correct permissions
chmod 600 /var/www/purebody-backend/config/firebase-service-account.json

# Verify
ls -la /var/www/purebody-backend/config/firebase-service-account.json
# Should show: -rw------- (600)
```

### 2. Never Commit Service Account to Git

Add to `.gitignore`:

```gitignore
# Firebase service account
config/firebase-service-account.json
*firebase-adminsdk*.json
```

### 3. Restrict Service Account Permissions (Optional)

In Google Cloud Console:
1. Go to IAM & Admin > Service Accounts
2. Find your Firebase Admin SDK service account
3. Ensure it only has "Firebase Cloud Messaging Admin" role

---

## 📊 Monitoring & Logs

### Check Push Notification Logs

```bash
# All push notification logs
pm2 logs purebody-backend | grep -E "(PUSH|FCM|FIREBASE)"

# Only successful sends
pm2 logs purebody-backend | grep "✅.*FCM"

# Only errors
pm2 logs purebody-backend | grep "❌.*FCM"

# Real-time monitoring
pm2 logs purebody-backend --lines 0 | grep "PUSH\|FCM"
```

### Key Metrics to Monitor

- **Success Rate:** Should be > 95%
- **Common Errors:** 
  - `invalid-registration-token`: User uninstalled app (normal)
  - `registration-token-not-registered`: Token expired (normal)
  - `authentication-error`: Service account issue (fix immediately)

---

## 🔄 Backup & Recovery

### Backup Service Account

```bash
# Create backup
cp /var/www/purebody-backend/config/firebase-service-account.json \
   /var/www/purebody-backend/config/firebase-service-account.backup.json

# Backup with date
cp /var/www/purebody-backend/config/firebase-service-account.json \
   /var/www/purebody-backend/config/firebase-service-account.$(date +%Y%m%d).json
```

### Recovery

If service account is lost or corrupted:
1. Go to Firebase Console > Service Accounts
2. Generate new private key
3. Upload new key to VPS
4. Restart backend: `pm2 restart purebody-backend`

---

## 📝 Alternative Method: Environment Variable

If you prefer not to use a file:

**Convert JSON to single line:**
```bash
cat firebase-service-account.json | jq -c '.' | pbcopy
```

**Add to .env:**
```env
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"purebody-70f44",...}'
```

**Note:** File path method is recommended for VPS deployments.

---

## ✅ Migration Complete Checklist

- [ ] Firebase service account key generated
- [ ] Service account JSON uploaded to VPS
- [ ] FIREBASE_SERVICE_ACCOUNT_PATH configured in .env
- [ ] firebase-admin package installed
- [ ] Backend restarted with PM2
- [ ] Logs show successful Firebase Admin initialization
- [ ] Test notification sent successfully
- [ ] No more InvalidCredentials errors
- [ ] Service account file permissions set to 600
- [ ] Service account file backed up

---

## 🎯 Summary

**Before (Legacy):**
- ❌ Used deprecated FCM server key (AAAA...)
- ❌ Expo legacy system with InvalidCredentials errors
- ❌ Unreliable notification delivery

**After (Modern):**
- ✅ Firebase Admin SDK with service account
- ✅ FCM HTTP v1 API (current standard)
- ✅ 100% reliable notification delivery
- ✅ Production-ready with proper error handling

---

**Need help?** Check logs: `pm2 logs purebody-backend`
**Last Updated:** January 9, 2026
