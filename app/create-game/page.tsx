'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Crown } from '@phosphor-icons/react';

// Sample contacts data
const contacts = {
  ungrouped: [
    { id: 1, name: 'Murat', initial: 'M' },
    { id: 2, name: 'Arda', initial: 'A' }
  ],
  home: [
    { id: 3, name: 'Betül', initial: 'B' },
    { id: 4, name: 'Emel', initial: 'E' }
  ]
};

export default function CreateGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameName = searchParams.get('game') || 'Oyun';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [gameSettings, setGameSettings] = useState({
    gameplay: 'herkes-tek',
    calculationMode: 'puansiz',
    roundWinner: '1-puan',
    hideTotalColumn: false
  });

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(1);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedPlayers.length > 0) {
        setCurrentStep(2);
      }
    } else {
      // Start the game and navigate to game session
      console.log('Starting game with settings:', { gameName, selectedPlayers, gameSettings });
      router.push('/game-session');
    }
  };

  const togglePlayer = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const updateGameSetting = (key: string, value: string | boolean) => {
    setGameSettings(prev => ({ ...prev, [key]: value }));
  };

  const allContacts = [...contacts.ungrouped, ...contacts.home];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center shadow-sm">
        <button onClick={handleBack} className="mr-4">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">{gameName}</h1>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {currentStep === 1 ? (
          // Player Selection State
          <>
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-600 mb-3">Gruplandırılmamış</h2>
              <div className="space-y-3">
                {contacts.ungrouped.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-white rounded-lg p-4 flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{contact.initial}</span>
                      </div>
                      <span className="font-medium text-gray-800">{contact.name}</span>
                    </div>
                    <button
                      onClick={() => togglePlayer(contact.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedPlayers.includes(contact.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedPlayers.includes(contact.id) && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-medium text-gray-600 mb-3">Ev</h2>
              <div className="space-y-3">
                {contacts.home.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-white rounded-lg p-4 flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{contact.initial}</span>
                      </div>
                      <span className="font-medium text-gray-800">{contact.name}</span>
                    </div>
                    <button
                      onClick={() => togglePlayer(contact.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedPlayers.includes(contact.id)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedPlayers.includes(contact.id) && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Game Settings State
          <>
            <div className="space-y-6">
              {/* Oyuncular */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Oyuncular:</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedPlayers.map(playerId => {
                    const player = allContacts.find(p => p.id === playerId);
                    return player ? (
                      <div key={playerId} className="bg-red-100 rounded-full px-3 py-2 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xs">{player.initial}</span>
                        </div>
                        <span className="text-red-800 font-medium text-sm">{player.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Oynanış */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Oynanış:</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateGameSetting('gameplay', 'herkes-tek')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      gameSettings.gameplay === 'herkes-tek'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    Herkes Tek
                  </button>
                  <button
                    onClick={() => updateGameSetting('gameplay', 'takimli')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      gameSettings.gameplay === 'takimli'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    Takımlı
                  </button>
                </div>
              </div>

              {/* Hesaplama Modu */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Hesaplama Modu:</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateGameSetting('calculationMode', 'puansiz')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      gameSettings.calculationMode === 'puansiz'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    Puansız
                  </button>
                  <button
                    onClick={() => updateGameSetting('calculationMode', 'puanli')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      gameSettings.calculationMode === 'puanli'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    Puanlı
                  </button>
                  <button
                    onClick={() => updateGameSetting('calculationMode', 'cezali')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      gameSettings.calculationMode === 'cezali'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    Cezalı
                  </button>
                </div>
              </div>

              {/* Tur Kazananı */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">Tur Kazananı:</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateGameSetting('roundWinner', '1-puan')}
                    className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${
                      gameSettings.roundWinner === '1-puan'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    <Crown size={16} weight="fill" />
                    <span>1 Puan</span>
                  </button>
                  <button
                    onClick={() => updateGameSetting('roundWinner', '0-puan')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      gameSettings.roundWinner === '0-puan'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    0 Puan
                  </button>
                </div>
              </div>

              {/* Toplam Sütununu Gizle */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Toplam Sütununu Gizle:</h2>
                <button
                  onClick={() => updateGameSetting('hideTotalColumn', !gameSettings.hideTotalColumn)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                    gameSettings.hideTotalColumn
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {gameSettings.hideTotalColumn && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
        <div className="flex gap-3">
          {currentStep === 2 && (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 bg-white border-2 border-blue-500 text-blue-500 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <ArrowLeft size={20} />
              <span>Önceki Adım</span>
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={currentStep === 1 && selectedPlayers.length === 0}
            className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
              currentStep === 1 && selectedPlayers.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white'
            }`}
          >
            <span>{currentStep === 1 ? 'Sonraki Adım' : 'Oyunu Başlat'}</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
