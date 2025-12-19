// Safely import AdMob modules - will be null if module not available
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;

try {
  const adsModule = require("react-native-google-mobile-ads");
  RewardedAd = adsModule.RewardedAd;
  RewardedAdEventType = adsModule.RewardedAdEventType;
  AdEventType = adsModule.AdEventType;
} catch (error) {
  // Module not available (e.g., in Expo Go)
  console.log("ℹ️ AdMob RewardedAd not available (requires EAS build)");
}

interface RewardedAdCallbacks {
  onEarned: () => void;
  onError?: (error: Error) => void;
  onClosed?: () => void;
}

let currentAd: RewardedAd | null = null;
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

  const unsubLoaded = currentAd.addAdEventListener(AdEventType.LOADED, () => {
    isAdLoaded = true;
    // Only show if not already showing another ad
    if (!isAdShowing) {
      try {
        currentAd?.show();
        isAdShowing = true;
      } catch (error) {
        console.error("Error showing rewarded ad:", error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });

  const unsubEarned = currentAd.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    () => {
      onEarned();
    }
  );

  const unsubError = currentAd.addAdEventListener(
    AdEventType.ERROR,
    (error) => {
      console.error("Rewarded ad error:", error);
      isAdLoaded = false;
      isAdShowing = false;
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );

  const unsubClosed = currentAd.addAdEventListener(AdEventType.CLOSED, () => {
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

