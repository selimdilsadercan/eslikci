'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { X } from '@phosphor-icons/react';
import { Drawer } from 'vaul';

interface CreateGroupModalProps {
  onClose: () => void;
}

export default function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createGroup = useMutation(api.groups.createGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsCreating(true);
    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
      });

      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="bg-white h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl">
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-6 pt-4">
              <Drawer.Title className="text-xl font-bold text-gray-800">Grup Oluştur</Drawer.Title>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Group Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama (İsteğe bağlı)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Grup açıklaması girin"
                  rows={3}
                  className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                />
              </div>

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
                  disabled={!groupName.trim() || isCreating}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                    !groupName.trim() || isCreating
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
