# Gradle Build Error Fix Guide

If you're experiencing "Gradle build failed with unknown error" repeatedly, try these solutions:

## Quick Fixes

### 1. Clean Build Cache
```bash
# Clear EAS build cache
eas build:configure --clear-cache

# Or rebuild from scratch
eas build --platform android --profile preview --clear-cache
```

### 2. Update EAS CLI
```bash
npm install -g eas-cli@latest
```

### 3. Check Build Logs
Visit the build URL provided in the terminal to see detailed error logs:
- Look for specific error messages in the "Run gradlew" phase
- Common issues: Out of memory, dependency conflicts, version mismatches

### 4. Increase Build Resources
The `eas.json` has been updated with:
- Increased Gradle memory (`GRADLE_OPTS: -Xmx4096m`)
- Latest build image for better compatibility

### 5. Common Issues and Solutions

**Out of Memory:**
- Already fixed in `eas.json` with increased memory allocation
- If still failing, try building during off-peak hours

**Dependency Conflicts:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Version Conflicts:**
- Check if all dependencies are compatible with React Native 0.81.4
- Update Expo SDK if needed: `npx expo install --fix`

### 6. Alternative: Build Locally (Advanced)
If EAS builds keep failing, you can build locally:
```bash
# Install Android Studio and set up Android SDK
# Then build locally
npx expo run:android
```

## Still Having Issues?

1. Check the full build logs at the URL provided
2. Look for specific error messages (not just "unknown error")
3. Try building with `--no-wait` flag to see logs immediately:
   ```bash
   eas build --platform android --profile preview --no-wait
   ```

## Prevention

- Keep dependencies updated regularly
- Use `npx expo install --fix` to ensure compatibility
- Monitor build logs for warnings that might become errors

