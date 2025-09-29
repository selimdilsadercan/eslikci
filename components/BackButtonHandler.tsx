"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';

// Extend Window interface to include Capacitor
declare global {
  interface Window {
    Capacitor?: any;
  }
}

export default function BackButtonHandler() {
  const router = useRouter();
  const backButtonListenerRef = useRef<any>(null);

  useEffect(() => {
    const initializeBackButton = async () => {
      // Only run on mobile platforms with Capacitor
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
          // Remove existing listener if any
          if (backButtonListenerRef.current) {
            backButtonListenerRef.current.remove();
          }

          // Add back button listener
          backButtonListenerRef.current = await App.addListener('backButton', ({ canGoBack }) => {
            console.log('Back button pressed, canGoBack:', canGoBack);
            
            if (canGoBack) {
              // If we can go back in the web view, use browser history
              window.history.back();
            } else {
              // If we can't go back in the web view, handle navigation manually
              const currentPath = window.location.pathname;
              console.log('Current path:', currentPath);
              
              // Define navigation hierarchy based on your app structure
              if (currentPath.startsWith('/game-session/')) {
                // From game session pages, go back to games
                router.push('/games');
              } else if (currentPath.startsWith('/admin/edit-game/')) {
                // From edit game pages, go back to admin
                router.push('/admin');
              } else if (currentPath.startsWith('/create-game')) {
                // From create game page, go back to admin
                router.push('/admin');
              } else if (currentPath === '/profile' || 
                         currentPath === '/games' || 
                         currentPath === '/admin' || 
                         currentPath === '/history' || 
                         currentPath === '/contacts' ||
                         currentPath === '/') {
                // On main pages - do nothing (disable back navigation)
                console.log('Back button disabled on main pages:', currentPath);
                return; // Do nothing, prevent navigation
              } else {
                // For any other page, go to home
                console.log('Navigating to home from:', currentPath);
                router.push('/');
              }
            }
          });
          
          console.log('Back button listener added successfully');
        } catch (error) {
          console.error('Error adding back button listener:', error);
        }
      } else {
        console.log('Back button handler: Not running on native platform');
      }
    };

    // Initialize after a short delay to ensure Capacitor is ready
    const timer = setTimeout(initializeBackButton, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (backButtonListenerRef.current) {
        backButtonListenerRef.current.remove();
        backButtonListenerRef.current = null;
        console.log('Back button listener removed');
      }
    };
  }, [router]);

  // This component doesn't render anything
  return null;
}
