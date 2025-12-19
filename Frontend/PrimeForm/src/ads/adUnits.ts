import { Platform } from "react-native";

let TestIds: any = null;

try {
  const adsModule = require("react-native-google-mobile-ads");
  TestIds = adsModule.TestIds;
} catch (error) {
  // Module not available (e.g., in Expo Go)
  console.log("ℹ️ AdMob TestIds not available (requires EAS build)");
  // Provide fallback test IDs (these are standard AdMob test IDs)
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
const useTestAds =
  __DEV__ || process.env.EXPO_PUBLIC_ADS_MODE === "test";

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

