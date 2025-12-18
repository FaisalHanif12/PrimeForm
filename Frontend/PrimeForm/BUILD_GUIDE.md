# Build Guide for PrimeForm App

This guide will help you create APK files for Android and understand the requirements for iOS builds.

## Prerequisites

### For Both Platforms:
1. **Expo Account**: Sign up at [expo.dev](https://expo.dev) if you haven't already
2. **EAS CLI**: Install the Expo Application Services CLI globally
   ```bash
   npm install -g eas-cli
   ```
3. **Login to EAS**:
   ```bash
   eas login
   ```

---

## Android APK Build

### Quick Start (APK for Testing)

1. **Navigate to the Frontend directory**:
   ```bash
   cd PrimeForm/Frontend/PrimeForm
   ```

2. **Build APK for testing (Preview build)**:
   ```bash
   eas build --platform android --profile preview
   ```
   This creates an APK that can be installed directly on Android devices.

3. **Build APK for development**:
   ```bash
   eas build --platform android --profile development
   ```
   This creates a development build with debugging capabilities.

4. **Download the APK**:
   - After the build completes, EAS will provide a download link
   - You can also download it from [expo.dev](https://expo.dev) → Your Project → Builds
   - Share the APK file with testers or install it directly on Android devices

### Android Build Types

- **APK (Preview)**: For testing and internal distribution
  - File size: Larger (~50-100MB)
  - Can be installed directly on devices
  - Good for beta testing

- **AAB (Production)**: For Google Play Store submission
  - File size: Smaller (~30-50MB)
  - Required format for Play Store
  - Google optimizes the download for each device

### Android Requirements

✅ **No special requirements needed!** 
- EAS handles all certificates and signing automatically
- You can build APKs immediately after setting up EAS

---

## iOS Build Requirements

### Prerequisites for iOS:

1. **Apple Developer Account** ($99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)
   - Required for any iOS builds (even testing)

2. **Apple Developer Program Membership**
   - Enroll in the Apple Developer Program
   - This is mandatory for iOS app distribution

3. **EAS will handle certificates automatically**, but you need:
   - Valid Apple Developer account credentials
   - Access to your Apple Developer account

### Building for iOS

1. **Configure Apple Developer credentials** (first time only):
   ```bash
   eas build:configure
   ```
   This will prompt you to enter your Apple Developer account details.

2. **Build iOS app for testing**:
   ```bash
   eas build --platform ios --profile preview
   ```
   This creates an IPA file for TestFlight or ad-hoc distribution.

3. **Build iOS app for production**:
   ```bash
   eas build --platform ios --profile production
   ```
   This creates an IPA file for App Store submission.

### iOS Distribution Options

1. **TestFlight** (Recommended for testing):
   - Upload to App Store Connect
   - Share with up to 10,000 testers
   - No need to manually install on devices

2. **Ad-Hoc Distribution**:
   - Install directly on registered devices (up to 100 devices)
   - Requires device UDIDs to be registered

3. **App Store**:
   - For public release
   - Requires App Store review process

---

## Build Profiles Explained

Your `eas.json` has three profiles:

### 1. Development
- **Android**: APK with debugging enabled
- **iOS**: Development build with debugging
- **Use case**: Development and testing with Expo Dev Client

### 2. Preview
- **Android**: APK for internal testing
- **iOS**: IPA for TestFlight or ad-hoc
- **Use case**: Beta testing, internal distribution

### 3. Production
- **Android**: AAB for Google Play Store
- **iOS**: IPA for App Store
- **Use case**: Public release

---

## Step-by-Step: Building Your First APK

### For Android APK (Testing):

```bash
# 1. Navigate to project
cd PrimeForm/Frontend/PrimeForm

# 2. Install dependencies (if not done)
npm install

# 3. Login to EAS (if not logged in)
eas login

# 4. Build APK
eas build --platform android --profile preview

# 5. Wait for build to complete (10-20 minutes)
# 6. Download APK from the provided link or expo.dev dashboard
```

### Installing APK on Android Device:

1. **Enable Unknown Sources**:
   - Go to Settings → Security → Enable "Install from Unknown Sources"
   - Or Settings → Apps → Special Access → Install Unknown Apps

2. **Transfer APK to device**:
   - Download APK on your computer
   - Transfer to Android device via USB, email, or cloud storage

3. **Install**:
   - Open the APK file on your Android device
   - Tap "Install"
   - Wait for installation to complete

---

## Troubleshooting

### Common Issues:

1. **"EAS CLI not found"**:
   ```bash
   npm install -g eas-cli
   ```

2. **"Not logged in"**:
   ```bash
   eas login
   ```

3. **Build fails with "Missing credentials"**:
   - For Android: Usually auto-handled by EAS
   - For iOS: Run `eas build:configure` and enter Apple Developer credentials

4. **Build takes too long**:
   - First build: 15-30 minutes (normal)
   - Subsequent builds: 10-20 minutes
   - Check build status at expo.dev

5. **APK too large**:
   - This is normal for React Native apps (50-100MB)
   - Production AAB will be smaller and optimized

---

## Cost Information

### EAS Build Pricing:
- **Free Tier**: 
  - 30 builds/month
  - Perfect for development and testing
  
- **Production Tier**: 
  - $29/month
  - Unlimited builds
  - Priority support

### Platform Costs:
- **Android**: Free (Google Play one-time $25 registration fee)
- **iOS**: $99/year (Apple Developer Program - required)

---

## Next Steps After Building

### For Android:
1. Test the APK on multiple devices
2. For production: Build AAB and submit to Google Play Store
3. Set up Google Play Console account ($25 one-time fee)

### For iOS:
1. Test via TestFlight
2. Submit to App Store Connect
3. Complete App Store review process

---

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Build Guide](https://docs.expo.dev/build/android/)
- [iOS Build Guide](https://docs.expo.dev/build/ios/)
- [Expo Discord Community](https://chat.expo.dev/)

---

## Quick Reference Commands

```bash
# Login to EAS
eas login

# Build Android APK (testing)
eas build --platform android --profile preview

# Build Android AAB (production)
eas build --platform android --profile production

# Build iOS (requires Apple Developer account)
eas build --platform ios --profile preview

# Check build status
eas build:list

# View build details
eas build:view

# Configure credentials
eas build:configure
```

---

**Note**: Make sure your app icon and notification icon exist before building. The notification icon referenced in `app.json` should be created if it doesn't exist.

