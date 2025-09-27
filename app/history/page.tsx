'use client';

import { useEffect } from 'react';
import { useAuth } from '../../components/FirebaseAuthProvider';
import { Trash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import AppBar from '../../components/AppBar';

export default function HistoryPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();

  // Fetch game saves and related data - ALWAYS call hooks first
  // Use the user from Firebase Auth to get the Convex user
  const currentUser = useQuery(api.users.getUserByFirebaseId, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const gameSaves = useQuery(api.gameSaves.getGameSaves, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const players = useQuery(api.players.getPlayers, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const games = useQuery(api.games.getGames);

  // Debug logging
  console.log('History page debug:', {
    isLoaded,
    isSignedIn,
    currentUser,
    gameSaves,
    players,
    games
  });

  const deleteGameSave = useMutation(api.gameSaves.deleteGameSave);

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

  const handleDelete = async (gameSaveId: Id<'gameSaves'>) => {
    if (confirm('Bu oyunu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteGameSave({ id: gameSaveId });
      } catch (error) {
        console.error('Error deleting game save:', error);
      }
    }
  };

  const handleGameClick = (gameSaveId: Id<'gameSaves'>) => {
    // Navigate to game session with the game save ID
    router.push(`/game-session?gameSaveId=${gameSaveId}`);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return date.toLocaleDateString('tr-TR', options);
  };

  const getPlayerInitials = (playerIds: Id<'players'>[]) => {
    if (!players) return [];
    return playerIds
      .map(id => {
        const player = players.find(p => p._id === id);
        return player?.initial || player?.name?.charAt(0).toUpperCase() || '';
      })
      .filter(Boolean);
  };

  const getGameName = (gameTemplateId: Id<'games'>) => {
    if (!games) return 'Oyun';
    const game = games.find(g => g._id === gameTemplateId);
    return game?.name || 'Oyun';
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Main Content */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Oyun Geçmişi</h1>
        
        {/* Game History List */}
        <div className="space-y-2">
          {gameSaves === undefined ? (
            // Skeleton loading for game history
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 flex items-center justify-between"
                style={{
                  boxShadow: '0 0 8px 5px #297dff0a'
                }}
              >
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-40"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))
          ) : gameSaves.length > 0 ? (
            gameSaves.map((gameSave) => {
              const gameName = getGameName(gameSave.gameTemplate);
              const playerInitials = getPlayerInitials(gameSave.players);
              const formattedDate = formatDate(gameSave.createdTime);
              
              return (
                <div
                  key={gameSave._id}
                  className="bg-white rounded-lg p-4 flex items-center justify-between"
                  style={{
                    boxShadow: '0 0 8px 5px #297dff0a'
                  }}
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleGameClick(gameSave._id)}
                  >
                    <h3 className="font-medium text-gray-800 text-lg hover:text-blue-600 transition-colors">{gameName}</h3>
                    <p className="text-gray-600 text-sm">{formattedDate}</p>
                    <div className="flex space-x-1 mt-1">
                      {playerInitials.map((initial, index) => {
                        const colors = [
                          'bg-blue-100 text-blue-600',
                          'bg-green-100 text-green-600', 
                          'bg-purple-100 text-purple-600',
                          'bg-orange-100 text-orange-600',
                          'bg-pink-100 text-pink-600',
                          'bg-indigo-100 text-indigo-600'
                        ];
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <div
                            key={index}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${colorClass}`}
                          >
                            {initial}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(gameSave._id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash size={20} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Henüz oyun geçmişi yok</h3>
              <p className="text-gray-500">İlk oyununuzu oluşturarak başlayın</p>
            </div>
          )}
        </div>
      </div>

      {/* App Bar */}
      <AppBar activePage="history" />
    </div>
  );
}
