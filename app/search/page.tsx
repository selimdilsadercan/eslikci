'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { MagnifyingGlass, ArrowLeft } from '@phosphor-icons/react';

export default function SearchPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const games = useQuery(api.games.getGames);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGames, setFilteredGames] = useState<any[]>([]);

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Filter games based on search query
  useEffect(() => {
    if (!games) return;
    
    if (!searchQuery.trim()) {
      setFilteredGames(games);
    } else {
      const filtered = games.filter(game => 
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredGames(filtered);
    }
  }, [games, searchQuery]);

  // Show loading state while checking authentication
  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleGameSelect = (gameId: string) => {
    router.push(`/create-game?gameId=${gameId}`);
  };

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Search Input with Back Button */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <button
              onClick={handleBackClick}
              className="mr-3 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ne oynamak istiyorsun?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white pl-4 pr-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none border-none text-lg rounded-lg"
                style={{
                  boxShadow: '0 0 8px 5px #297dff0a'
                }}
              />
            </div>
          </div>
        </div>

        {/* Recent Searches or Search Results */}
        {!searchQuery ? (
          // Show recent searches when no search query
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Yakındaki aramalar</h2>
            <div className="space-y-3">
              {games && games.slice(0, 5).map((game) => (
                <div
                  key={game._id}
                  className="flex items-center p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{
                    boxShadow: '0 0 8px 5px #297dff0a'
                  }}
                  onClick={() => handleGameSelect(game._id)}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">
                      {game.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-base">
                      {game.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Oyun • {game.category || 'Diğer'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">+</span>
                    </button>
                    <button className="w-8 h-8 text-gray-400 hover:text-gray-600">
                      <span className="text-lg">×</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : games === undefined ? (
          // Skeleton loading for games
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center p-3 bg-white rounded-lg"
                style={{
                  boxShadow: '0 0 8px 5px #297dff0a'
                }}
              >
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlass size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Sonuç bulunamadı
            </h3>
            <p className="text-gray-500">
              Aradığınız kriterlere uygun oyun bulunamadı
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGames.map((game: any) => (
              <div
                key={game._id}
                className="flex items-center p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{
                  boxShadow: '0 0 8px 5px #297dff0a'
                }}
                onClick={() => handleGameSelect(game._id)}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">
                    {game.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 text-base">
                    {game.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Oyun • {game.category || 'Diğer'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">+</span>
                  </button>
                  <button className="w-8 h-8 text-gray-400 hover:text-gray-600">
                    <span className="text-lg">×</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
