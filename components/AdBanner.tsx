'use client';

interface AdBannerProps {
  position?: 'top' | 'bottom';
  className?: string;
}

export default function AdBanner({ position = 'bottom', className = '' }: AdBannerProps) {
  // Ads are disabled globally
  return null;
}
