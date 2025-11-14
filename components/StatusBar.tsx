"use client";

import { useEffect, useState } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";

interface StatusBarProps {
  backgroundColor?: string;
  style?: Style | "light" | "dark";
  overlay?: boolean;
}

const StatusBarComponent: React.FC<StatusBarProps> = ({
  backgroundColor,
  style,
  overlay = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if we're in a mobile environment
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      setIsMobile(isMobileDevice);

      // Check if Capacitor is available
      const isCapacitorAvailable =
        typeof window !== "undefined" &&
        (window as any).Capacitor &&
        (window as any).Capacitor.isNativePlatform();
      setIsCapacitor(isCapacitorAvailable);
    };

    // Check dark mode preference
    const checkDarkMode = () => {
      if (typeof window !== "undefined") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setIsDarkMode(prefersDark);
      }
    };

    checkMobile();
    checkDarkMode();

    // Listen for dark mode changes
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  useEffect(() => {
    if (!isMobile || !isCapacitor) return;

    const configureStatusBar = async () => {
      try {
        // Use provided backgroundColor or get from CSS variable
        const bgColor = backgroundColor || (() => {
          if (typeof window !== "undefined") {
            const computedStyle = getComputedStyle(document.documentElement);
            return computedStyle.getPropertyValue("--background").trim() || (isDarkMode ? "#03000A" : "#ffffff");
          }
          return isDarkMode ? "#03000A" : "#ffffff";
        })();

        // Set status bar background color
        await StatusBar.setBackgroundColor({ color: bgColor });

        // Set status bar style (light/dark content)
        // In dark mode, use light content; in light mode, use dark content
        const statusBarStyle = style
          ? typeof style === "string"
            ? style === "dark"
              ? Style.Dark
              : Style.Light
            : style
          : isDarkMode
            ? Style.Light
            : Style.Dark;
        await StatusBar.setStyle({ style: statusBarStyle });

        // Set overlay mode
        await StatusBar.setOverlaysWebView({ overlay });

        // Show status bar if hidden
        await StatusBar.show();
      } catch (error) {
        console.warn("StatusBar configuration failed:", error);
      }
    };

    configureStatusBar();
  }, [backgroundColor, style, overlay, isMobile, isCapacitor, isDarkMode]);

  // Only render on native platforms, no simulation for web/desktop
  return null;
};

export default StatusBarComponent;
