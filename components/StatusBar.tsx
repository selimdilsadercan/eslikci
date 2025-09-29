'use client';

import { useEffect, useState } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';

interface StatusBarProps {
  backgroundColor?: string;
  style?: Style | 'light' | 'dark';
  overlay?: boolean;
}

const StatusBarComponent: React.FC<StatusBarProps> = ({
  backgroundColor = '#ffffff',
  style = 'dark',
  overlay = false
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Check if we're in a mobile environment
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
      
      // Check if Capacitor is available
      const isCapacitorAvailable = typeof window !== 'undefined' && 
        (window as any).Capacitor && 
        (window as any).Capacitor.isNativePlatform();
      setIsCapacitor(isCapacitorAvailable);
    };

    checkMobile();
  }, []);

  useEffect(() => {
    if (!isMobile || !isCapacitor) return;

    const configureStatusBar = async () => {
      try {
        // Set status bar background color
        await StatusBar.setBackgroundColor({ color: backgroundColor });
        
        // Set status bar style (light/dark content)
        const statusBarStyle = typeof style === 'string' 
          ? (style === 'dark' ? Style.Dark : Style.Light)
          : style;
        await StatusBar.setStyle({ style: statusBarStyle });
        
        // Set overlay mode
        await StatusBar.setOverlaysWebView({ overlay });
        
        // Show status bar if hidden
        await StatusBar.show();
      } catch (error) {
        console.warn('StatusBar configuration failed:', error);
      }
    };

    configureStatusBar();
  }, [backgroundColor, style, overlay, isMobile, isCapacitor]);

  // Only render on native platforms, no simulation for web/desktop
  return null;
};

export default StatusBarComponent;
