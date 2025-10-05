'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Plus, MagnifyingGlass } from '@phosphor-icons/react';
import AddGameModal from '@/components/AddGameModal';
import AdBanner from '@/components/AdBanner';
import Sidebar from '@/components/Sidebar';
import AppBar from '@/components/AppBar';

export default function GamesPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const games = useQuery(api.games.getGames);
  const createGame = useMutation(api.games.createGame);
  
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
  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Sidebar for wide screens */}
      <Sidebar currentPage="games" />
      
      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Main Content */}
        <div className="px-4 py-6 pt-8">
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
        
        {/* Games Grid */}
        {games === undefined ? (
          // Skeleton loading for games
          <div className="grid grid-cols-2 gap-2 mb-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg"
                style={{
                  padding: '20px',
                  height: '120px',
                  boxShadow: '0 0 8px 5px #297dff0a'
                }}
              >
                <div className="flex flex-col justify-center h-full">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
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
          <div className="space-y-6 mb-8">
            {(() => {
              // Group games by category
              const gamesByCategory = games.reduce((acc, game) => {
                const category = game.category || 'Diğer';
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(game);
                return acc;
              }, {} as Record<string, typeof games>);

              return Object.entries(gamesByCategory).map(([category, categoryGames]) => (
                <div key={category}>
                  <h2 className="text-lg font-semibold text-gray-700 mb-3 px-1">
                    {category}
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryGames.map((game) => (
                      <div
                        key={game._id}
                        className="bg-white rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                        style={{
                          padding: '16px',
                          height: '120px',
                          boxShadow: '0 0 8px 5px #297dff0a'
                        }}
                        onClick={() => handleGameSelect(game._id)}
                      >
                        <div className="flex flex-col justify-center items-center text-center h-full">
                          <h3 className="font-medium text-gray-800 text-base leading-tight mb-1">
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
              ));
            })()}
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