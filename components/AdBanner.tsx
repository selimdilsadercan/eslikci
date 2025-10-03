'use client';

import { useEffect, useState } from 'react';
import { AdMob } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { usePro } from './ProProvider';

interface AdBannerProps {
  position?: 'top' | 'bottom';
  className?: string;
}

export default function AdBanner({ position = 'bottom', className = '' }: AdBannerProps) {
  const { isPro, isLoading } = usePro();
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);

  // Don't show ads for pro users
  if (isPro || isLoading) {
    return null;
  }

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializeAd();
    }
  }, []);

  const initializeAd = async () => {
    try {
      // Initialize AdMob
      await AdMob.initialize({
        testingDevices: [], // Empty array for production
        initializeForTesting: false, // Set to false for production
      });

      // Show banner ad
      await AdMob.showBanner({
        adId: 'banner', // This will use the banner ID from capacitor.config.ts
        adSize: 'BANNER' as any,
        position: position.toUpperCase() as any,
        margin: 0,
        isTesting: false, // Production banner ads
      });

      setIsAdLoaded(true);
    } catch (error) {
      console.error('AdMob banner error:', error);
      setAdError('Failed to load ad');
    }
  };

  const hideBanner = async () => {
    try {
      await AdMob.hideBanner();
    } catch (error) {
      console.error('Error hiding banner:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (Capacitor.isNativePlatform()) {
        hideBanner();
      }
    };
  }, []);

  // Show placeholder banner on web platform for development
  if (!Capacitor.isNativePlatform()) {
    return (
      <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-center text-white ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Advertisement</span>
          <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
        </div>
        <p className="text-xs mt-1 opacity-80">Banner Ad (Web Preview)</p>
      </div>
    );
  }

  // Show error state
  if (adError) {
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-600">Ad unavailable</p>
      </div>
    );
  }

  // Show loading state
  if (!isAdLoaded) {
    return (
      <div className={`bg-gray-100 border border-gray-300 rounded-lg p-4 text-center ${className}`}>
        <div className="w-full h-16 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  // Ad is loaded and showing
  return null; // The ad is displayed natively, no need to render anything
}
