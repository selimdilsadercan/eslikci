'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Plus, PencilSimple } from '@phosphor-icons/react';
import CreateModal from '../../components/CreateModal';
import EditPlayerModal from '../../components/EditPlayerModal';

export default function ContactsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Id<'players'> | null>(null);

  // Get all players and groups
  const players = useQuery(api.players.getPlayers);
  const groups = useQuery(api.groups.getGroups);
  const currentUserAsPlayer = useQuery(api.players.getCurrentUserAsPlayer);

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
    <>
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
        {currentUserAsPlayer && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Ben</h2>
            <div className="space-y-1">
              <div
                onClick={() => handleEditPlayer(currentUserAsPlayer._id)}
                className="flex items-center justify-between py-2 bg-white rounded-lg px-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{currentUserAsPlayer.initial}</span>
                  </div>
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
        )}
        
        {/* Ungrouped Players */}
        {groupedPlayers.ungrouped && groupedPlayers.ungrouped.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-600 mb-3">Gruplandırılmamış</h2>
            <div className="space-y-1">
              {groupedPlayers.ungrouped.map((player) => (
                <div
                  key={player._id}
                  onClick={() => handleEditPlayer(player._id)}
                  className="flex items-center justify-between py-2 bg-white rounded-lg px-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                    </div>
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
                    onClick={() => handleEditPlayer(player._id)}
                    className="flex items-center justify-between py-2 bg-white rounded-lg px-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{player.initial}</span>
                      </div>
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
          );
        })}

        {/* Empty State */}
        {(!players || players.length === 0) && !currentUserAsPlayer && (
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
    </>
  );
}