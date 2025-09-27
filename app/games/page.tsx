'use client';

import { useRouter } from 'next/navigation';

// Game data
const games = [
  { id: 1, name: 'Monopoly Deal', color: 'bg-blue-50' },
  { id: 2, name: 'Uno', color: 'bg-red-50' },
  { id: 3, name: 'Codenames', color: 'bg-green-50' },
  { id: 4, name: '101 Okey', color: 'bg-yellow-50' },
  { id: 5, name: 'Satranç', color: 'bg-purple-50' },
  { id: 6, name: 'Kendim Oyunum', color: 'bg-pink-50' },
];

export default function GamesPage() {
  const router = useRouter();

  const handleGameSelect = (gameName: string) => {
    router.push(`/create-game?game=${encodeURIComponent(gameName)}`);
  };
  return (
    <>
      {/* Main Content */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Oyunlar</h1>
        
        {/* Games Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow shadow-lg"
              onClick={() => handleGameSelect(game.name)}
            >
              <div className="text-center">
                <h3 className="font-medium text-gray-800">{game.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}