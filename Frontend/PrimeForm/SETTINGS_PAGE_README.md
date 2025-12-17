# Pure Body Settings Page

## Overview
The settings page provides users with comprehensive control over their notification preferences and access to software update information. It's accessible through the sidebar menu by clicking the "Settings" button.

## Features

### 1. Notification Preferences
Users can control various notification types:
- **Push Notifications**: Master toggle for all notifications
- **Workout Reminders**: Get reminded about workout schedules
- **Diet Reminders**: Get reminded about meal times and nutrition
- **Progress Updates**: Get notified about fitness progress
- **Software Updates**: Get notified about app updates

### 2. Software Updates
- **Current Version**: Shows Pure Body v1.0.0
- **Update Status**: Displays available updates with version, size, and release date
- **Update Button**: Allows users to download and install updates
- **App Store Link**: Direct access to app store for manual updates

### 3. App Information
- **App Name**: Pure Body
- **Version**: 1.0.0
- **Build**: 2024.01.001
- **Platform**: iOS/Android detection
- **Language**: Current language setting (English/اردو)

## Navigation
- **Access**: Click the profile icon → Sidebar → Settings
- **Back Navigation**: Use the back arrow in the header
- **Integration**: Seamlessly integrated with existing dashboard navigation

## Technical Implementation

### File Structure
```
Frontend/PrimeForm/app/(dashboard)/settings.tsx
```

### Dependencies
- React Native components
- Expo Router for navigation
- Ionicons for icons
- Context providers for language and toast notifications

### State Management
- Local state for notification preferences
- Local state for software update information
- Integration with existing context providers

### Styling
- Consistent with Pure Body design system
- Dark theme with gold accents
- Responsive layout for different screen sizes

## Future Enhancements
- Persistent storage of notification preferences
- Real-time software update checking
- Push notification implementation
- User preference synchronization across devices

## Usage Instructions
1. Open the Pure Body app
2. Click on your profile icon
3. Select "Settings" from the sidebar menu
4. Adjust notification preferences using the toggle switches
5. Check for software updates
6. View app information and version details

## Version Information
- **Pure Body Version**: 1.0.0
- **Build Date**: January 2024
- **Platform Support**: iOS and Android
- **Language Support**: English and Urdu (اردو)
