import React from "react";
import { View, Platform } from "react-native";
import { AdUnits } from "./adUnits";

// ✅ CRITICAL: Prevent web bundling from importing native modules
// Web builds should never import react-native-google-mobile-ads
let BannerAd: any = null;
let BannerAdSize: any = null;

if (Platform.OS !== 'web') {
  // Native platform only - safe to import
  try {
    const adsModule = require("react-native-google-mobile-ads");
    BannerAd = adsModule.BannerAd;
    BannerAdSize = adsModule.BannerAdSize;
  } catch (error) {
    // Module not available (e.g., in Expo Go)
    console.log("ℹ️ [ADMOB] BannerAd not available (requires EAS build)");
  }
} else {
  // Web platform - log once
  if (__DEV__) {
    console.log("ℹ️ [ADMOB] Web platform detected - BannerAd not available");
  }
}

export function BottomBanner() {
  // Return null if BannerAd is not available (e.g., in Expo Go or web)
  if (!BannerAd || !BannerAdSize) {
    // Log once if module is missing (helps debug in production)
    if (__DEV__) {
      console.log("ℹ️ [ADMOB] BannerAd not available (requires EAS build)");
    } else {
      // In production, log as warning since banner should work
      console.warn("⚠️ [ADMOB] BannerAd module not available in production build");
    }
    return null;
  }

  // ✅ ENHANCED LOGGING: Log banner ad unit ID and environment for debugging
  if (__DEV__) {
    console.log('📱 [ADMOB] === Rendering Banner Ad ===');
    console.log('📱 [ADMOB] Ad unit ID:', AdUnits.banner);
    console.log('📱 [ADMOB] Platform:', Platform.OS);
  }

  return <BannerAd unitId={AdUnits.banner} size={BannerAdSize.BANNER} />;
}

