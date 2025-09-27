'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Plus } from '@phosphor-icons/react';
import AddGameModal from '../../components/AddGameModal';

export default function GamesPage() {
  const router = useRouter();
  const games = useQuery(api.games.getGames) || [];
  const createGame = useMutation(api.games.createGame);
  
  const [showModal, setShowModal] = useState(false);

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
          roundWinner: 'OnePoint',
          hideTotalColumn: false
        }
      });
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };
  return (
    <>
      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Oyunlar</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
            <span>Oyun Ekle</span>
          </button>
        </div>
        
        {/* Games Grid */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {games.map((game) => (
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
          ))}
        </div>
      </div>

      {/* Add Game Modal */}
      <AddGameModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddGame={handleAddGame}
      />
    </>
  );
}