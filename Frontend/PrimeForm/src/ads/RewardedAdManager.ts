import { Platform } from "react-native";

// ✅ PRODUCTION-READY LOGGING
const AD_DEBUG = process.env.EXPO_PUBLIC_DEBUG_ADS === 'true' || __DEV__;
const log = (...args: any[]) => {
  if (AD_DEBUG || Platform.OS === 'android') {
    console.log('🎯 [AD MANAGER]', ...args);
  }
};

// ✅ CRITICAL: Prevent web bundling from importing native modules
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;

if (Platform.OS !== 'web') {
  try {
    const adsModule = require("react-native-google-mobile-ads");
    RewardedAd = adsModule.RewardedAd;
    RewardedAdEventType = adsModule.RewardedAdEventType;
    AdEventType = adsModule.AdEventType;
    log("✅ AdMob module loaded successfully");
  } catch (error) {
    log("❌ AdMob module not available:", error);
  }
}

interface AdSlot {
  ad: any | null;
  isLoading: boolean;
  isLoaded: boolean;
  isShowing: boolean;
  listeners: (() => void)[];
  lastLoadTime: number;
}

class RewardedAdManager {
  private ads: Map<string, AdSlot> = new Map();
  private loadRetryCount: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 2000; // 2 seconds between retries

  constructor() {
    log('🎯 RewardedAdManager initialized');
  }

  /**
   * Preload an ad in the background
   * Call this when screen mounts to have ad ready
   */
  public preloadAd(adUnitId: string): void {
    if (Platform.OS === 'web' || !RewardedAd) {
      log('⚠️ Preload skipped - AdMob not available');
      return;
    }

    const slot = this.ads.get(adUnitId);
    
    // Don't reload if already loading or loaded recently (< 5 min ago)
    if (slot?.isLoading || (slot?.isLoaded && Date.now() - slot.lastLoadTime < 300000)) {
      log(`✅ Ad already loaded or loading: ${adUnitId.substring(0, 20)}...`);
      return;
    }

    log(`📥 Preloading ad: ${adUnitId.substring(0, 20)}...`);
    this.loadAd(adUnitId);
  }

  /**
   * Show a preloaded ad
   * Returns immediately if ad not ready (better UX)
   */
  public async showAd(
    adUnitId: string,
    callbacks: {
      onEarned: () => void;
      onError?: (error: Error) => void;
      onClosed?: () => void;
    }
  ): Promise<boolean> {
    log(`📺 Attempting to show ad: ${adUnitId.substring(0, 20)}...`);

    if (Platform.OS === 'web' || !RewardedAd) {
      log('⚠️ AdMob not available - calling onError');
      callbacks.onError?.(new Error('AdMob not available'));
      return false;
    }

    const slot = this.ads.get(adUnitId);

    // If ad not loaded or loading, fail immediately (don't block user)
    if (!slot || !slot.isLoaded || slot.isShowing) {
      log(`❌ Ad not ready. Loaded: ${slot?.isLoaded}, Showing: ${slot?.isShowing}`);
      
      // Start loading for next time
      if (!slot?.isLoading && !slot?.isLoaded) {
        log('📥 Starting background load for next time...');
        this.loadAd(adUnitId);
      }
      
      callbacks.onError?.(new Error('Ad not ready'));
      return false;
    }

    // Ad is ready - show it!
    try {
      log('✅ Ad is ready - showing now!');
      slot.isShowing = true;

      // Set up one-time event listeners for this show
      const unsubEarned = slot.ad.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward: any) => {
          log('🎉 User earned reward:', reward);
          callbacks.onEarned();
        }
      );

      const unsubClosed = slot.ad.addAdEventListener(AdEventType.CLOSED, () => {
        log('🔒 Ad closed');
        slot.isShowing = false;
        slot.isLoaded = false;
        
        // Clean up listeners
        try {
          unsubEarned();
          unsubClosed();
        } catch (e) {
          log('⚠️ Error removing listeners:', e);
        }
        
        // Preload next ad in background
        setTimeout(() => {
          log('📥 Preloading next ad after close...');
          this.loadAd(adUnitId);
        }, 1000);
        
        callbacks.onClosed?.();
      });

      slot.ad.show();
      log('✅ Ad show() called successfully');
      return true;
    } catch (error) {
      log('❌ Error showing ad:', error);
      slot.isShowing = false;
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Check if ad is ready to show
   */
  public isAdReady(adUnitId: string): boolean {
    const slot = this.ads.get(adUnitId);
    return !!(slot?.isLoaded && !slot.isShowing);
  }

  /**
   * Internal: Load an ad
   */
  private loadAd(adUnitId: string): void {
    const retryCount = this.loadRetryCount.get(adUnitId) || 0;

    // Create or get ad slot
    let slot = this.ads.get(adUnitId);
    if (!slot) {
      slot = {
        ad: null,
        isLoading: false,
        isLoaded: false,
        isShowing: false,
        listeners: [],
        lastLoadTime: 0,
      };
      this.ads.set(adUnitId, slot);
    }

    // Clean up old ad if exists
    if (slot.ad) {
      try {
        slot.listeners.forEach(unsub => unsub());
        slot.listeners = [];
        slot.ad.removeAllListeners();
      } catch (e) {
        log('⚠️ Error cleaning up old ad:', e);
      }
    }

    slot.isLoading = true;
    slot.isLoaded = false;

    try {
      log(`📝 Creating ad instance: ${adUnitId.substring(0, 20)}...`);
      slot.ad = RewardedAd.createForAdRequest(adUnitId);

      // Set up load event listener
      const unsubLoaded = slot.ad.addAdEventListener(AdEventType.LOADED, () => {
        log('✅ Ad loaded successfully');
        slot.isLoading = false;
        slot.isLoaded = true;
        slot.lastLoadTime = Date.now();
        this.loadRetryCount.set(adUnitId, 0); // Reset retry count on success
      });

      // Set up error event listener
      const unsubError = slot.ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
        log('❌ Ad load error:', error);
        slot.isLoading = false;
        slot.isLoaded = false;

        // Retry loading if under max retries
        if (retryCount < this.MAX_RETRIES) {
          const nextRetry = retryCount + 1;
          this.loadRetryCount.set(adUnitId, nextRetry);
          log(`🔄 Retrying ad load (${nextRetry}/${this.MAX_RETRIES}) in ${this.RETRY_DELAY}ms...`);
          
          setTimeout(() => {
            this.loadAd(adUnitId);
          }, this.RETRY_DELAY);
        } else {
          log(`❌ Max retries (${this.MAX_RETRIES}) reached - giving up`);
          this.loadRetryCount.set(adUnitId, 0);
        }
      });

      slot.listeners = [unsubLoaded, unsubError];

      // Start loading
      log('📥 Calling ad.load()...');
      slot.ad.load();
    } catch (error) {
      log('❌ Error creating/loading ad:', error);
      slot.isLoading = false;
      slot.isLoaded = false;
    }
  }

  /**
   * Clean up all ads
   */
  public cleanup(): void {
    log('🧹 Cleaning up all ads...');
    this.ads.forEach((slot, adUnitId) => {
      try {
        slot.listeners.forEach(unsub => unsub());
        slot.ad?.removeAllListeners();
      } catch (e) {
        log('⚠️ Error cleaning up ad:', adUnitId, e);
      }
    });
    this.ads.clear();
    this.loadRetryCount.clear();
  }
}

// Singleton instance
export const rewardedAdManager = new RewardedAdManager();
