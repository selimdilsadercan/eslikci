'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, Plus, Minus, Gear, CrownSimple, Trash, ArrowCounterClockwise, X } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';

function GameSessionContent() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameSaveId = searchParams.get('gameSaveId');

  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  const [activeTab, setActiveTab] = useState('puan-tablosu');
  const [currentScores, setCurrentScores] = useState<{[key: string]: number}>({});
  const [multipleScores, setMultipleScores] = useState<{[key: string]: number[]}>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    isDestructive: false
  });
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
  
  // Since we're getting players by IDs, we can use them directly
  const gamePlayers = players || [];

  // For team mode, group players by teams
  const getTeamPlayers = () => {
    if (gameSave?.settings.gameplay !== 'takimli' || !gameSave?.redTeam || !gameSave?.blueTeam) {
      return { redTeam: [], blueTeam: [] };
    }
    
    const redTeamPlayers = players?.filter(player => gameSave.redTeam?.includes(player._id)) || [];
    const blueTeamPlayers = players?.filter(player => gameSave.blueTeam?.includes(player._id)) || [];
    
    return { redTeamPlayers, blueTeamPlayers };
  };

  const { redTeamPlayers, blueTeamPlayers } = getTeamPlayers();

  const handleBack = () => {
    router.push('/history');
  };

  const addScoreInput = (playerId: Id<'players'>) => {
    setMultipleScores(prev => ({
      ...prev,
      [playerId]: [...(prev[playerId] || []), 0]
    }));
  };

  const removeScoreInput = (playerId: Id<'players'>) => {
    setMultipleScores(prev => ({
      ...prev,
      [playerId]: prev[playerId]?.slice(0, -1) || []
    }));
  };

  const updateMultipleScore = (playerId: Id<'players'>, index: number, value: number) => {
    setMultipleScores(prev => {
      const currentScores = prev[playerId] || [0];
      const updatedScores = [...currentScores];
      updatedScores[index] = Math.max(0, value);
      return {
        ...prev,
        [playerId]: updatedScores
      };
    });
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
        laps: updatedLaps as any // Type assertion for now
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

  const handleConfirmAction = (action: () => void, config: {
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
  }) => {
    setConfirmAction(() => action);
    setConfirmModalConfig(config);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
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
    let roundScores: (number | number[])[];
    
    // Individual Mode - Original logic
    if (gameSave?.settings.calculationMode === 'NoPoints') {
      // For crown mode, give 1 point to players with crowns
      roundScores = gamePlayers.map(player => crownWinners[player._id] ? 1 : 0);
    } else if (gameSave?.settings.pointsPerRound === 'Multiple') {
      // For multiple scores mode, send individual scores as arrays
      roundScores = gamePlayers.map(player => {
        const playerScores = multipleScores[player._id] || [];
        return playerScores.length > 0 ? playerScores : [0];
      });
    } else {
      // For single score mode, use the current scores
      roundScores = gamePlayers.map(player => currentScores[player._id] || 0);
    }
    
    // Check if all scores are 0
    let allScoresZero = false;
    
    if (gameSave?.settings.gameplay === 'takimli') {
      // For team mode, check if both team scores are zero
      if (gameSave?.settings.calculationMode === 'NoPoints') {
        // For crown mode, check if no team has crown
        allScoresZero = !crownWinners['redTeam'] && !crownWinners['blueTeam'];
      } else if (gameSave?.settings.pointsPerRound === 'Multiple') {
        // For multiple scores mode, check if both team multiple scores are all zero
        const redTeamScores = multipleScores['redTeam'] || [0];
        const blueTeamScores = multipleScores['blueTeam'] || [0];
        const redTeamTotal = redTeamScores.reduce((sum, score) => sum + score, 0);
        const blueTeamTotal = blueTeamScores.reduce((sum, score) => sum + score, 0);
        allScoresZero = redTeamTotal === 0 && blueTeamTotal === 0;
      } else {
        // For single score mode, check if both team scores are zero
        const redTeamScore = currentScores['redTeam'] || 0;
        const blueTeamScore = currentScores['blueTeam'] || 0;
        allScoresZero = redTeamScore === 0 && blueTeamScore === 0;
      }
    } else {
      // For individual mode, use the original logic
      allScoresZero = roundScores.every(score => {
        if (Array.isArray(score)) {
          return score.every(s => s === 0);
        } else {
          return score === 0;
        }
      });
    }
    
    if (allScoresZero) {
      const errorMessage = gameSave?.settings.gameplay === 'takimli' 
        ? 'En az bir takım için puan girmelisiniz!' 
        : 'En az bir oyuncu için puan girmelisiniz!';
      toast.error(errorMessage);
      return;
    }
    
    try {
      if (gameSave?.settings.gameplay === 'takimli') {
        // Team mode: send team scores directly
        let teamScores: (number | number[])[];
        
        if (gameSave?.settings.calculationMode === 'NoPoints') {
          // For crown mode, send 1 for winning team, 0 for losing team
          teamScores = [
            crownWinners['redTeam'] ? 1 : 0,
            crownWinners['blueTeam'] ? 1 : 0
          ];
        } else if (gameSave?.settings.pointsPerRound === 'Multiple') {
          // For multiple scores mode, send team multiple scores
          teamScores = [
            multipleScores['redTeam'] || [0],
            multipleScores['blueTeam'] || [0]
          ];
        } else {
          // For single score mode, send team single scores
          teamScores = [
            currentScores['redTeam'] || 0,
            currentScores['blueTeam'] || 0
          ];
        }
        
        await addRoundScores({
          id: gameSaveId as Id<'gameSaves'>,
          roundScores: [], // Empty for team mode
          isTeamMode: true,
          teamScores: teamScores
        });
      } else {
        // Individual mode: use the original logic
        await addRoundScores({
          id: gameSaveId as Id<'gameSaves'>,
          roundScores: roundScores,
          isTeamMode: false
        });
      }
      
      // Clear current scores and crowns after successful save
      setCurrentScores({});
      setCrownWinners({});
      setMultipleScores({});
    } catch (error) {
      console.error('Error saving round scores:', error);
      toast.error('Tur kaydedilirken hata oluştu!');
    }
  };

  const getTotalScore = (playerId: Id<'players'>) => {
    if (!gameSave?.laps) return 0;
    
    const playerIndex = gameSave.players.findIndex(id => id === playerId);
    if (playerIndex === -1) return 0;
    
    const playerLaps = gameSave.laps[playerIndex] || [];
    const totalFromLaps = playerLaps.reduce((sum: number, score: number | number[]) => {
      if (Array.isArray(score)) {
        return sum + score.reduce((subSum, subScore) => subSum + subScore, 0);
      } else {
        return sum + score;
      }
    }, 0);
    
    return totalFromLaps;
  };

  // Team score calculation functions
  const getTeamTotalScore = (teamPlayers: any[]) => {
    if (!teamPlayers) return 0;
    
    // For team mode, use teamLaps if available
    if (gameSave?.settings.gameplay === 'takimli' && gameSave?.teamLaps) {
      const teamIndex = teamPlayers === redTeamPlayers ? 0 : 1; // 0 for red team, 1 for blue team
      return gameSave.teamLaps.reduce((total: number, roundScores: (number | number[])[]) => {
        if (Array.isArray(roundScores) && roundScores[teamIndex] !== undefined) {
          const teamScore = roundScores[teamIndex];
          if (Array.isArray(teamScore)) {
            return total + teamScore.reduce((sum, score) => sum + score, 0);
          } else {
            return total + (teamScore || 0);
          }
        }
        return total;
      }, 0);
    }
    
    // Fallback to individual player scores (for backward compatibility)
    return teamPlayers.reduce((teamSum, player) => {
      return teamSum + getTotalScore(player._id);
    }, 0);
  };

  const getTeamRoundScore = (teamPlayers: any[], roundNumber: number) => {
    if (!teamPlayers) return 0;
    
    // For team mode, use teamLaps if available
    if (gameSave?.settings.gameplay === 'takimli' && gameSave?.teamLaps) {
      const teamIndex = teamPlayers === redTeamPlayers ? 0 : 1; // 0 for red team, 1 for blue team
      const roundIndex = roundNumber - 1; // Convert to 0-based index
      const roundScores = gameSave.teamLaps[roundIndex];
      
      if (Array.isArray(roundScores) && roundScores[teamIndex] !== undefined) {
        const teamScore = roundScores[teamIndex];
        if (Array.isArray(teamScore)) {
          return teamScore.reduce((sum, score) => sum + score, 0);
        } else {
          return teamScore || 0;
        }
      }
      return 0;
    }
    
    // Fallback to individual player scores (for backward compatibility)
    return teamPlayers.reduce((teamSum, player) => {
      const playerIndex = gameSave?.players.findIndex(id => id === player._id);
      if (playerIndex === -1) return teamSum;
      
      const playerLaps = gameSave?.laps?.[playerIndex] || [];
      const roundScore = playerLaps[roundNumber - 1];
      
      if (Array.isArray(roundScore)) {
        return teamSum + roundScore.reduce((s, sc) => s + sc, 0);
      }
      return teamSum + (roundScore || 0);
    }, 0);
  };

  const getRoundScores = (playerId: Id<'players'>, roundNumber: number) => {
    if (!gameSave?.laps) return 0;
    
    const playerIndex = gameSave.players.findIndex(id => id === playerId);
    if (playerIndex === -1) return 0;
    
    const playerLaps = gameSave.laps[playerIndex] || [];
    const roundIndex = roundNumber - 1; // Convert to 0-based index
    const score = playerLaps[roundIndex];
    
    if (Array.isArray(score)) {
      return score.join(', ');
    } else {
      return score || 0;
    }
  };

  // Generate round columns dynamically
  const generateRoundColumns = () => {
    if (gameSave?.settings.gameplay === 'takimli' && gameSave?.teamLaps) {
      // For team mode, use teamLaps
      if (gameSave.teamLaps.length === 0) {
        return [];
      }
      
      const rounds = [];
      // Generate round numbers from most recent to oldest
      for (let i = gameSave.teamLaps.length; i >= 1; i--) {
        rounds.push(i);
      }
      return rounds;
    } else {
      // For individual mode, use laps
      if (!gameSave?.laps || gameSave.laps.length === 0) {
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
    }
  };

  const roundColumns = generateRoundColumns();

  const getTimeAgo = () => {
    if (!gameSave?.createdTime) return 'Bilinmiyor';
    
    const now = Date.now();
    const gameTime = gameSave.createdTime;
    const diffInMinutes = Math.floor((now - gameTime) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Az önce';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} dakika önce`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} saat önce`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} gün önce`;
    }
  };

  const getNextRoundNumber = () => {
    if (gameSave?.settings.gameplay === 'takimli' && gameSave?.teamLaps) {
      // For team mode, use teamLaps
      return gameSave.teamLaps.length + 1;
    } else {
      // For individual mode, use laps
      if (!gameSave?.laps || gameSave.laps.length === 0) {
        return 1; // First round if no laps exist
      }
      
      // Get the maximum number of rounds from the laps data
      const maxRounds = Math.max(...gameSave.laps.map(playerLaps => playerLaps.length));
      return maxRounds + 1; // Next round number
    }
  };


  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={handleBack} className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">{gameName}</h1>
          </div>
          <span className="text-sm text-gray-500">{getTimeAgo()}</span>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2 border-b border-gray-200">
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 pt-32 pb-6" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {activeTab === 'puan-tablosu' ? (
          <>
            {/* Score Table - Full height, horizontally scrollable */}
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="px-2 py-2 flex min-w-max">
                  <div className={gameSave?.settings.gameplay === 'takimli' ? 'w-[180px]' : 'w-[120px]'}></div>
                  {!gameSave?.settings.hideTotalColumn && (
                    <div className="w-20 text-center font-medium" style={{ color: 'var(--secondary-color)' }}>Toplam</div>
                  )}
                  {/* Dynamic round columns */}
                  {roundColumns.map((roundNumber) => (
                    <div key={roundNumber} className="w-20 text-center font-medium" style={{ color: 'var(--secondary-color)' }}>
                      {roundNumber}. Tur
                    </div>
                  ))}
                </div>

                {/* Player/Team Rows */}
                {gameSave?.settings.gameplay === 'takimli' ? (
                  // Team Mode - Show Teams
                  <>
                    {/* Red Team Row */}
                    <div className="px-2 py-2.5 flex items-center min-w-max border-b border-gray-100">
                      <div className="flex items-center w-[180px]">
                        <div className="relative mr-3">
                          {redTeamPlayers && redTeamPlayers.length > 0 ? (
                            <div className="flex -space-x-2">
                              {redTeamPlayers.slice(0, 3).map((player, index) => (
                                <div
                                  key={player._id}
                                  className="relative"
                                  style={{ zIndex: Math.min(redTeamPlayers.length - index, 5) }}
                                >
                                  {player.avatar ? (
                                    <img
                                      src={player.avatar}
                                      alt={player.name}
                                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
                                      <span className="text-blue-600 font-semibold text-xs">{player.initial}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {redTeamPlayers.length > 3 && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                                  <span className="text-gray-600 font-semibold text-xs">+{redTeamPlayers.length - 3}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">K</span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium truncate" style={{ color: 'var(--secondary-color)' }}>
                          {redTeamPlayers?.map(p => p.name).join(', ') || 'Kırmızı Takım'}
                        </span>
                      </div>
                      {!gameSave?.settings.hideTotalColumn && (
                        <div className="w-20 text-center font-medium" style={{ color: 'var(--secondary-color)' }}>
                          {getTeamTotalScore(redTeamPlayers || [])}
                        </div>
                      )}
                      {roundColumns.map((roundNumber) => (
                        <div key={roundNumber} className="w-20 text-center text-gray-600 font-medium">
                          {gameSave?.settings.calculationMode === 'NoPoints' ? (
                            getTeamRoundScore(redTeamPlayers || [], roundNumber) === 1 ? (
                              <CrownSimple size={16} weight="fill" className="text-gray-500 mx-auto" />
                            ) : '-'
                          ) : (
                            getTeamRoundScore(redTeamPlayers || [], roundNumber) || '-'
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Blue Team Row */}
                    <div className="px-2 py-2.5 flex items-center min-w-max">
                      <div className="flex items-center w-[180px]">
                        <div className="relative mr-3">
                          {blueTeamPlayers && blueTeamPlayers.length > 0 ? (
                            <div className="flex -space-x-2">
                              {blueTeamPlayers.slice(0, 3).map((player, index) => (
                                <div
                                  key={player._id}
                                  className="relative"
                                  style={{ zIndex: Math.min(blueTeamPlayers.length - index, 5) }}
                                >
                                  {player.avatar ? (
                                    <img
                                      src={player.avatar}
                                      alt={player.name}
                                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white">
                                      <span className="text-blue-600 font-semibold text-xs">{player.initial}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {blueTeamPlayers.length > 3 && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
                                  <span className="text-gray-600 font-semibold text-xs">+{blueTeamPlayers.length - 3}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">M</span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium truncate" style={{ color: 'var(--secondary-color)' }}>
                          {blueTeamPlayers?.map(p => p.name).join(', ') || 'Mavi Takım'}
                        </span>
                      </div>
                      {!gameSave?.settings.hideTotalColumn && (
                        <div className="w-20 text-center font-medium" style={{ color: 'var(--secondary-color)' }}>
                          {getTeamTotalScore(blueTeamPlayers || [])}
                        </div>
                      )}
                      {roundColumns.map((roundNumber) => (
                        <div key={roundNumber} className="w-20 text-center text-gray-600 font-medium">
                          {gameSave?.settings.calculationMode === 'NoPoints' ? (
                            getTeamRoundScore(blueTeamPlayers || [], roundNumber) === 1 ? (
                              <CrownSimple size={16} weight="fill" className="text-gray-500 mx-auto" />
                            ) : '-'
                          ) : (
                            getTeamRoundScore(blueTeamPlayers || [], roundNumber) || '-'
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  // Individual Mode - Show Individual Players
                  gamePlayers.map((player, index) => (
                  <div key={player._id} className={`px-2 py-2.5 flex items-center min-w-max ${index < gamePlayers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-center w-[120px]">
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                        </div>
                      )}
                      <span className="font-medium truncate" style={{ color: 'var(--secondary-color)' }}>{player.name}</span>
                    </div>
                    {!gameSave?.settings.hideTotalColumn && (
                      <div className="w-20 text-center font-medium" style={{ color: 'var(--secondary-color)' }}>
                        {getTotalScore(player._id)}
                      </div>
                    )}
                    {roundColumns.map((roundNumber) => (
                      <div key={roundNumber} className="w-20 text-center text-gray-600 font-medium">
                        {gameSave?.settings.calculationMode === 'NoPoints' ? (
                          getRoundScores(player._id, roundNumber) === 1 ? (
                            <CrownSimple size={16} weight="fill" className="text-gray-500 mx-auto" />
                          ) : '-'
                        ) : (
                          getRoundScores(player._id, roundNumber) || '-'
                        )}
                      </div>
                    ))}
                  </div>
                  ))
                )}
              </div>
            </div>

          </>
        ) : activeTab === 'kurallar' ? (
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Oyun Kuralları</h3>
                <p className="text-gray-600 text-xs">Bu oyunun nasıl oynanacağını öğrenin</p>
              </div>
            </div>
            
            {gameTemplate?.rules ? (
              <div className="space-y-4">
                {(() => {
                  try {
                    // Try to parse as JSON first (structured rules)
                    const parsedRules = JSON.parse(gameTemplate.rules);
                    if (Array.isArray(parsedRules)) {
                      return parsedRules.map((section, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start">
                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                              <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-gray-800 mb-2">
                                {section.title}
                              </h4>
                              <div 
                                className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                style={{
                                  '--tw-prose-headings': '#374151',
                                  '--tw-prose-links': '#3b82f6',
                                  '--tw-prose-bold': '#1f2937',
                                  '--tw-prose-code': '#1f2937',
                                  '--tw-prose-pre-code': '#1f2937',
                                  '--tw-prose-pre-bg': '#f3f4f6',
                                  '--tw-prose-th-borders': '#d1d5db',
                                  '--tw-prose-td-borders': '#e5e7eb'
                                } as React.CSSProperties}
                                dangerouslySetInnerHTML={{ __html: section.content }}
                              />
                            </div>
                          </div>
                        </div>
                      ));
                    }
                  } catch (e) {
                    // If not JSON, treat as HTML content
                    return (
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                          style={{
                            '--tw-prose-headings': '#374151',
                            '--tw-prose-links': '#3b82f6',
                            '--tw-prose-bold': '#1f2937',
                            '--tw-prose-code': '#1f2937',
                            '--tw-prose-pre-code': '#1f2937',
                            '--tw-prose-pre-bg': '#f3f4f6',
                            '--tw-prose-th-borders': '#d1d5db',
                            '--tw-prose-td-borders': '#e5e7eb'
                          } as React.CSSProperties}
                          dangerouslySetInnerHTML={{ __html: gameTemplate.rules }}
                        />
                      </div>
                    );
                  }
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <span className="text-gray-400 text-3xl">📋</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-700 mb-3">Kurallar henüz eklenmemiş</h4>
                <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                  Bu oyun için kurallar henüz tanımlanmamış. Oyun yöneticisi kuralları eklediğinde burada görünecektir.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Fixed Bottom Area - Hide when Kurallar tab is selected */}
      {activeTab !== 'kurallar' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
        {showSettings ? (
          /* Settings Modal */
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <button 
                onClick={() => handleConfirmAction(undoLastRound, {
                  title: "Son Turu Geri Al",
                  message: "Son turu geri almak istediğinizden emin misiniz?",
                  confirmText: "Geri Al",
                  isDestructive: true
                })}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full justify-start py-2"
              >
                <ArrowCounterClockwise size={16} />
                <span className="text-sm font-medium">Son Turu Geri Al</span>
              </button>
              <button 
                onClick={() => handleConfirmAction(resetAllRounds, {
                  title: "Turları Sıfırla",
                  message: "Tüm turları sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.",
                  confirmText: "Sıfırla",
                  isDestructive: true
                })}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full justify-start py-2"
              >
                <Trash size={16} />
                <span className="text-sm font-medium">Turları Sıfırla</span>
              </button>
              <div className="flex items-center space-x-2">
                <label htmlFor="hideTotalColumn" className="text-sm font-medium text-gray-700">
                  Toplam Sütununu Gizle:
                </label>
                <input
                  type="checkbox"
                  id="hideTotalColumn"
                  checked={gameSave?.settings.hideTotalColumn || false}
                  onChange={toggleHideTotalColumn}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Current Round Score Input */
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-x-10 gap-y-6 max-h-100 overflow-y-auto place-content-center pb-4">
              {gameSave?.settings.gameplay === 'takimli' ? (
                // Team Mode - Show Teams for Score Input (one input per team)
                <>
                  {/* Red Team Score Input */}
                  <div className="flex flex-col space-y-2 items-end">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center flex-row">
                        <div className="relative mr-2">
                          {redTeamPlayers && redTeamPlayers.length > 0 ? (
                            <div className="flex -space-x-1">
                              {redTeamPlayers.slice(0, 2).map((player, index) => (
                                <div
                                  key={player._id}
                                  className="relative"
                                  style={{ zIndex: Math.min(redTeamPlayers.length - index, 5) }}
                                >
                                  {player.avatar ? (
                                    <img
                                      src={player.avatar}
                                      alt={player.name}
                                      className="w-6 h-6 rounded-full object-cover border border-white"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border border-white">
                                      <span className="text-blue-600 font-semibold text-xs">{player.initial}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {redTeamPlayers.length > 2 && (
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center border border-white">
                                  <span className="text-gray-600 font-semibold text-xs">+{redTeamPlayers.length - 2}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-xs">K</span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-800 text-sm">
                          {redTeamPlayers?.map(p => p.name).join(', ') || 'Kırmızı Takım'}
                        </span>
                      </div>
                      
                      {gameSave?.settings.calculationMode === 'NoPoints' ? (
                        /* Crown Mode for Teams */
                        <button
                          onClick={() => {
                            setCrownWinners(prev => ({
                              ...prev,
                              'redTeam': !prev['redTeam']
                            }));
                          }}
                          className={`p-1 ${
                            crownWinners['redTeam'] 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                          }`}
                        >
                          <CrownSimple size={20} weight="fill" />
                        </button>
                      ) : gameSave?.settings.pointsPerRound === 'Multiple' ? (
                        /* Multiple Scores Mode for Teams - Multiple input fields with horizontal buttons */
                        <div className="flex flex-col items-center space-y-2">
                          {(multipleScores['redTeam'] || [0]).map((score, scoreIndex) => (
                            <div key={scoreIndex} className="flex flex-col items-center space-y-1">
                              <input
                                type="text"
                                value={score || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setMultipleScores(prev => {
                                    const currentScores = prev['redTeam'] || [0];
                                    const updatedScores = [...currentScores];
                                    updatedScores[scoreIndex] = Math.max(0, value);
                                    return {
                                      ...prev,
                                      'redTeam': updatedScores
                                    };
                                  });
                                }}
                                className="w-24 h-12 bg-white border-2 rounded-lg text-center font-medium text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{ borderColor: 'rgba(134, 189, 255, 0.4)' }}
                                placeholder="0"
                              />
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setMultipleScores(prev => ({
                                ...prev,
                                'redTeam': [...(prev['redTeam'] || []), 0]
                              }))}
                              className="w-6 h-6 flex items-center justify-center"
                            >
                              <Plus size={18} className="text-gray-600" weight="bold" />
                            </button>
                            <button
                              onClick={() => setMultipleScores(prev => ({
                                ...prev,
                                'redTeam': prev['redTeam']?.slice(0, -1) || []
                              }))}
                              disabled={(multipleScores['redTeam'] || [0]).length <= 1}
                              className={`w-6 h-6 flex items-center justify-center ${
                                (multipleScores['redTeam'] || [0]).length <= 1 
                                  ? 'opacity-30 cursor-not-allowed' 
                                  : ''
                              }`}
                            >
                              <Minus size={18} className="text-gray-600" weight="bold" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Single Score Mode for Teams - Direct input field */
                        <div className="flex items-center justify-center">
                          <input
                            type="text"
                            value={currentScores['redTeam'] || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setCurrentScores(prev => ({
                                ...prev,
                                'redTeam': Math.max(0, value)
                              }));
                            }}
                            className="w-20 h-10 bg-white border-2 rounded-lg text-center font-medium text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            style={{ borderColor: 'rgba(134, 189, 255, 0.4)' }}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blue Team Score Input */}
                  <div className="flex flex-col space-y-2 items-start">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center flex-row">
                        <div className="relative mr-2">
                          {blueTeamPlayers && blueTeamPlayers.length > 0 ? (
                            <div className="flex -space-x-1">
                              {blueTeamPlayers.slice(0, 2).map((player, index) => (
                                <div
                                  key={player._id}
                                  className="relative"
                                  style={{ zIndex: Math.min(blueTeamPlayers.length - index, 5) }}
                                >
                                  {player.avatar ? (
                                    <img
                                      src={player.avatar}
                                      alt={player.name}
                                      className="w-6 h-6 rounded-full object-cover border border-white"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border border-white">
                                      <span className="text-blue-600 font-semibold text-xs">{player.initial}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {blueTeamPlayers.length > 2 && (
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center border border-white">
                                  <span className="text-gray-600 font-semibold text-xs">+{blueTeamPlayers.length - 2}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-xs">M</span>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-800 text-sm">
                          {blueTeamPlayers?.map(p => p.name).join(', ') || 'Mavi Takım'}
                        </span>
                      </div>
                      
                      {gameSave?.settings.calculationMode === 'NoPoints' ? (
                        /* Crown Mode for Teams */
                        <button
                          onClick={() => {
                            setCrownWinners(prev => ({
                              ...prev,
                              'blueTeam': !prev['blueTeam']
                            }));
                          }}
                          className={`p-1 ${
                            crownWinners['blueTeam'] 
                              ? 'text-blue-600' 
                              : 'text-gray-400'
                          }`}
                        >
                          <CrownSimple size={20} weight="fill" />
                        </button>
                      ) : gameSave?.settings.pointsPerRound === 'Multiple' ? (
                        /* Multiple Scores Mode for Teams - Multiple input fields with horizontal buttons */
                        <div className="flex flex-col items-center space-y-2">
                          {(multipleScores['blueTeam'] || [0]).map((score, scoreIndex) => (
                            <div key={scoreIndex} className="flex flex-col items-center space-y-1">
                              <input
                                type="text"
                                value={score || ''}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setMultipleScores(prev => {
                                    const currentScores = prev['blueTeam'] || [0];
                                    const updatedScores = [...currentScores];
                                    updatedScores[scoreIndex] = Math.max(0, value);
                                    return {
                                      ...prev,
                                      'blueTeam': updatedScores
                                    };
                                  });
                                }}
                                className="w-24 h-12 bg-white border-2 rounded-lg text-center font-medium text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{ borderColor: 'rgba(134, 189, 255, 0.4)' }}
                                placeholder="0"
                              />
                            </div>
                          ))}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setMultipleScores(prev => ({
                                ...prev,
                                'blueTeam': [...(prev['blueTeam'] || []), 0]
                              }))}
                              className="w-6 h-6 flex items-center justify-center"
                            >
                              <Plus size={18} className="text-gray-600" weight="bold" />
                            </button>
                            <button
                              onClick={() => setMultipleScores(prev => ({
                                ...prev,
                                'blueTeam': prev['blueTeam']?.slice(0, -1) || []
                              }))}
                              disabled={(multipleScores['blueTeam'] || [0]).length <= 1}
                              className={`w-6 h-6 flex items-center justify-center ${
                                (multipleScores['blueTeam'] || [0]).length <= 1 
                                  ? 'opacity-30 cursor-not-allowed' 
                                  : ''
                              }`}
                            >
                              <Minus size={18} className="text-gray-600" weight="bold" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Single Score Mode for Teams - Direct input field */
                        <div className="flex items-center justify-center">
                          <input
                            type="text"
                            value={currentScores['blueTeam'] || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setCurrentScores(prev => ({
                                ...prev,
                                'blueTeam': Math.max(0, value)
                              }));
                            }}
                            className="w-20 h-10 bg-white border-2 rounded-lg text-center font-medium text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            style={{ borderColor: 'rgba(134, 189, 255, 0.4)' }}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                // Individual Mode - Show Individual Players for Score Input
                gamePlayers.map((player, index) => (
                <div key={player._id} className={`flex flex-col space-y-2 ${
                  index % 2 === 0 ? 'items-end' : 'items-start'
                }`}>
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`flex items-center ${
                      gameSave?.settings.calculationMode === 'NoPoints' ? 'justify-center' : ''
                    }`}>
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-6 h-6 rounded-full object-cover mr-2"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-blue-600 font-semibold text-xs">{player.initial}</span>
                        </div>
                      )}
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
                    ) : gameSave?.settings.pointsPerRound === 'Multiple' ? (
                      /* Multiple Scores Mode - Multiple input fields with horizontal buttons */
                      <div className="flex flex-col items-center space-y-2">
                        {(multipleScores[player._id] || [0]).map((score, scoreIndex) => (
                          <div key={scoreIndex} className="flex flex-col items-center space-y-1">
                            <input
                              type="text"
                              value={score || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                updateMultipleScore(player._id, scoreIndex, value);
                              }}
                              className="w-24 h-12 bg-white border-2 rounded-lg text-center font-medium text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              style={{ borderColor: 'rgba(134, 189, 255, 0.4)' }}
                              placeholder="0"
                            />
                            
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                               <button
                                 onClick={() => addScoreInput(player._id)}
                                 className="w-6 h-6 flex items-center justify-center"
                               >
                                 <Plus size={18} className="text-gray-600" weight="bold" />
                               </button>
                               <button
                                 onClick={() => removeScoreInput(player._id)}
                                 disabled={(multipleScores[player._id] || [0]).length <= 1}
                                 className={`w-6 h-6 flex items-center justify-center ${
                                   (multipleScores[player._id] || [0]).length <= 1 
                                     ? 'opacity-30 cursor-not-allowed' 
                                     : ''
                                 }`}
                               >
                                 <Minus size={18} className="text-gray-600" weight="bold" />
                               </button>
                             </div>
                      </div>
                    ) : (
                      /* Single Score Mode - Direct input field */
                      <div className="flex items-center justify-center">
                        <input
                          type="text"
                          value={currentScores[player._id] || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setCurrentScores(prev => ({
                              ...prev,
                              [player._id]: Math.max(0, value)
                            }));
                          }}
                          className="w-20 h-10 bg-white border-2 rounded-lg text-center font-medium text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          style={{ borderColor: 'rgba(134, 189, 255, 0.4)' }}
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={endRound}
              className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg font-medium text-center hover:bg-blue-600"
            >
              {getNextRoundNumber()}. Turu Bitir
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`ml-2 w-12 h-12 rounded-xl flex items-center justify-center ${
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
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText="İptal"
        isDestructive={confirmModalConfig.isDestructive}
      />
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
