'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { X, User, Users } from '@phosphor-icons/react';
import { Drawer } from 'vaul';

interface CreatePlayerModalProps {
  onClose: () => void;
  groups: Array<{
    _id: Id<'groups'>;
    name: string;
    description?: string;
  }>;
}

export default function CreatePlayerModal({ onClose, groups }: CreatePlayerModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<Id<'groups'>[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const createPlayer = useMutation(api.players.createPlayer);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setIsCreating(true);
    try {
      await createPlayer({
        name: playerName.trim(),
        initial: playerName.trim().charAt(0).toUpperCase(),
        groupId: selectedGroups.length === 1 ? selectedGroups[0] : undefined,
      });

      onClose();
    } catch (error) {
      console.error('Error creating player:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleGroup = (groupId: Id<'groups'>) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-white h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl">
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-6 pt-4">
              <Drawer.Title className="text-xl font-bold text-gray-800">Kişi Oluştur</Drawer.Title>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Player Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kişi İsmi
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Kişi adını girin"
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  required
                />
              </div>

              {/* Group Selection */}
              {groups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Grup Seçimi
                  </label>
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group._id}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-gray-800">{group.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleGroup(group._id)}
                          className={`w-5 h-5 border-2 flex items-center justify-center ${
                            selectedGroups.includes(group._id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-blue-500'
                          }`}
                        >
                          {selectedGroups.includes(group._id) && (
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!playerName.trim() || isCreating}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                    !playerName.trim() || isCreating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
