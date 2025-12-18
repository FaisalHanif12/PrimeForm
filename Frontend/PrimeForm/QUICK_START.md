# Quick Start: Build APK for Android

## Fastest Way to Get Your APK

### 1. Install EAS CLI (if not installed)
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Navigate to Project
```bash
cd PrimeForm/Frontend/PrimeForm
```

### 4. Build APK
```bash
npm run build:android:apk
```

Or directly:
```bash
eas build --platform android --profile preview
```

### 5. Wait & Download
- Build takes 10-20 minutes
- You'll get a download link when complete
- Or check: https://expo.dev → Your Project → Builds

### 6. Install on Android
- Transfer APK to your Android device
- Enable "Install from Unknown Sources" in Settings
- Tap the APK file to install

---

## For iOS (Requires Apple Developer Account)

**You need:**
- Apple Developer Account ($99/year)
- Enroll at: https://developer.apple.com

**Then build:**
```bash
npm run build:ios
```

---

## Important Notes

⚠️ **Notification Icon Missing**: Your `app.json` references `./assets/images/notification-icon.png` but this file doesn't exist. 

**Fix before building:**
1. Create a 96x96px PNG icon (white icon on transparent background)
2. Save it as `assets/images/notification-icon.png`
3. Or remove the notification icon reference from `app.json` (line 34)

---

## All Available Build Commands

```bash
# Android APK (for testing)
npm run build:android:apk

# Android AAB (for Play Store)
npm run build:android:aab

# iOS (for testing)
npm run build:ios

# iOS (for App Store)
npm run build:ios:prod

# Both platforms
npm run build:all
```

---

**For detailed information, see BUILD_GUIDE.md**

