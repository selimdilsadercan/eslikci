'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, Gear } from '@phosphor-icons/react';

// Sample game data
const gameData = {
  gameName: '101 Okey',
  players: [
    { id: 1, name: 'Murat', initial: 'M', avatar: '🧽' },
    { id: 2, name: 'Arda', initial: 'A', avatar: '🧽' }
  ],
  rounds: [
    { round: 1, scores: { 1: 12, 2: 25 } },
    { round: 2, scores: { 1: 200, 2: 150 } }
  ],
  currentRound: 3
};

export default function GameSessionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('puan-tablosu');
  const [currentScores, setCurrentScores] = useState<{[key: number]: number}>({
    1: 0,
    2: 0
  });

  const handleBack = () => {
    router.back();
  };

  const updateScore = (playerId: number, change: number) => {
    setCurrentScores(prev => ({
      ...prev,
      [playerId]: Math.max(0, (prev[playerId] || 0) + change)
    }));
  };

  const endRound = () => {
    // TODO: Save current round scores and move to next round
    console.log('Ending round with scores:', currentScores);
    setCurrentScores({ 1: 0, 2: 0 });
  };

  const getTotalScore = (playerId: number) => {
    const roundScores = gameData.rounds.reduce((total, round) => {
      return total + (round.scores[playerId] || 0);
    }, 0);
    return roundScores + (currentScores[playerId] || 0);
  };

  const getRoundScores = (playerId: number, roundNumber: number) => {
    const round = gameData.rounds.find(r => r.round === roundNumber);
    return round ? (round.scores[playerId] || 0) : 0;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-4">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{gameData.gameName}</h1>
        </div>
        <span className="text-sm text-gray-500">10 minutes ago</span>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white px-4 py-2 border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('puan-tablosu')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'puan-tablosu'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            Puan Tablosu
          </button>
          <button
            onClick={() => setActiveTab('kurallar')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'kurallar'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            Kurallar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {activeTab === 'puan-tablosu' ? (
          <>
            {/* Score Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              {/* Table Header */}
              <div className="bg-gray-50 px-4 py-3 flex">
                <div className="flex-1 font-medium text-gray-700">Oyuncular</div>
                <div className="w-20 text-center font-medium text-gray-700">Toplam</div>
                <div className="w-20 text-center font-medium text-gray-700">2. Tur</div>
                <div className="w-20 text-center font-medium text-gray-700">1. Tur</div>
              </div>

              {/* Player Rows */}
              {gameData.players.map((player) => (
                <div key={player.id} className="px-4 py-3 flex items-center border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center flex-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                    </div>
                    <span className="font-medium text-gray-800">{player.name}</span>
                  </div>
                  <div className="w-20 text-center font-semibold text-gray-800">
                    {getTotalScore(player.id)}
                  </div>
                  <div className="w-20 text-center text-gray-600">
                    {getRoundScores(player.id, 2)}
                  </div>
                  <div className="w-20 text-center text-gray-600">
                    {getRoundScores(player.id, 1)}
                  </div>
                </div>
              ))}
            </div>

            {/* Current Round Score Input */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Mevcut Tur Puanları</h3>
              <div className="space-y-4">
                {gameData.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                      </div>
                      <span className="font-medium text-gray-800">{player.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateScore(player.id, -1)}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <Minus size={16} className="text-gray-600" />
                      </button>
                      <div className="w-16 h-8 bg-white border border-gray-300 rounded flex items-center justify-center">
                        <span className="font-medium text-gray-800">{currentScores[player.id] || 0}</span>
                      </div>
                      <button
                        onClick={() => updateScore(player.id, 1)}
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <Plus size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Rules Tab */
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Oyun Kuralları</h3>
            <div className="space-y-4 text-gray-700">
              <p>101 Okey oyununun temel kuralları:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Her oyuncu 14 taş alır</li>
                <li>İlk oyuncu 15. taşı alır ve oyunu başlatır</li>
                <li>Oyun 101 puana ulaşan oyuncu kazanır</li>
                <li>Puanlar tur sonunda hesaplanır</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={endRound}
            className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium text-center"
          >
            {gameData.currentRound}. Turu Bitir
          </button>
          <button className="ml-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <Gear size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
