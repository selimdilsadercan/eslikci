'use client';

// Hook for easier usage
export function useInterstitialAd(callbacks?: {
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: any) => void;
  onAdLoaded?: () => void;
}) {
  // Ads are disabled globally
  const showInterstitial = async () => {
    // Always return true to continue with the action without showing ads
    callbacks?.onAdClosed?.();
    return true;
  };

  return {
    showInterstitial,
    isAdReady: false,
    isLoading: false,
    prepareAd: () => Promise.resolve()
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