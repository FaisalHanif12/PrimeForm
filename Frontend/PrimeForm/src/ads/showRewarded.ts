import { Platform } from "react-native";

// ✅ PRODUCTION-READY LOGGING: Works in both dev and production APKs
const REWARDED_AD_DEBUG = process.env.EXPO_PUBLIC_DEBUG_ADS === 'true' || __DEV__;
const log = (...args: any[]) => {
  if (REWARDED_AD_DEBUG || Platform.OS === 'android') {
    console.log('🎬 [REWARDED AD]', ...args);
  }
};

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
    log("✅ AdMob module loaded successfully");
    log("Module exports:", {
      hasRewardedAd: !!RewardedAd,
      hasRewardedAdEventType: !!RewardedAdEventType,
      hasAdEventType: !!AdEventType
    });
  } catch (error) {
    // Module not available (e.g., in Expo Go)
    log("❌ AdMob module not available:", error);
    log("ℹ️ RewardedAd not available (requires EAS build)");
  }
} else {
  // Web platform - log once
  log("ℹ️ Web platform detected - RewardedAd not available");
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
  log("=== showRewardedAd CALLED ===");
  log("Ad Unit ID:", adUnitId);
  log("Callbacks type:", typeof callbacks);
  
  // Check if AdMob module is available
  if (!RewardedAd || !RewardedAdEventType || !AdEventType) {
    const error = new Error(
      "AdMob not available. Please use EAS build or Expo Dev Client."
    );
    log("❌ AdMob modules not available!");
    log("RewardedAd:", !!RewardedAd);
    log("RewardedAdEventType:", !!RewardedAdEventType);
    log("AdEventType:", !!AdEventType);
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

  log("✅ AdMob modules available, proceeding with ad load");
  log("Callbacks:", {
    hasOnEarned: !!onEarned,
    hasOnError: !!onError,
    hasOnClosed: !!onClosed
  });

  // Clean up previous ad if exists
  if (currentAd) {
    log("🧹 Cleaning up previous ad instance");
    try {
      currentAd.removeAllListeners();
    } catch (e) {
      log("⚠️ Error cleaning up previous ad:", e);
    }
  }

  // Create new ad instance
  log("📝 Creating new RewardedAd instance...");
  log("Using Ad Unit ID:", adUnitId);
  currentAd = RewardedAd.createForAdRequest(adUnitId);
  isAdLoaded = false;
  isAdShowing = false;
  log("✅ RewardedAd instance created successfully");

  log("📡 Setting up ad event listeners...");
  
  const unsubLoaded = currentAd.addAdEventListener(AdEventType.LOADED, () => {
    isAdLoaded = true;
    log('✅ EVENT: Ad LOADED successfully');
    log('Current state:', { isAdLoaded, isAdShowing });
    // Only show if not already showing another ad
    if (!isAdShowing) {
      try {
        log('📺 Attempting to show ad...');
        currentAd?.show();
        isAdShowing = true;
        log('✅ Ad show() called successfully');
      } catch (error) {
        log("❌ Error showing rewarded ad:", error);
        console.error("❌ Error showing rewarded ad:", error);
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    } else {
      log('⚠️ Ad already showing, skipping show() call');
    }
  });

  const unsubEarned = currentAd.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    (reward: any) => {
      log('🎉 EVENT: EARNED_REWARD - User watched ad completely!');
      log('Reward details:', reward);
      log('Calling onEarned callback...');
      try {
        onEarned();
        log('✅ onEarned callback executed successfully');
      } catch (error) {
        log('❌ Error in onEarned callback:', error);
      }
    }
  );

  const unsubError = currentAd.addAdEventListener(
    AdEventType.ERROR,
    (error: any) => {
      log("❌ EVENT: ERROR");
      log("Error details:", {
        error,
        message: error?.message,
        code: error?.code,
        domain: error?.domain,
        adUnitId,
        isAdLoaded,
        isAdShowing
      });
      console.error("❌ Rewarded ad ERROR event:", {
        error,
        message: error?.message,
        code: error?.code,
        domain: error?.domain,
        adUnitId
      });
      isAdLoaded = false;
      isAdShowing = false;
      log('Calling onError callback...');
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  );

  const unsubClosed = currentAd.addAdEventListener(AdEventType.CLOSED, () => {
    log('🔒 EVENT: Ad CLOSED');
    log('Final state:', { isAdLoaded, isAdShowing });
    isAdLoaded = false;
    isAdShowing = false;
    // Clean up current ad
    if (currentAd) {
      try {
        log('🧹 Cleaning up ad listeners...');
        currentAd.removeAllListeners();
        log('✅ Listeners removed');
      } catch (e) {
        log('⚠️ Error removing listeners:', e);
      }
      currentAd = null;
    }
    log('Calling onClosed callback...');
    onClosed?.();
  });

  log("✅ Event listeners set up successfully");
  log("📥 Starting ad load request...");
  
  // Start loading the ad
  try {
    currentAd.load();
    log("✅ Ad load() called successfully - waiting for LOADED event...");
  } catch (error) {
    log("❌ Error calling load():", error);
    console.error("❌ Error calling load():", error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }

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

