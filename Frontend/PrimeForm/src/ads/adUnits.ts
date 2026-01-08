import { Platform } from "react-native";

// ✅ CRITICAL: Prevent web bundling from importing native modules
// Web builds should never import react-native-google-mobile-ads
let TestIds: any = null;

if (Platform.OS !== 'web') {
  // Native platform (iOS/Android) - safe to import
  try {
    const adsModule = require("react-native-google-mobile-ads");
    TestIds = adsModule.TestIds;
  } catch (error) {
    // Module not available (e.g., in Expo Go)
    console.log("ℹ️ [ADMOB] TestIds not available (requires EAS build)");
  }
}

// Provide fallback test IDs (these are standard AdMob test IDs)
if (!TestIds) {
  TestIds = {
    BANNER: "ca-app-pub-3940256099942544/6300978111",
    REWARDED: "ca-app-pub-3940256099942544/5224354917",
  };
}

// ✅ PRODUCTION READY: Only use test ads in development or if explicitly set to test mode
// In production builds (EAS production), __DEV__ is false, so production ads will be used
// Test ads are only used if:
// 1. Running in development mode (__DEV__ === true), OR
// 2. EXPO_PUBLIC_ADS_MODE environment variable is explicitly set to "test"
// 
// IMPORTANT: For production builds, ensure EXPO_PUBLIC_ADS_MODE is NOT set to "test"
// Production ad unit IDs are configured below and will be used automatically in production

// ✅ PRODUCTION LOGGING: Always log ad mode configuration for debugging
const adsMode = process.env.EXPO_PUBLIC_ADS_MODE;
const useTestAds = __DEV__ || adsMode === "test";

console.log('📱 [ADMOB INIT] === Ad Configuration ===');
console.log('📱 [ADMOB INIT] Platform:', Platform.OS);
console.log('📱 [ADMOB INIT] __DEV__:', __DEV__);
console.log('📱 [ADMOB INIT] EXPO_PUBLIC_ADS_MODE:', adsMode || '(not set)');
console.log('📱 [ADMOB INIT] Using test ads:', useTestAds);
console.log('📱 [ADMOB INIT] TestIds module available:', Platform.OS === 'web' ? false : !!TestIds);
console.log('📱 [ADMOB INIT] Expected behavior:', useTestAds ? 'SHOW TEST ADS' : 'SHOW PRODUCTION ADS');

// ✅ VALIDATION: Warn if production mode but test ads are being used
if (!__DEV__ && adsMode === "test") {
  console.warn('⚠️ [ADMOB INIT] WARNING: Production build but EXPO_PUBLIC_ADS_MODE=test is set!');
  console.warn('⚠️ [ADMOB INIT] Test ads will be shown instead of production ads.');
}

// ✅ PRODUCTION AD UNIT IDs - These will be used in production builds
// App ID: ca-app-pub-9758721846971674 (configured in app.json)
const PROD = {
  android: {
    banner: "ca-app-pub-9758721846971674/1086556155",
    rewardedTrainer: "ca-app-pub-9758721846971674/3729031365",
    rewardedDiet: "ca-app-pub-9758721846971674/4753520182",
    rewardedWorkout: "ca-app-pub-9758721846971674/9953875976",
  },
  ios: {
    banner: "ca-app-pub-9758721846971674/8681975143",
    rewardedTrainer: "ca-app-pub-9758721846971674/7169776444",
    rewardedDiet: "ca-app-pub-9758721846971674/7345036266",
    rewardedWorkout: "ca-app-pub-9758721846971674/5864240113",
  },
};

const TEST = {
  banner: TestIds?.BANNER || "ca-app-pub-3940256099942544/6300978111",
  rewarded: TestIds?.REWARDED || "ca-app-pub-3940256099942544/5224354917",
};

// ✅ PRODUCTION READY: Exports ad unit IDs based on environment
// - In production builds: Uses PROD ad unit IDs (real ads, will generate revenue)
// - In development: Uses TEST ad unit IDs (Google's test ads, no revenue)
// - Platform-specific: Different ad units for Android and iOS
// - Web platform: Uses test IDs (ads won't work on web anyway)
export const AdUnits = {
  banner: useTestAds
    ? TEST.banner
    : Platform.OS === "android"
      ? PROD.android.banner
      : PROD.ios.banner,

  rewardedTrainer: useTestAds
    ? TEST.rewarded
    : Platform.OS === "android"
      ? PROD.android.rewardedTrainer
      : PROD.ios.rewardedTrainer,

  rewardedDiet: useTestAds
    ? TEST.rewarded
    : Platform.OS === "android"
      ? PROD.android.rewardedDiet
      : PROD.ios.rewardedDiet,

  rewardedWorkout: useTestAds
    ? TEST.rewarded
    : Platform.OS === "android"
      ? PROD.android.rewardedWorkout
      : PROD.ios.rewardedWorkout,
};

// ✅ PRODUCTION LOGGING: Always log selected ad unit IDs for debugging
console.log('📱 [ADMOB INIT] Selected ad unit IDs:');
console.log('📱 [ADMOB INIT]   Banner:', AdUnits.banner);
console.log('📱 [ADMOB INIT]   Rewarded Trainer:', AdUnits.rewardedTrainer);
console.log('📱 [ADMOB INIT]   Rewarded Diet:', AdUnits.rewardedDiet);
console.log('📱 [ADMOB INIT]   Rewarded Workout:', AdUnits.rewardedWorkout);
console.log('📱 [ADMOB INIT] ====================================');
