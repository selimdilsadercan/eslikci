'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Plus } from '@phosphor-icons/react';
import AddGameModal from '@/components/AddGameModal';
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
  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Oyunlar</h1>
        </div>
        
        {/* Games Grid */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {games === undefined ? (
            // Skeleton loading for games
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg"
                style={{
                  padding: '20px',
                  height: '108px',
                  boxShadow: '0 0 8px 5px #297dff0a'
                }}
              >
                <div className="flex items-center justify-center h-full">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              </div>
            ))
          ) : games.length === 0 ? (
            <div className="col-span-2 text-center py-12">
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
            games.map((game) => (
              <div
                key={game._id}
                className="bg-white rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                style={{
                  padding: '20px',
                  height: '108px',
                  boxShadow: '0 0 8px 5px #297dff0a'
                }}
                onClick={() => handleGameSelect(game._id)}
              >
                <div className="flex items-center justify-center h-full">
                  <h3 className="font-medium text-gray-800 text-lg">{game.name}</h3>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddGame={handleAddGame}
      />

      {/* App Bar */}
      <AppBar activePage="games" />
    </div>
  );
}