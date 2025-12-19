import React from "react";
import { View } from "react-native";
import { AdUnits } from "./adUnits";

// Safely import BannerAd - will be null if module not available
let BannerAd: any = null;
let BannerAdSize: any = null;

try {
  const adsModule = require("react-native-google-mobile-ads");
  BannerAd = adsModule.BannerAd;
  BannerAdSize = adsModule.BannerAdSize;
} catch (error) {
  // Module not available (e.g., in Expo Go)
  console.log("ℹ️ AdMob BannerAd not available (requires EAS build)");
}

export function BottomBanner() {
  // Return null if BannerAd is not available (e.g., in Expo Go)
  if (!BannerAd || !BannerAdSize) {
    return null;
  }

  return <BannerAd unitId={AdUnits.banner} size={BannerAdSize.BANNER} />;
}

