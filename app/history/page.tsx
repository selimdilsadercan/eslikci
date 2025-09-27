'use client';

import { Trash } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export default function HistoryPage() {
  const router = useRouter();

  // Fetch game saves and related data
  const currentUser = useQuery(api.users.getCurrentUser);
  const gameSaves = useQuery(api.gameSaves.getGameSaves, 
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const players = useQuery(api.players.getPlayers);
  const games = useQuery(api.games.getGames);

  const deleteGameSave = useMutation(api.gameSaves.deleteGameSave);

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

  const getPlayerNames = (playerIds: Id<'players'>[]) => {
    if (!players) return [];
    return playerIds
      .map(id => players.find(p => p._id === id)?.name)
      .filter(Boolean);
  };

  const getGameName = (gameTemplateId: Id<'games'>) => {
    if (!games) return 'Oyun';
    const game = games.find(g => g._id === gameTemplateId);
    return game?.name || 'Oyun';
  };

  return (
    <>
      {/* Main Content */}
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Oyun Geçmişi</h1>
        
        {/* Game History List */}
        <div className="space-y-4">
          {gameSaves && gameSaves.length > 0 ? (
            gameSaves.map((gameSave) => {
              const gameName = getGameName(gameSave.gameTemplate);
              const playerNames = getPlayerNames(gameSave.players);
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
                    <p className="text-gray-500 text-xs mt-1">
                      Oyuncular: {playerNames.join(', ')}
                    </p>
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
    </>
  );
}
