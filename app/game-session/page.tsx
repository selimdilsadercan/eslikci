'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { ArrowLeft, Plus, Minus, Gear, CrownSimple, Trash, ArrowCounterClockwise, X } from '@phosphor-icons/react';

function GameSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameSaveId = searchParams.get('gameSaveId');
  
  // Fetch game save data from Convex
  const gameSave = useQuery(api.gameSaves.getGameSaveById, gameSaveId ? { id: gameSaveId as Id<'gameSaves'> } : "skip");
  const players = useQuery(api.players.getPlayers);
  const addRoundScores = useMutation(api.gameSaves.addRoundScores);
  const updateGameSave = useMutation(api.gameSaves.updateGameSave);

  // Handle static generation
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }
  
  const gameName = gameSave?.name || 'Oyun';
  const gamePlayers = players?.filter(player => 
    gameSave?.players.includes(player._id)
  ) || [];
  
  const [activeTab, setActiveTab] = useState('puan-tablosu');
  const [currentScores, setCurrentScores] = useState<{[key: string]: number}>({});
  const [crownWinners, setCrownWinners] = useState<{[key: string]: boolean}>({});
  const [showSettings, setShowSettings] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const updateScore = (playerId: Id<'players'>, change: number) => {
    setCurrentScores(prev => ({
      ...prev,
      [playerId]: Math.max(0, (prev[playerId] || 0) + change)
    }));
  };

  const toggleCrown = (playerId: Id<'players'>) => {
    setCrownWinners(prev => {
      // If this player already has crown, remove it
      if (prev[playerId]) {
        const newState = { ...prev };
        delete newState[playerId];
        return newState;
      } else {
        // Remove crown from all other players and give it to this one
        return { [playerId]: true };
      }
    });
  };

  const undoLastRound = async () => {
    if (!gameSaveId || !gameSave?.laps) return;
    
    try {
      // Remove the last round from all players
      const updatedLaps = gameSave.laps.map(playerLaps => 
        playerLaps.slice(0, -1) // Remove last element
      );
      
      await updateGameSave({
        id: gameSaveId as Id<'gameSaves'>,
        laps: updatedLaps
      });
    } catch (error) {
      console.error('Error undoing last round:', error);
    }
  };

  const resetAllRounds = async () => {
    if (!gameSaveId) return;
    
    try {
      await updateGameSave({
        id: gameSaveId as Id<'gameSaves'>,
        laps: []
      });
    } catch (error) {
      console.error('Error resetting rounds:', error);
    }
  };

  const toggleHideTotalColumn = async () => {
    if (!gameSaveId || !gameSave?.settings) return;
    
    try {
      await updateGameSave({
        id: gameSaveId as Id<'gameSaves'>,
        settings: {
          gameplay: gameSave.settings.gameplay,
          calculationMode: gameSave.settings.calculationMode,
          roundWinner: gameSave.settings.roundWinner,
          pointsPerRound: gameSave.settings.pointsPerRound,
          penaltiesPerRound: gameSave.settings.penaltiesPerRound,
          hideTotalColumn: !gameSave.settings.hideTotalColumn
        }
      });
    } catch (error) {
      console.error('Error toggling hide total column:', error);
    }
  };

  const endRound = async () => {
    if (!gameSaveId) return;
    
    // Prepare round scores array based on calculation mode
    let roundScores: number[];
    
    if (gameSave?.settings.calculationMode === 'NoPoints') {
      // For crown mode, give 1 point to players with crowns
      roundScores = gamePlayers.map(player => crownWinners[player._id] ? 1 : 0);
    } else {
      // For other modes, use the current scores
      roundScores = gamePlayers.map(player => currentScores[player._id] || 0);
    }
    
    try {
      await addRoundScores({
        id: gameSaveId as Id<'gameSaves'>,
        roundScores: roundScores
      });
      
      // Clear current scores and crowns after successful save
      setCurrentScores({});
      setCrownWinners({});
    } catch (error) {
      console.error('Error saving round scores:', error);
    }
  };

  const getTotalScore = (playerId: Id<'players'>) => {
    if (!gameSave?.laps) return 0;
    
    const playerIndex = gameSave.players.findIndex(id => id === playerId);
    if (playerIndex === -1) return 0;
    
    const playerLaps = gameSave.laps[playerIndex] || [];
    const totalFromLaps = playerLaps.reduce((sum, score) => sum + score, 0);
    
    return totalFromLaps;
  };

  const getRoundScores = (playerId: Id<'players'>, roundNumber: number) => {
    if (!gameSave?.laps) return 0;
    
    const playerIndex = gameSave.players.findIndex(id => id === playerId);
    if (playerIndex === -1) return 0;
    
    const playerLaps = gameSave.laps[playerIndex] || [];
    const roundIndex = roundNumber - 1; // Convert to 0-based index
    
    return playerLaps[roundIndex] || 0;
  };

  // Generate round columns dynamically
  const generateRoundColumns = () => {
    if (!gameSave?.laps || gameSave.laps.length === 0) {
      // If no laps data, don't show any round columns
      return [];
    }
    
    // Get the maximum number of rounds from the laps data
    const maxRounds = Math.max(...gameSave.laps.map(playerLaps => playerLaps.length));
    
    // If no rounds have been recorded, don't show any round columns
    if (maxRounds === 0) {
      return [];
    }
    
    const rounds = [];
    
    // Generate round numbers from most recent to oldest
    for (let i = maxRounds; i >= 1; i--) {
      rounds.push(i);
    }
    
    return rounds;
  };

  const roundColumns = generateRoundColumns();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-4">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{gameName}</h1>
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
      <div className="px-4 py-6 pb-96">
        {activeTab === 'puan-tablosu' ? (
          <>
            {/* Score Table - No background, horizontally scrollable */}
            <div className="overflow-x-auto mb-6">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="px-4 py-3 flex min-w-max border-b border-gray-200">
                  <div className="w-[120px]"></div>
                  {!gameSave?.settings.hideTotalColumn && (
                    <div className="w-20 text-center font-medium text-gray-700">Toplam</div>
                  )}
                  {/* Dynamic round columns */}
                  {roundColumns.map((roundNumber) => (
                    <div key={roundNumber} className="w-20 text-center font-medium text-gray-700">
                      {roundNumber}. Tur
                    </div>
                  ))}
                </div>

                {/* Player Rows */}
                {gamePlayers.map((player, index) => (
                  <div key={player._id} className={`px-4 py-3 flex items-center min-w-max ${index < gamePlayers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center w-[120px]">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                      </div>
                      <span className="font-medium text-gray-800 truncate">{player.name}</span>
                    </div>
                    {!gameSave?.settings.hideTotalColumn && (
                      <div className="w-20 text-center font-semibold text-gray-800">
                        {getTotalScore(player._id)}
                      </div>
                    )}
                    {roundColumns.map((roundNumber) => (
                      <div key={roundNumber} className="w-20 text-center text-gray-600">
                        {getRoundScores(player._id, roundNumber) || '-'}
                      </div>
                    ))}
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

      {/* Fixed Bottom Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
        {showSettings ? (
          /* Settings Modal */
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-4">
              <button 
                onClick={undoLastRound}
                className="flex items-center space-x-3 text-red-600 hover:text-red-700 w-full"
              >
                <ArrowCounterClockwise size={16} />
                <span className="text-sm font-medium">Son Turu Geri Al</span>
              </button>
              <button 
                onClick={resetAllRounds}
                className="flex items-center space-x-3 text-red-600 hover:text-red-700 w-full"
              >
                <Trash size={16} />
                <span className="text-sm font-medium">Turları Sıfırla</span>
              </button>
              <button 
                onClick={toggleHideTotalColumn}
                className="flex items-center space-x-3 w-full"
              >
                <span className="text-sm font-medium text-gray-800">Toplam Sütununu Gizle:</span>
                <div className={`w-4 h-4 border-2 border-blue-500 rounded ${
                  gameSave?.settings.hideTotalColumn ? 'bg-blue-500' : 'bg-white'
                }`}></div>
              </button>
            </div>
          </div>
        ) : (
          /* Current Round Score Input */
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-x-10 gap-y-6 max-h-48 overflow-y-auto place-content-center">
              {gamePlayers.map((player, index) => (
                <div key={player._id} className={`flex flex-col space-y-2 ${
                  index % 2 === 0 ? 'items-end' : 'items-start'
                }`}>
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`flex items-center ${
                      gameSave?.settings.calculationMode === 'NoPoints' ? 'justify-center' : ''
                    }`}>
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-600 font-semibold text-xs">{player.initial}</span>
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{player.name}</span>
                    </div>
                    
                    {gameSave?.settings.calculationMode === 'NoPoints' ? (
                      /* Crown Mode - Toggle crown for 1 point */
                      <button
                        onClick={() => toggleCrown(player._id)}
                        className={`p-1 ${
                          crownWinners[player._id] 
                            ? 'text-blue-600' 
                            : 'text-gray-400'
                        }`}
                      >
                        <CrownSimple size={20} weight="fill" />
                      </button>
                    ) : (
                      /* Score Mode - Plus/Minus buttons */
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateScore(player._id, -1)}
                          className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"
                        >
                          <Minus size={12} className="text-gray-600" />
                        </button>
                        <div className="w-12 h-6 bg-white border border-gray-300 rounded flex items-center justify-center">
                          <span className="font-medium text-gray-800 text-sm">{currentScores[player._id] || 0}</span>
                        </div>
                        <button
                          onClick={() => updateScore(player._id, 1)}
                          className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"
                        >
                          <Plus size={12} className="text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={endRound}
              className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium text-center"
            >
              1. Turu Bitir
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`ml-4 w-12 h-12 rounded-full flex items-center justify-center ${
                showSettings 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'border-2 border-blue-500 text-blue-500 bg-white hover:bg-blue-50'
              }`}
            >
              {showSettings ? (
                <X size={20} weight="bold" />
              ) : (
                <Gear size={20} weight="bold" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameSessionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameSessionContent />
    </Suspense>
  );
}
