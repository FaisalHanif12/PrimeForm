import { Platform } from "react-native";

// ✅ CRITICAL: Prevent web bundling from importing native modules
// Web builds should never import react-native-google-mobile-ads
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;

if (Platform.OS !== 'web') {
  // Native platform only - safe to import
  try {
    const adsModule = require("react-native-google-mobile-ads");
    RewardedAd = adsModule.RewardedAd;
    RewardedAdEventType = adsModule.RewardedAdEventType;
    AdEventType = adsModule.AdEventType;
  } catch (error) {
    // Module not available (e.g., in Expo Go)
    console.log("ℹ️ [ADMOB] RewardedAd not available (requires EAS build)");
  }
} else {
  // Web platform - log once
  if (__DEV__) {
    console.log("ℹ️ [ADMOB] Web platform detected - RewardedAd not available");
  }
}

interface RewardedAdCallbacks {
  onEarned: () => void;
  onError?: (error: Error) => void;
  onClosed?: () => void;
}

let currentAd: any = null;
let isAdLoaded = false;
let isAdShowing = false;

export function showRewardedAd(
  adUnitId: string,
  callbacks: RewardedAdCallbacks | (() => void)
) {
  // Check if AdMob module is available
  if (!RewardedAd || !RewardedAdEventType || !AdEventType) {
    const error = new Error(
      "AdMob not available. Please use EAS build or Expo Dev Client."
    );
    console.warn("⚠️", error.message);
    
    // Handle both old signature (onEarned callback) and new signature (callbacks object)
    const { onError } =
      typeof callbacks === "function"
        ? { onError: undefined }
        : callbacks;
    
    onError?.(error);
    return () => {}; // Return no-op cleanup function
  }

  // Handle both old signature (onEarned callback) and new signature (callbacks object)
  const { onEarned, onError, onClosed } =
    typeof callbacks === "function"
      ? { onEarned: callbacks, onError: undefined, onClosed: undefined }
      : callbacks;

  // Clean up previous ad if exists
  if (currentAd) {
    try {
      currentAd.removeAllListeners();
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Create new ad instance
  currentAd = RewardedAd.createForAdRequest(adUnitId);
  isAdLoaded = false;
  isAdShowing = false;

  // ✅ ENHANCED LOGGING: Log ad unit ID and environment for debugging
  if (__DEV__) {
    console.log('📱 [ADMOB] === Loading Rewarded Ad ===');
    console.log('📱 [ADMOB] Ad unit ID:', adUnitId);
    console.log('📱 [ADMOB] Platform:', Platform.OS);
    console.log('📱 [ADMOB] Module available:', !!RewardedAd);
  }

  const unsubLoaded = currentAd.addAdEventListener(AdEventType.LOADED, () => {
    isAdLoaded = true;
    console.log('✅ Rewarded ad LOADED successfully');
    // Only show if not already showing another ad
    if (!isAdShowing) {
      try {
        currentAd?.show();
        isAdShowing = true;
        console.log('📺 Rewarded ad OPENED');
      } catch (error) {
        console.error("❌ Error showing rewarded ad:", error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });

  const unsubEarned = currentAd.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    () => {
      console.log('🎉 Rewarded ad EARNED_REWARD - user watched ad');
      onEarned();
    }
  );

  const unsubError = currentAd.addAdEventListener(
    AdEventType.ERROR,
    (error: any) => {
      console.error("❌ Rewarded ad ERROR event:", {
        error,
        message: error?.message,
        code: error?.code,
        domain: error?.domain,
        adUnitId
      });
      isAdLoaded = false;
      isAdShowing = false;
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );

  const unsubClosed = currentAd.addAdEventListener(AdEventType.CLOSED, () => {
    console.log('🔒 Rewarded ad CLOSED');
    isAdLoaded = false;
    isAdShowing = false;
    // Clean up current ad
    if (currentAd) {
      try {
        currentAd.removeAllListeners();
      } catch (e) {
        // Ignore cleanup errors
      }
      currentAd = null;
    }
    onClosed?.();
  });

  // Start loading the ad
  currentAd.load();

  // Return cleanup function
  return () => {
    try {
      unsubLoaded();
      unsubEarned();
      unsubError();
      unsubClosed();
      if (currentAd) {
        currentAd.removeAllListeners();
        currentAd = null;
      }
      isAdLoaded = false;
      isAdShowing = false;
    } catch (e) {
      // Ignore cleanup errors
    }
  };
}

