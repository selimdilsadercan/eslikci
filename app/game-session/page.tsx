'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../components/FirebaseAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { ArrowLeft, Plus, Minus, Gear, CrownSimple, Trash, ArrowCounterClockwise, X } from '@phosphor-icons/react';

function GameSessionContent() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameSaveId = searchParams.get('gameSaveId');

  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [activeTab, setActiveTab] = useState('puan-tablosu');
  const [currentScores, setCurrentScores] = useState<{[key: string]: number}>({});
  const [crownWinners, setCrownWinners] = useState<{[key: string]: boolean}>({});
  const [showSettings, setShowSettings] = useState(false);

  // Get current user first to ensure Convex auth works
  const currentUser = useQuery(api.users.getUserByFirebaseId, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );

  // Fetch game save data from Convex - ALWAYS call hooks first
  const gameSave = useQuery(api.gameSaves.getGameSaveById, gameSaveId ? { id: gameSaveId as Id<'gameSaves'> } : "skip");
  const players = useQuery(api.players.getPlayersByIds, gameSave?.players ? { playerIds: gameSave.players } : "skip");
  const gameTemplate = useQuery(api.games.getGameById, gameSave?.gameTemplate ? { id: gameSave.gameTemplate } : "skip");
  const addRoundScores = useMutation(api.gameSaves.addRoundScores);
  const updateGameSave = useMutation(api.gameSaves.updateGameSave);

  // Debug logging
  console.log('GameSession debug:', {
    isLoaded,
    isSignedIn,
    user: user?.uid,
    gameSaveId
  });

  // Debug Convex data
  console.log('GameSession Convex data:', {
    currentUser,
    gameSave,
    players,
    gameTemplate
  });

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
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

  // Handle static generation
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }

  // Show loading state while Convex data is loading
  if (gameSave === undefined || players === undefined || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game data...</p>
          <p className="text-sm text-gray-500 mt-2">
            {gameSave === undefined && "Loading game save..."}
            {players === undefined && "Loading players..."}
            {currentUser === undefined && "Loading user..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if game save not found
  if (gameSave === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Not Found</h1>
          <p className="text-gray-600 mb-6">The game session you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/games')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }
  
  const gameName = gameSave?.name || 'Oyun';
  
  // Debug the players data
  console.log('GameSession players debug:', {
    gameSavePlayers: gameSave?.players,
    players: players?.map(p => ({ id: p._id, name: p.name })),
    gameSavePlayersLength: gameSave?.players?.length,
    playersLength: players?.length
  });
  
  // Since we're getting players by IDs, we can use them directly
  const gamePlayers = players || [];
  console.log('GamePlayers:', gamePlayers.map(p => ({ id: p._id, name: p.name })));

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
        ) : activeTab === 'kurallar' ? (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Oyun Kuralları</h3>
            {gameTemplate?.rules ? (
              <div className="space-y-6">
                {(() => {
                  try {
                    // Try to parse as JSON first (structured rules)
                    const parsedRules = JSON.parse(gameTemplate.rules);
                    if (Array.isArray(parsedRules)) {
                      return parsedRules.map((section, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="text-md font-semibold text-gray-800 mb-2">
                            {section.title}
                          </h4>
                          <div 
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: section.content }}
                          />
                        </div>
                      ));
                    }
                  } catch (e) {
                    // If not JSON, treat as HTML content
                    return (
                      <div 
                        className="prose prose-sm max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: gameTemplate.rules }}
                      />
                    );
                  }
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">📋</span>
                </div>
                <h4 className="text-lg font-medium text-gray-600 mb-2">Kurallar henüz eklenmemiş</h4>
                <p className="text-gray-500">Bu oyun için kurallar henüz tanımlanmamış.</p>
              </div>
            )}
          </div>
        ) : null}
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
                <X size={20} weight="regular" />
              ) : (
                <Gear size={20} weight="regular" />
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
