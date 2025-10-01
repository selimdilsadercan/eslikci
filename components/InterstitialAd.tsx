'use client';

import { useEffect, useState } from 'react';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Hook for easier usage
export function useInterstitialAd(callbacks?: {
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: any) => void;
  onAdLoaded?: () => void;
}) {
  const [isAdReady, setIsAdReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializeAd();
    }
  }, []);

  const initializeAd = async () => {
    try {
      setIsLoading(true);
      
      // Initialize AdMob if not already initialized
      await AdMob.initialize({
        testingDevices: [], // Empty array for production
        initializeForTesting: false, // Set to false for production
      });

      // Prepare interstitial ad
      await AdMob.prepareInterstitial({
        adId: 'interstitial', // This will use the interstitial ID from capacitor.config.ts
        isTesting: true, // Use test ads for interstitials to prevent crashes
      });

      setIsAdReady(true);
      callbacks?.onAdLoaded?.();
    } catch (error) {
      console.error('AdMob interstitial error:', error);
      callbacks?.onAdFailedToLoad?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const showInterstitial = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Show placeholder for web development
      console.log('Interstitial Ad (Web Preview) - Would show full-screen ad');
      callbacks?.onAdClosed?.();
      return true;
    }
    
    if (!isAdReady) {
      console.log('Ad not ready');
      return false;
    }

    try {
      await AdMob.showInterstitial();
      
      // Call onAdClosed callback after a short delay
      setTimeout(() => {
        callbacks?.onAdClosed?.();
        // Prepare next ad
        initializeAd();
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error showing interstitial:', error);
      callbacks?.onAdFailedToLoad?.(error);
      return false;
    }
  };

  return {
    showInterstitial,
    isAdReady,
    isLoading,
    prepareAd: initializeAd
  };
}

// Legacy component export for backward compatibility
export default function InterstitialAd({ 
  onAdClosed, 
  onAdFailedToLoad, 
  onAdLoaded 
}: {
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: any) => void;
  onAdLoaded?: () => void;
}) {
  return useInterstitialAd({
    onAdClosed,
    onAdFailedToLoad,
    onAdLoaded
  });
}