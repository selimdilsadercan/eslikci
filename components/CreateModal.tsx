'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { X, User, Users } from '@phosphor-icons/react';
import { Drawer } from 'vaul';
import { useAuth } from './FirebaseAuthProvider';

interface CreateModalProps {
  onClose: () => void;
  groups: Array<{
    _id: Id<'groups'>;
    name: string;
    description?: string;
  }>;
}

type ModalType = 'player' | 'group';

export default function CreateModal({ onClose, groups }: CreateModalProps) {
  const [modalType, setModalType] = useState<ModalType>('player');
  
  // Player form state
  const [playerName, setPlayerName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<Id<'groups'>[]>([]);
  
  // Group form state
  const [groupName, setGroupName] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);

  const { user } = useAuth();
  const createPlayer = useMutation(api.players.createPlayer);
  const createGroup = useMutation(api.groups.createGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      if (modalType === 'player') {
        if (!playerName.trim()) return;
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        await createPlayer({
          name: playerName.trim(),
          initial: playerName.trim().charAt(0).toUpperCase(),
          groupId: selectedGroups.length === 1 ? selectedGroups[0] : undefined,
          firebaseId: user.uid,
        });
      } else {
        if (!groupName.trim()) return;
        if (!user) {
          console.error('User not authenticated');
          return;
        }
        await createGroup({
          name: groupName.trim(),
          firebaseId: user.uid,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error creating:', error);
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

  const resetForm = () => {
    setPlayerName('');
    setSelectedGroups([]);
    setGroupName('');
  };

  const handleTypeChange = (type: ModalType) => {
    setModalType(type);
    resetForm();
  };

  const isFormValid = modalType === 'player' 
    ? playerName.trim() 
    : groupName.trim();

  return (
    <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-white h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl">
          <div className="px-6 pb-6">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <Drawer.Title className="text-xl font-bold text-gray-800">
                {modalType === 'player' ? 'Kişi Oluştur' : 'Grup Oluştur'}
              </Drawer.Title>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {/* Type Selection Cards */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleTypeChange('player')}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  modalType === 'player'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Kişi Oluştur</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('group')}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  modalType === 'group'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users size={24} className="text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">Grup Oluştur</span>
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {modalType === 'player' ? (
                <>
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
                </>
              ) : (
                <>
                  {/* Group Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grup Adı
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Grup adını girin"
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>

                </>
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
                  disabled={!isFormValid || isCreating}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                    !isFormValid || isCreating
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
