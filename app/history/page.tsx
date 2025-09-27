'use client';

import { Trash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

// Sample game history data
const gameHistory = [
  {
    id: 1,
    gameName: '101 Okey',
    date: '27 September Saturday, 11:11',
    players: ['Murat', 'Arda', 'Emel']
  },
  {
    id: 2,
    gameName: 'Uno',
    date: '27 September Saturday, 11:11',
    players: ['Yiğit', 'Betül']
  },
  {
    id: 3,
    gameName: 'Monopoly Deal',
    date: '26 September Friday, 20:30',
    players: ['Murat', 'Arda', 'Emel', 'Yiğit']
  }
];

export default function HistoryPage() {
  const router = useRouter();

  const handleDelete = (id: number) => {
    // TODO: Implement delete functionality
    console.log('Delete game history:', id);
  };

  const handleGameClick = (gameName: string) => {
    // Navigate to game session
    router.push('/game-session');
  };

  return (
    <>
      {/* Main Content */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Oyun Geçmişi</h1>
        
        {/* Game History List */}
        <div className="space-y-4">
          {gameHistory.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-lg p-4 flex items-center justify-between shadow-lg"
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => handleGameClick(game.gameName)}
              >
                <h3 className="font-medium text-gray-800 text-lg hover:text-blue-600 transition-colors">{game.gameName}</h3>
                <p className="text-gray-600 text-sm">{game.date}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Oyuncular: {game.players.join(', ')}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(game.id);
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
