'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Plus, PencilSimple } from '@phosphor-icons/react';
import CreateModal from '@/components/CreateModal';
import EditPlayerModal from '@/components/EditPlayerModal';
import AppBar from '@/components/AppBar';

export default function ContactsPage() {
  const { isSignedIn, isLoaded, user } = useAuth();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Id<'players'> | null>(null);

  // Get all players and groups - ALWAYS call hooks first
  const players = useQuery(api.players.getPlayers, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const groups = useQuery(api.groups.getGroups, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const currentUser = useQuery(api.users.getUserByFirebaseId, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );
  const currentUserAsPlayer = useQuery(api.players.getPlayerByUserId, 
    currentUser ? { userId: currentUser._id } : "skip"
  );

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
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

  // Group players by their group
  const groupedPlayers = players?.reduce((acc, player) => {
    const groupId = player.groupId || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(player);
    return acc;
  }, {} as Record<string, typeof players>) || {};

  const handleEditPlayer = (playerId: Id<'players'>) => {
    setSelectedPlayer(playerId);
    setShowEditModal(true);
  };


  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Rehber</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="text-blue-500 font-medium"
          >
            Ekle
          </button>
        </div>

        {/* Current User */}
        {currentUserAsPlayer === undefined ? (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Ben</h2>
            <div className="space-y-2">
              <div 
                className="flex items-center justify-between py-2 bg-white rounded-lg px-3"
                style={{ boxShadow: '0 0 8px 5px #297dff0a' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : currentUserAsPlayer ? (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Ben</h2>
            <div className="space-y-2">
              <div
                onClick={() => handleEditPlayer(currentUserAsPlayer._id)}
                className="flex items-center justify-between py-2 bg-white rounded-lg px-3 style={{ boxShadow: '0 0 8px 5px #297dff0a' }} cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {currentUserAsPlayer.avatar ? (
                    <img  
                      src={currentUserAsPlayer.avatar}
                      alt={currentUserAsPlayer.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center relative">
                      <span className="text-blue-600 font-semibold text-sm">{currentUserAsPlayer.initial}</span>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">+</span>
                      </div>
                    </div>
                  )}
                  <span className="font-medium text-black">{currentUserAsPlayer.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPlayer(currentUserAsPlayer._id);
                  }}
                  className="p-1 text-gray-500 hover:text-blue-500"
                >
                  <PencilSimple size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Ungrouped Players */}
        {players === undefined ? (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Gruplandırılmamış</h2>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-2 bg-white rounded-lg px-3 style={{ boxShadow: '0 0 8px 5px #297dff0a' }}">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : groupedPlayers.ungrouped && groupedPlayers.ungrouped.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Gruplandırılmamış</h2>
            <div className="space-y-2">
              {groupedPlayers.ungrouped.map((player) => (
                <div
                  key={player._id}
                  onClick={() => handleEditPlayer(player._id)}
                  className="flex items-center justify-between py-2 bg-white rounded-lg px-3 style={{ boxShadow: '0 0 8px 5px #297dff0a' }} cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center relative">
                        <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">+</span>
                        </div>
                      </div>
                    )}
                    <span className="font-medium text-black">{player.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPlayer(player._id);
                    }}
                    className="p-1 text-gray-500 hover:text-blue-500"
                  >
                    <PencilSimple size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Grouped Players */}
        {groups === undefined ? (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Gruplar</h2>
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-2 bg-white rounded-lg px-3 style={{ boxShadow: '0 0 8px 5px #297dff0a' }}">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ) : groups.length > 0 ? (
          groups.map((group) => {
            const groupPlayers = groupedPlayers[group._id] || [];
            
            return (
              <div key={group._id} className="mb-6">
                <h2 className="text-sm font-medium text-gray-600 mb-3">{group.name}</h2>
                <div className="space-y-2">
                  {groupPlayers.length > 0 ? (
                    groupPlayers.map((player) => (
                      <div
                        key={player._id}
                        onClick={() => handleEditPlayer(player._id)}
                        className="flex items-center justify-between py-2 bg-white rounded-lg px-3 style={{ boxShadow: '0 0 8px 5px #297dff0a' }} cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={player.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center relative">
                              <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">+</span>
                              </div>
                            </div>
                          )}
                          <span className="font-medium text-black">{player.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPlayer(player._id);
                          }}
                          className="p-1 text-gray-500 hover:text-blue-500"
                        >
                          <PencilSimple size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-gray-500 text-sm">
                      Bu grupta henüz kişi yok
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : null}

        {/* Empty State */}
        {players !== undefined && players.length === 0 && !currentUserAsPlayer && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Henüz kişi eklenmemiş</h3>
            <p className="text-gray-500 mb-4">İlk kişinizi ekleyerek başlayın</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium"
            >
              Kişi Ekle
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          groups={groups || []}
        />
      )}

      {showEditModal && selectedPlayer && (
        <EditPlayerModal
          playerId={selectedPlayer}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPlayer(null);
          }}
          groups={groups || []}
        />
      )}

      {/* App Bar */}
      <AppBar activePage="contacts" />
    </div>
  );
}