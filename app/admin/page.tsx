'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { ArrowLeft, Plus, PencilSimple, Trash, GameController } from '@phosphor-icons/react';

export default function AdminPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');

  // Fetch games from Convex - ALWAYS call hooks first
  const games = useQuery(api.games.getGames) || [];
  const createGame = useMutation(api.games.createGame);
  const deleteGame = useMutation(api.games.deleteGame);

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

  const handleBack = () => {
    router.push('/profile');
  };

  const handleAddGame = async () => {
    if (!newGameName.trim()) return;

    try {
      await createGame({
        name: newGameName.trim(),
        description: '',
        rules: '',
        banner: '',
        settings: {
          gameplay: 'herkes-tek',
          calculationMode: 'NoPoints',
          roundWinner: 'OnePoint',
          hideTotalColumn: false
        }
      });
      
      setNewGameName('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleEditGame = (gameId: Id<'games'>) => {
    router.push(`/admin/edit-game?gameId=${gameId}`);
  };

  const handleDeleteGame = async (gameId: Id<'games'>) => {
    if (confirm('Bu oyunu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteGame({ id: gameId });
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} weight="regular" className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Admin</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <Plus size={20} weight="regular" />
            <span>Ekle</span>
          </button>
        </div>
      </div>

      {/* Games List */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Mevcut Oyunlar ({games.length})</h2>
          </div>
          
          {games.length === 0 ? (
            <div className="p-8 text-center">
              <GameController size={48} weight="regular" className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz oyun eklenmemiş</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {games.map((game) => (
                <div key={game._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {game.name}
                      </h3>
                      {game.description && (
                        <p className="text-gray-600 text-sm mb-2">{game.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Oyun Modu: {game.settings.gameplay}</span>
                        <span>Hesaplama: {game.settings.calculationMode}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditGame(game._id)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <PencilSimple size={18} weight="regular" />
                      </button>
                      <button
                        onClick={() => handleDeleteGame(game._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash size={18} weight="regular" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* Add Game Modal */}
        {showAddModal && (
          <div 
            className="fixed inset-0 bg-[#00000080] flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <div 
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Yeni Oyun Ekle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oyun Adı *
                </label>
                <input
                  type="text"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Oyun adını girin"
                />
              </div>

            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddGame}
                disabled={!newGameName.trim()}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
