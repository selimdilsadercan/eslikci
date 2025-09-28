'use client';

import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { useState, useEffect } from 'react';

interface AvatarGeneratorProps {
  name: string;
  gender?: 'male' | 'female' | 'neutral';
  size?: number;
  className?: string;
  onAvatarChange?: (avatarUrl: string) => void;
}

export default function AvatarGenerator({ 
  name, 
  gender = 'neutral',
  size = 80, 
  className = '', 
  onAvatarChange 
}: AvatarGeneratorProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>('');


  const generateAvatarOptions = (gender: 'male' | 'female' | 'neutral') => {
    const baseOptions = {
      size: size,
      backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    };

    // For now, just return base options and let DiceBear handle the randomization
    // The gender detection is more for future enhancement
    return baseOptions;
  };

  useEffect(() => {
    // Generate avatar based on name and selected gender
    const options = generateAvatarOptions(gender);
    
    const avatar = createAvatar(avataaars, {
      seed: name,
      ...options,
    });

    const svgString = avatar.toString();
    // Use encodeURIComponent instead of btoa to handle Unicode characters
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    
    setAvatarUrl(dataUrl);
    onAvatarChange?.(dataUrl);
  }, [name, gender, size, onAvatarChange]);

  const generateNewAvatar = () => {
    // Generate a new random avatar with selected gender
    const options = generateAvatarOptions(gender);
    
    const avatar = createAvatar(avataaars, {
      seed: Math.random().toString(36).substring(7), // Random seed
      ...options,
    });

    const svgString = avatar.toString();
    // Use encodeURIComponent instead of btoa to handle Unicode characters
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    
    setAvatarUrl(dataUrl);
    onAvatarChange?.(dataUrl);
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Avatar for ${name}`}
            className="rounded-full border-2 border-gray-200"
            style={{ width: size, height: size }}
          />
        ) : (
          <div 
            className="rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full animate-spin"></div>
          </div>
        )}
        {avatarUrl && (
          <button
            type="button"
            onClick={generateNewAvatar}
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
            title="Generate new avatar"
          >
            ↻
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 text-center">
        Avatar otomatik oluşturuldu
      </p>
    </div>
  );
}
