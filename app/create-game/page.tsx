'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { ArrowLeft, ArrowRight, Crown } from '@phosphor-icons/react';

function CreateGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');
  
  // Fetch game data and players from Convex
  const game = useQuery(api.games.getGameById, gameId ? { id: gameId as any } : "skip");
  const players = useQuery(api.players.getPlayers);
  const groups = useQuery(api.groups.getGroups);
  const currentUserAsPlayer = useQuery(api.players.getCurrentUserAsPlayer);
  const currentUser = useQuery(api.users.getCurrentUser);
  const gameName = game?.name || 'Oyun';
  
  // Mutations
  const createGameSave = useMutation(api.gameSaves.createGameSave);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlayers, setSelectedPlayers] = useState<Id<'players'>[]>([]);
  const [redTeam, setRedTeam] = useState<Id<'players'>[]>([]);
  const [blueTeam, setBlueTeam] = useState<Id<'players'>[]>([]);
  const [gameSettings, setGameSettings] = useState({
    gameplay: game?.settings?.gameplay || 'herkes-tek',
    calculationMode: game?.settings?.calculationMode || 'NoPoints',
    roundWinner: game?.settings?.roundWinner || 'OnePoint',
    pointsPerRound: (game?.settings as any)?.pointsPerRound || 'Single',
    penaltiesPerRound: (game?.settings as any)?.penaltiesPerRound || 'Single',
    hideTotalColumn: game?.settings?.hideTotalColumn || false
  });

  // Update settings when game data loads
  useEffect(() => {
    if (game?.settings) {
      setGameSettings({
        gameplay: game.settings.gameplay || 'herkes-tek',
        calculationMode: game.settings.calculationMode || 'NoPoints',
        roundWinner: game.settings.roundWinner || 'OnePoint',
        pointsPerRound: (game.settings as any).pointsPerRound || 'Single',
        penaltiesPerRound: (game.settings as any).penaltiesPerRound || 'Single',
        hideTotalColumn: game.settings.hideTotalColumn || false
      });
    }
  }, [game]);

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(1);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (selectedPlayers.length > 0) {
        setCurrentStep(2);
      }
    } else {
      // Create game save and start the game
      if (!currentUser || !gameId) {
        console.error('Missing user or game ID');
        return;
      }

      try {
        const gameSaveId = await createGameSave({
          name: `${gameName} - ${new Date().toLocaleDateString('tr-TR')}`,
          gameTemplate: gameId as Id<'games'>,
          players: selectedPlayers,
          redTeam: gameSettings.gameplay === 'takimli' ? redTeam : undefined,
          blueTeam: gameSettings.gameplay === 'takimli' ? blueTeam : undefined,
          settings: {
            gameplay: gameSettings.gameplay as 'herkes-tek' | 'takimli',
            calculationMode: gameSettings.calculationMode as 'NoPoints' | 'Points' | 'Penalized',
            roundWinner: gameSettings.roundWinner as 'OnePoint' | 'ZeroPoint' | 'Highest' | 'Lowest',
            pointsPerRound: gameSettings.pointsPerRound as 'Single' | 'Multiple' | undefined,
            penaltiesPerRound: gameSettings.penaltiesPerRound as 'Single' | 'Multiple' | undefined,
            hideTotalColumn: gameSettings.hideTotalColumn,
          },
          userId: currentUser._id,
        });

        console.log('Game save created:', gameSaveId);
        router.push(`/game-session?gameSaveId=${gameSaveId}`);
      } catch (error) {
        console.error('Error creating game save:', error);
      }
    }
  };

  const togglePlayer = (playerId: Id<'players'>) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const updateGameSetting = (key: string, value: string | boolean) => {
    setGameSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Reset round winner when calculation mode changes
      if (key === 'calculationMode') {
        if (value === 'NoPoints') {
          newSettings.roundWinner = 'OnePoint';
        } else if (value === 'Points') {
          newSettings.roundWinner = 'Highest';
        } else if (value === 'Penalized') {
          newSettings.roundWinner = 'Lowest';
        }
      }
      
      return newSettings;
    });
    
    // Reset teams when switching from team mode to individual mode
    if (key === 'gameplay' && value === 'herkes-tek') {
      setRedTeam([]);
      setBlueTeam([]);
    }
  };

  const movePlayerToTeam = (playerId: Id<'players'>, team: 'red' | 'blue') => {
    // Remove player from both teams first
    setRedTeam(prev => prev.filter(id => id !== playerId));
    setBlueTeam(prev => prev.filter(id => id !== playerId));
    
    // Add to the specified team
    if (team === 'red') {
      setRedTeam(prev => [...prev, playerId]);
    } else {
      setBlueTeam(prev => [...prev, playerId]);
    }
  };

  const removePlayerFromTeams = (playerId: Id<'players'>) => {
    setRedTeam(prev => prev.filter(id => id !== playerId));
    setBlueTeam(prev => prev.filter(id => id !== playerId));
  };

  const handleDragStart = (e: React.DragEvent, playerId: Id<'players'>) => {
    e.dataTransfer.setData('text/plain', playerId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, team: 'red' | 'blue') => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/plain') as Id<'players'>;
    movePlayerToTeam(playerId, team);
  };

  // Group players by their group
  const groupedPlayers = players?.reduce((acc, player) => {
    const groupId = player.groupId || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(player);
    return acc;
  }, {} as Record<string, typeof players>) || {};

  // Combine all players including current user
  const allPlayers = [
    ...(currentUserAsPlayer ? [currentUserAsPlayer] : []),
    ...(players || [])
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Gray Gap at Top */}
      <div className="h-2 bg-gray-300"></div>
      
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center shadow-sm">
        <button onClick={handleBack} className="mr-4">
          <ArrowLeft size={24} className="text-black" />
        </button>
        <h1 className="text-xl font-bold text-black">{gameName}</h1>
      </div>

      {/* Main Content - Empty space for bottom panel */}
      <div className="flex-1"></div>

      {/* Fixed White Rectangle at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg">
        <div className="p-6">
          {currentStep === 1 ? (
            // Player Selection in Bottom Panel
            <>
              {/* Current User */}
              {currentUserAsPlayer && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-gray-600 mb-3">Ben</h2>
                  <div className="space-y-1">
                    <div
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">{currentUserAsPlayer.initial}</span>
                        </div>
                        <span className="font-medium text-black">{currentUserAsPlayer.name}</span>
                      </div>
                      <button
                        onClick={() => togglePlayer(currentUserAsPlayer._id)}
                        className={`w-5 h-5 border-2 flex items-center justify-center ${
                          selectedPlayers.includes(currentUserAsPlayer._id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white border-blue-500'
                        }`}
                      >
                        {selectedPlayers.includes(currentUserAsPlayer._id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Ungrouped Players */}
              {groupedPlayers.ungrouped && groupedPlayers.ungrouped.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-gray-600 mb-3">Gruplandırılmamış</h2>
                  <div className="space-y-1">
                    {groupedPlayers.ungrouped.map((player) => (
                      <div
                        key={player._id}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                          </div>
                          <span className="font-medium text-black">{player.name}</span>
                        </div>
                        <button
                          onClick={() => togglePlayer(player._id)}
                          className={`w-5 h-5 border-2 flex items-center justify-center ${
                            selectedPlayers.includes(player._id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-blue-500'
                          }`}
                        >
                          {selectedPlayers.includes(player._id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grouped Players */}
              {groups?.map((group) => {
                const groupPlayers = groupedPlayers[group._id] || [];
                if (groupPlayers.length === 0) return null;
                
                return (
                  <div key={group._id} className="mb-6">
                    <h2 className="text-sm font-medium text-gray-600 mb-3">{group.name}</h2>
                    <div className="space-y-1">
                      {groupPlayers.map((player) => (
                        <div
                          key={player._id}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                            </div>
                            <span className="font-medium text-black">{player.name}</span>
                          </div>
                          <button
                            onClick={() => togglePlayer(player._id)}
                            className={`w-5 h-5 border-2 flex items-center justify-center ${
                              selectedPlayers.includes(player._id)
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-white border-blue-500'
                            }`}
                          >
                            {selectedPlayers.includes(player._id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            // Game Settings State
            <>
              <div className="space-y-6">
                {/* Oyuncular - Show teams if team mode is selected */}
                {gameSettings.gameplay === 'takimli' ? (
                  <>
                    {/* Kırmızı Takım */}
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-3">Kırmızı Takım:</h2>
                      <div 
                        className="min-h-[60px] p-4 border-2 border-dashed border-red-300 rounded-lg bg-red-50"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'red')}
                      >
                        <div className="flex flex-wrap gap-2">
                          {redTeam.map(playerId => {
                            const player = allPlayers.find(p => p._id === playerId);
                            return player ? (
                              <div 
                                key={playerId} 
                                className="rounded-full px-3 py-2 flex items-center space-x-2 cursor-move" 
                                style={{ backgroundColor: '#F05757' }}
                                draggable
                                onDragStart={(e) => handleDragStart(e, playerId)}
                              >
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                  <span className="text-red-600 font-semibold text-xs">{player.initial}</span>
                                </div>
                                <span className="text-white font-medium text-sm">{player.name}</span>
                                <button
                                  onClick={() => removePlayerFromTeams(playerId)}
                                  className="ml-2 text-white hover:text-red-200"
                                >
                                  ×
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                        {redTeam.length === 0 && (
                          <p className="text-gray-500 text-sm">Oyuncuları buraya sürükleyin</p>
                        )}
                      </div>
                    </div>

                    {/* Mavi Takım */}
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-3">Mavi Takım:</h2>
                      <div 
                        className="min-h-[60px] p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'blue')}
                      >
                        <div className="flex flex-wrap gap-2">
                          {blueTeam.map(playerId => {
                            const player = allPlayers.find(p => p._id === playerId);
                            return player ? (
                              <div 
                                key={playerId} 
                                className="rounded-full px-3 py-2 flex items-center space-x-2 cursor-move" 
                                style={{ backgroundColor: '#365376' }}
                                draggable
                                onDragStart={(e) => handleDragStart(e, playerId)}
                              >
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-xs">{player.initial}</span>
                                </div>
                                <span className="text-white font-medium text-sm">{player.name}</span>
                                <button
                                  onClick={() => removePlayerFromTeams(playerId)}
                                  className="ml-2 text-white hover:text-blue-200"
                                >
                                  ×
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                        {blueTeam.length === 0 && (
                          <p className="text-gray-500 text-sm">Oyuncuları buraya sürükleyin</p>
                        )}
                      </div>
                    </div>

                    {/* Available Players */}
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-3">Seçili Oyuncular:</h2>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlayers.map(playerId => {
                          const player = allPlayers.find(p => p._id === playerId);
                          const isInTeam = redTeam.includes(playerId) || blueTeam.includes(playerId);
                          return player ? (
                            <div 
                              key={playerId} 
                              className={`rounded-full px-3 py-2 flex items-center space-x-2 cursor-move ${
                                isInTeam ? 'opacity-50' : ''
                              }`}
                              style={{ backgroundColor: isInTeam ? '#E5E7EB' : '#F05757' }}
                              draggable={!isInTeam}
                              onDragStart={(e) => !isInTeam && handleDragStart(e, playerId)}
                            >
                              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <span className={`font-semibold text-xs ${isInTeam ? 'text-gray-400' : 'text-red-600'}`}>{player.initial}</span>
                              </div>
                              <span className={`font-medium text-sm ${isInTeam ? 'text-gray-400' : 'text-white'}`}>{player.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Individual Players */
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Oyuncular:</h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlayers.map(playerId => {
                        const player = allPlayers.find(p => p._id === playerId);
                        return player ? (
                          <div key={playerId} className="rounded-full px-3 py-2 flex items-center space-x-2" style={{ backgroundColor: '#F05757' }}>
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-semibold text-xs">{player.initial}</span>
                            </div>
                            <span className="text-white font-medium text-sm">{player.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Oynanış */}
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Oynanış:</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateGameSetting('gameplay', 'herkes-tek')}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        gameSettings.gameplay === 'herkes-tek'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={gameSettings.gameplay === 'herkes-tek' ? { backgroundColor: '#365376' } : {}}
                    >
                      Herkes Tek
                    </button>
                    <button
                      onClick={() => updateGameSetting('gameplay', 'takimli')}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        gameSettings.gameplay === 'takimli'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={gameSettings.gameplay === 'takimli' ? { backgroundColor: '#365376' } : {}}
                    >
                      Takımlı
                    </button>
                  </div>
                </div>

                {/* Hesaplama Modu */}
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Hesaplama Modu:</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateGameSetting('calculationMode', 'NoPoints')}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        gameSettings.calculationMode === 'NoPoints'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={gameSettings.calculationMode === 'NoPoints' ? { backgroundColor: '#365376' } : {}}
                    >
                      Puansız
                    </button>
                    <button
                      onClick={() => updateGameSetting('calculationMode', 'Points')}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        gameSettings.calculationMode === 'Points'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={gameSettings.calculationMode === 'Points' ? { backgroundColor: '#365376' } : {}}
                    >
                      Puanlı
                    </button>
                    <button
                      onClick={() => updateGameSetting('calculationMode', 'Penalized')}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        gameSettings.calculationMode === 'Penalized'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={gameSettings.calculationMode === 'Penalized' ? { backgroundColor: '#365376' } : {}}
                    >
                      Cezalı
                    </button>
                  </div>
                </div>

                {/* Tur Kazananı - Conditional based on calculation mode */}
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Tur Kazananı:</h2>
                  <div className="flex gap-2">
                    {gameSettings.calculationMode === 'NoPoints' ? (
                      // Options for Puansız mode
                      <>
                        <button
                          onClick={() => updateGameSetting('roundWinner', 'OnePoint')}
                          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${
                            gameSettings.roundWinner === 'OnePoint'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={gameSettings.roundWinner === 'OnePoint' ? { backgroundColor: '#365376' } : {}}
                        >
                          <Crown size={16} weight="fill" />
                          <span>1 Puan</span>
                        </button>
                        <button
                          onClick={() => updateGameSetting('roundWinner', 'ZeroPoint')}
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            gameSettings.roundWinner === 'ZeroPoint'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={gameSettings.roundWinner === 'ZeroPoint' ? { backgroundColor: '#365376' } : {}}
                        >
                          0 Puan
                        </button>
                      </>
                    ) : gameSettings.calculationMode === 'Points' ? (
                      // Options for Puanlı mode
                      <>
                        <button
                          onClick={() => updateGameSetting('roundWinner', 'Highest')}
                          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${
                            gameSettings.roundWinner === 'Highest'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={gameSettings.roundWinner === 'Highest' ? { backgroundColor: '#365376' } : {}}
                        >
                          <span>↑</span>
                          <span>En Yüksek</span>
                        </button>
                      </>
                    ) : (
                      // Options for Cezalı mode
                      <>
                        <button
                          onClick={() => updateGameSetting('roundWinner', 'Lowest')}
                          className={`px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 ${
                            gameSettings.roundWinner === 'Lowest'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={gameSettings.roundWinner === 'Lowest' ? { backgroundColor: '#365376' } : {}}
                        >
                          <span>↓</span>
                          <span>En Düşük</span>
                        </button>
                        <button
                          onClick={() => updateGameSetting('roundWinner', 'ZeroPoint')}
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            gameSettings.roundWinner === 'ZeroPoint'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={gameSettings.roundWinner === 'ZeroPoint' ? { backgroundColor: '#365376' } : {}}
                        >
                          0 Puan
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Tur İçi Puan Sayısı - Only show when Puanlı is selected */}
                {gameSettings.calculationMode === 'Points' && (
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Tur İçi Puan Sayısı:</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateGameSetting('pointsPerRound', 'Single')}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          gameSettings.pointsPerRound === 'Single'
                            ? 'text-white'
                            : 'text-gray-800'
                        }`}
                        style={gameSettings.pointsPerRound === 'Single' ? { backgroundColor: '#365376' } : {}}
                      >
                        Tek
                      </button>
                      <button
                        onClick={() => updateGameSetting('pointsPerRound', 'Multiple')}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          gameSettings.pointsPerRound === 'Multiple'
                            ? 'text-white'
                            : 'text-gray-800'
                        }`}
                        style={gameSettings.pointsPerRound === 'Multiple' ? { backgroundColor: '#365376' } : {}}
                      >
                        Çok
                      </button>
                    </div>
                  </div>
                )}

                {/* Tur İçi Ceza Sayısı - Only show when Cezalı is selected */}
                {gameSettings.calculationMode === 'Penalized' && (
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Tur İçi Ceza Sayısı:</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateGameSetting('penaltiesPerRound', 'Single')}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          gameSettings.penaltiesPerRound === 'Single'
                            ? 'text-white'
                            : 'text-gray-800'
                        }`}
                        style={gameSettings.penaltiesPerRound === 'Single' ? { backgroundColor: '#365376' } : {}}
                      >
                        Tek
                      </button>
                      <button
                        onClick={() => updateGameSetting('penaltiesPerRound', 'Multiple')}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          gameSettings.penaltiesPerRound === 'Multiple'
                            ? 'text-white'
                            : 'text-gray-800'
                        }`}
                        style={gameSettings.penaltiesPerRound === 'Multiple' ? { backgroundColor: '#365376' } : {}}
                      >
                        Çok
                      </button>
                    </div>
                  </div>
                )}

                {/* Toplam Sütununu Gizle */}
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Toplam Sütununu Gizle:</h2>
                  <button
                    onClick={() => updateGameSetting('hideTotalColumn', !gameSettings.hideTotalColumn)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      gameSettings.hideTotalColumn
                        ? 'border-gray-300'
                        : 'border-gray-300'
                    }`}
                    style={gameSettings.hideTotalColumn ? { backgroundColor: '#365376' } : {}}
                  >
                    {gameSettings.hideTotalColumn && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
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
    </div>
  );
}

export default function CreateGamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateGameContent />
    </Suspense>
  );
}
