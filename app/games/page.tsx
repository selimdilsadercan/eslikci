'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Plus, MagnifyingGlass, Star, Fire, Sparkle } from '@phosphor-icons/react';
import AddGameModal from '@/components/AddGameModal';
import AdBanner from '@/components/AdBanner';
import Sidebar from '@/components/Sidebar';
import AppBar from '@/components/AppBar';
import Header from '@/components/Header';

export default function GamesPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const games = useQuery(api.games.getGames);
  const createGame = useMutation(api.games.createGame);
  
  // Get user's game history to determine favorites
  const currentUser = useQuery(api.users.getUserByFirebaseId, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const gameSaves = useQuery(api.gameSaves.getGameSaves, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  
  const [showModal, setShowModal] = useState(false);

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

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

  const handleAddGame = async (gameName: string) => {
    try {
      await createGame({
        name: gameName,
        description: '',
        rules: '',
        banner: '',
        settings: {
          gameplay: 'herkes-tek',
          calculationMode: 'NoPoints',
          roundWinner: 'Highest',
          hideTotalColumn: false
        }
      });
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleSearchClick = () => {
    router.push('/search');
  };

  // Get user's favorite games based on play frequency
  const getFavoriteGames = () => {
    if (!gameSaves || !games) return [];
    
    const gamePlayCount = gameSaves.reduce((acc, save) => {
      const gameId = save.gameTemplate;
      acc[gameId] = (acc[gameId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return games
      .filter(game => gamePlayCount[game._id] > 0)
      .sort((a, b) => (gamePlayCount[b._id] || 0) - (gamePlayCount[a._id] || 0))
      .slice(0, 4);
  };

  // Get popular games (most played by all users)
  const getPopularGames = () => {
    if (!games) return [];
    // For now, return first 4 games as popular
    // In a real app, you'd track global play counts
    return games.slice(0, 4);
  };

  // Get games to discover (not played by user)
  const getDiscoverGames = () => {
    if (!games || !gameSaves) return games || [];
    
    const playedGameIds = new Set(gameSaves.map(save => save.gameTemplate));
    return games.filter(game => !playedGameIds.has(game._id)).slice(0, 15);
  };
  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Header for mobile screens */}
      <div className="lg:hidden">
        <Header />
      </div>
      
      {/* Sidebar for wide screens */}
      <Sidebar currentPage="games" />
      
      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6 pt-20 lg:pt-6">
        {/* Search Button */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlass 
              size={20} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <button
              onClick={handleSearchClick}
              className="w-full bg-white rounded-lg border border-gray-200 pl-10 pr-4 py-3 text-left text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              style={{
                boxShadow: '0 0 8px 5px #297dff0a'
              }}
            >
              Oyun ara...
            </button>
          </div>
        </div>
        
        {/* User-Focused Game Sections */}
        {games === undefined ? (
          // Skeleton loading for games
          <div className="space-y-8 mb-8">
            {['Popular Games', 'Your Favorites', 'Discover New'].map((section, index) => (
              <div key={index}>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, gameIndex) => (
                    <div
                      key={gameIndex}
                      className="bg-white rounded-lg"
                      style={{
                        padding: '16px',
                        height: '100px',
                        boxShadow: '0 0 8px 5px #297dff0a'
                      }}
                    >
                      <div className="flex flex-col justify-center h-full">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-20 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Henüz oyun eklenmemiş</h3>
            <p className="text-gray-500 mb-4">İlk oyununuzu ekleyerek başlayın</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
            >
              Oyun Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-8 mb-8">
            {/* Popular Games Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Fire size={20} className="text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-800">Popüler Oyunlar</h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {getPopularGames().map((game) => (
                  <div
                    key={game._id}
                    className="bg-white rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                    style={{
                      padding: '16px',
                      height: '100px',
                      width: '140px',
                      boxShadow: '0 0 8px 5px #297dff0a'
                    }}
                    onClick={() => handleGameSelect(game._id)}
                  >
                    <div className="flex flex-col justify-center items-center text-center h-full">
                      <div className="text-2xl mb-1">{game.emoji || "🎮"}</div>
                      <h3 className="font-medium text-gray-800 text-sm leading-tight mb-1">
                        {game.name}
                      </h3>
                      {game.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {game.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Favorite Games Section */}
            {getFavoriteGames().length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star size={20} className="text-yellow-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Favori Oyunlarınız</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getFavoriteGames().map((game) => (
                    <div
                      key={game._id}
                      className="bg-white rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                      style={{
                        padding: '16px',
                        height: '100px',
                        width: '140px',
                        boxShadow: '0 0 8px 5px #297dff0a'
                      }}
                      onClick={() => handleGameSelect(game._id)}
                    >
                      <div className="flex flex-col justify-center items-center text-center h-full">
                        <div className="text-2xl mb-1">{game.emoji || "🎮"}</div>
                        <h3 className="font-medium text-gray-800 text-sm leading-tight mb-1">
                          {game.name}
                        </h3>
                        {game.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {game.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discover New Games Section */}
            {getDiscoverGames().length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkle size={20} className="text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Yeni Oyunlar Keşfedin</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {getDiscoverGames().map((game) => (
                    <div
                      key={game._id}
                      className="bg-white rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                      style={{
                        padding: '16px',
                        height: '100px',
                        width: '140px',
                        boxShadow: '0 0 8px 5px #297dff0a'
                      }}
                      onClick={() => handleGameSelect(game._id)}
                    >
                      <div className="flex flex-col justify-center items-center text-center h-full">
                        <div className="text-2xl mb-1">{game.emoji || "🎮"}</div>
                        <h3 className="font-medium text-gray-800 text-sm leading-tight mb-1">
                          {game.name}
                        </h3>
                        {game.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {game.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show all games if no specific sections have content */}
            {getFavoriteGames().length === 0 && getDiscoverGames().length === 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkle size={20} className="text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-800">Tüm Oyunlar</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {games?.slice(0, 8).map((game) => (
                    <div
                      key={game._id}
                      className="bg-white rounded-lg cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
                      style={{
                        padding: '16px',
                        height: '100px',
                        width: '140px',
                        boxShadow: '0 0 8px 5px #297dff0a'
                      }}
                      onClick={() => handleGameSelect(game._id)}
                    >
                      <div className="flex flex-col justify-center items-center text-center h-full">
                        <div className="text-2xl mb-1">{game.emoji || "🎮"}</div>
                        <h3 className="font-medium text-gray-800 text-sm leading-tight mb-1">
                          {game.name}
                        </h3>
                        {game.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {game.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Banner Ad */}
        <AdBanner position="bottom" className="mx-4 mb-4" />
        </div>
      </div>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddGame={handleAddGame}
      />

      {/* AppBar for mobile screens */}
      <div className="lg:hidden">
        <AppBar currentPage="games" />
      </div>
    </div>
  );
}