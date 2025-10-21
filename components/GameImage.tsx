'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface GameImageProps {
  game: {
    _id: string;
    name: string;
    emoji?: string;
    imageFile?: Id<'_storage'>;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function GameImage({ game, size = 'md', className = '' }: GameImageProps) {
  const imageUrl = useQuery(api.files.getImageUrl, game.imageFile ? { storageId: game.imageFile } : "skip");

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const emojiSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  // If we have an image file, show the image
  if (game.imageFile && imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={game.name}
        className={`${sizeClasses[size]} object-cover rounded ${className}`}
        onError={(e) => {
          // Fallback to emoji if image fails to load
          e.currentTarget.style.display = 'none';
          const emojiElement = e.currentTarget.nextElementSibling as HTMLElement;
          if (emojiElement) {
            emojiElement.style.display = 'block';
          }
        }}
      />
    );
  }

  // Fallback to emoji
  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center ${emojiSizeClasses[size]} ${className}`}>
      {game.emoji || "🎮"}
    </div>
  );
}
