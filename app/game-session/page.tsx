'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, Plus, Minus, Gear, CrownSimple, Trash, ArrowCounterClockwise, X, ChartBar, ListBullets, ChatCircle, Spade } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import GameRulesTab from '@/components/GameRulesTab';
import GameAskTab from '@/components/GameAskTab';
import PokerAssistantTab from '@/components/PokerAssistantTab';
import BottomInputArea from '@/components/BottomInputArea';
import { useInterstitialAd } from '@/components/InterstitialAd';
import AdBanner from '@/components/AdBanner'; 

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
  const [roundCount, setRoundCount] = useState(0);

  // Initialize interstitial ad
  const { showInterstitial, isAdReady } = useInterstitialAd({
    onAdClosed: () => {
      console.log('Interstitial ad closed');
    },
    onAdFailedToLoad: (error) => {
      console.log('Interstitial ad failed to load:', error);
    }
  });

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
    // Show interstitial ad when navigating back (if ad is ready)
    if (isAdReady) {
      showInterstitial().then(() => {
        // Navigate after ad is shown
        router.push('/history');
      });
    } else {
      // Navigate immediately if ad is not ready
      router.push('/history');
    }
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
    if (!gameSaveId) return;
    
    // Check if it's team mode and has teamLaps
    if (gameSave?.settings.gameplay === 'takimli') {
      if (!gameSave?.teamLaps || gameSave.teamLaps.length === 0) return;
      
      try {
        // Remove the last round from teamLaps
        const updatedTeamLaps = gameSave.teamLaps.slice(0, -1);
        
        await updateGameSave({
          id: gameSaveId as Id<'gameSaves'>,
          teamLaps: updatedTeamLaps
        });
      } catch (error) {
        console.error('Error undoing last team round:', error);
      }
    } else {
      // Individual mode - use laps
      if (!gameSave?.laps || gameSave.laps.length === 0) return;
      
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
        console.error('Error undoing last individual round:', error);
      }
    }
  };

  const resetAllRounds = async () => {
    if (!gameSaveId) return;
    
    try {
      if (gameSave?.settings.gameplay === 'takimli') {
        // Team mode - reset teamLaps
        await updateGameSave({
          id: gameSaveId as Id<'gameSaves'>,
          teamLaps: []
        });
      } else {
        // Individual mode - reset laps
        await updateGameSave({
          id: gameSaveId as Id<'gameSaves'>,
          laps: []
        });
      }
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
      setShowConfirmModal(false);
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
      
      // Increment round count and show interstitial ad every 3 rounds
      setRoundCount(prev => {
        const newCount = prev + 1;
        if (newCount % 3 === 0 && isAdReady) {
          // Show interstitial ad after every 3 rounds
          setTimeout(() => {
            showInterstitial();
          }, 1000); // Small delay to let the UI update
        }
        return newCount;
      });
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
      
      // Sum all individual scores from all rounds
      let totalSum = 0;
      gameSave.teamLaps.forEach((roundScores: (number | number[])[]) => {
        if (Array.isArray(roundScores) && roundScores[teamIndex] !== undefined) {
          const teamScore = roundScores[teamIndex];
          if (Array.isArray(teamScore)) {
            totalSum += teamScore.reduce((sum, score) => sum + score, 0);
          } else {
            totalSum += (teamScore || 0);
          }
        }
      });
      
      // Return the sum for total column
      return totalSum;
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
          // Return comma-separated individual scores instead of sum
          return teamScore.join(', ');
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
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('puan-tablosu')}
              className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 flex-shrink-0 ${
                activeTab === 'puan-tablosu'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600'
              }`}
            >
              <ChartBar size={16} />
              <span>Puanlar</span>
            </button>
            {gameSave?.gameTemplate === 'j973hj02fpn4jjr9txpb84fy717rfekq' && (
              <button
                onClick={() => setActiveTab('poker-helper')}
                className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 flex-shrink-0 ${
                  activeTab === 'poker-helper'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600'
                }`}
              >
                <Spade size={16} />
                <span>Poker</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('kural-sor')}
              className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 flex-shrink-0 ${
                activeTab === 'kural-sor'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600'
              }`}
            >
              <ChatCircle size={16} />
              <span>Sor</span>
            </button>
            <button
              onClick={() => setActiveTab('tum-kurallar')}
              className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 flex-shrink-0 ${
                activeTab === 'tum-kurallar'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600'
              }`}
            >
              <ListBullets size={16} />
              <span>Kurallar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-32 pb-6" style={{ minHeight: 'calc(100vh - 140px)' }}>
        {activeTab === 'puan-tablosu' ? (
          <>
            {/* Banner Ad above score table */}
            <AdBanner position="top" className="mb-4 mx-4" />
            
            {/* Score Table - Full height, horizontally scrollable */}
            <div className="flex-1 overflow-x-auto overflow-y-auto">
              <div className="min-w-full">
                {/* Table - Column by Column Rendering */}
                <div className="px-2 py-2 flex min-w-max">
                  {/* Player/Team Names Column */}
                  <div className="flex flex-col">
                    <div className="py-4"></div> {/* Header spacer */}
                    {gameSave?.settings.gameplay === 'takimli' ? (
                      <>
                        {/* Red Team */}
                        <div className="pb-1 pt-3.5 pl-4 pr-2 flex items-center border-b border-gray-100">
                          <div className="flex items-center min-w-[120px] flex-1">
                            <div className="relative mr-3">
                              {redTeamPlayers && redTeamPlayers.length > 0 ? (
                                <div className="flex -space-x-2">
                                  {redTeamPlayers.slice(0, 3).map((player, index) => (
                                    <div
                                      key={player._id}
                                      className="relative"
                                      style={{ zIndex: 10 + redTeamPlayers.length - index }}
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
                            <span className="font-medium truncate max-w-[100px]" style={{ color: 'var(--secondary-color)' }}>
                              {redTeamPlayers?.map(p => p.name).join(', ') || 'Kırmızı Takım'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Blue Team */}
                        <div className="py-2 pl-4 pr-2 flex items-center">
                          <div className="flex items-center min-w-[180px] flex-1">
                            <div className="relative mr-3">
                              {blueTeamPlayers && blueTeamPlayers.length > 0 ? (
                                <div className="flex -space-x-2">
                                  {blueTeamPlayers.slice(0, 3).map((player, index) => (
                                    <div
                                      key={player._id}
                                      className="relative"
                                      style={{ zIndex: 10 + blueTeamPlayers.length - index }}
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
                            <span className="font-medium truncate max-w-[100px]" style={{ color: 'var(--secondary-color)' }}>
                              {blueTeamPlayers?.map(p => p.name).join(', ') || 'Mavi Takım'}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      gamePlayers.map((player, index) => (
                        <div key={player._id} className={`pt-3 pb-0.5 pl-4 pr-2 flex items-center ${index < gamePlayers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <div className="flex items-center min-w-[120px]">
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
                        </div>
                      ))
                    )}
                  </div>

                  {/* Total Column */}
                  {!gameSave?.settings.hideTotalColumn && (
                    <div className="flex flex-col">
                      <div className="py-2 px-4 font-medium flex items-center justify-center" style={{ color: 'var(--secondary-color)' }}>Toplam</div>
                      {gameSave?.settings.gameplay === 'takimli' ? (
                        <>
                          <div className="py-2.5 px-4 flex items-center justify-center border-b border-gray-100">
                            <div className="font-medium" style={{ color: 'var(--secondary-color)' }}>
                              {getTeamTotalScore(redTeamPlayers || [])}
                            </div>
                          </div>
                          <div className="py-2.5 px-4 flex items-center justify-center">
                            <div className="font-medium" style={{ color: 'var(--secondary-color)' }}>
                              {getTeamTotalScore(blueTeamPlayers || [])}
                            </div>
                          </div>
                        </>
                      ) : (
                        gamePlayers.map((player, index) => (
                          <div key={player._id} className={`py-2.5 px-4 flex items-center justify-center ${index < gamePlayers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div className="font-medium" style={{ color: 'var(--secondary-color)' }}>
                              {getTotalScore(player._id)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Round Columns */}
                  {roundColumns.map((roundNumber) => (
                    <div key={roundNumber} className="flex flex-col">
                      <div className="py-2 px-4 font-medium flex items-center justify-center" style={{ color: 'var(--secondary-color)' }}>
                        {roundNumber}. Tur
                      </div>
                      {gameSave?.settings.gameplay === 'takimli' ? (
                        <>
                          <div className="py-2.5 px-4 flex items-center justify-center border-b border-gray-100">
                            <div className="text-gray-600 font-medium">
                              {gameSave?.settings.calculationMode === 'NoPoints' ? (
                                getTeamRoundScore(redTeamPlayers || [], roundNumber) === 1 ? (
                                  <CrownSimple size={16} weight="fill" className="text-gray-500 mx-auto" />
                                ) : '-'
                              ) : (
                                getTeamRoundScore(redTeamPlayers || [], roundNumber) || '-'
                              )}
                            </div>
                          </div>
                          <div className="py-2.5 px-4 flex items-center justify-center">
                            <div className="text-gray-600 font-medium">
                              {gameSave?.settings.calculationMode === 'NoPoints' ? (
                                getTeamRoundScore(blueTeamPlayers || [], roundNumber) === 1 ? (
                                  <CrownSimple size={16} weight="fill" className="text-gray-500 mx-auto" />
                                ) : '-'
                              ) : (
                                getTeamRoundScore(blueTeamPlayers || [], roundNumber) || '-'
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        gamePlayers.map((player, index) => (
                          <div key={player._id} className={`py-2.5 px-4 flex items-center justify-center ${index < gamePlayers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div className="text-gray-600 font-medium">
                              {gameSave?.settings.calculationMode === 'NoPoints' ? (
                                getRoundScores(player._id, roundNumber) === 1 ? (
                                  <CrownSimple size={16} weight="fill" className="text-gray-500 mx-auto" />
                                ) : '-'
                              ) : (
                                getRoundScores(player._id, roundNumber) || '-'
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </>
        ) : activeTab === 'tum-kurallar' ? (
          <GameRulesTab gameId={gameSave.gameTemplate} />
        ) : activeTab === 'kural-sor' ? (
          <GameAskTab gameId={gameSave.gameTemplate} />
        ) : activeTab === 'poker-helper' ? (
          <PokerAssistantTab />
        ) : null}
      </div>

      {/* Fixed Bottom Area - Now using BottomInputArea component */}
      <BottomInputArea
        activeTab={activeTab}
        gameSave={gameSave}
        gamePlayers={gamePlayers}
        redTeamPlayers={redTeamPlayers}
        blueTeamPlayers={blueTeamPlayers}
        currentScores={currentScores}
        setCurrentScores={setCurrentScores}
        multipleScores={multipleScores}
        setMultipleScores={setMultipleScores}
        crownWinners={crownWinners}
        setCrownWinners={setCrownWinners}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        confirmModalConfig={confirmModalConfig}
        setConfirmModalConfig={setConfirmModalConfig}
        setConfirmAction={setConfirmAction}
        addScoreInput={addScoreInput}
        removeScoreInput={removeScoreInput}
        updateMultipleScore={updateMultipleScore}
        toggleCrown={toggleCrown}
        undoLastRound={undoLastRound}
        resetAllRounds={resetAllRounds}
        toggleHideTotalColumn={toggleHideTotalColumn}
        endRound={endRound}
        getNextRoundNumber={getNextRoundNumber}
        handleConfirmAction={handleConfirmAction}
      />

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
