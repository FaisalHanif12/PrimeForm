# Installation Notes

## Required Dependencies

The following package needs to be installed for offline handling:

```bash
npx expo install @react-native-community/netinfo
```

This package is required for:
- Network connectivity detection
- Offline handling for AI generation
- Real-time network status monitoring

## After Installation

Run the app with:
```bash
npx expo start
```

The app will now properly detect offline state and show appropriate error messages.
