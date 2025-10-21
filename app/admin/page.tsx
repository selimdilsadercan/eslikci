'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, Plus, PencilSimple, Trash, GameController, DotsSix, ListBullets, MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react';
import Sidebar from '@/components/Sidebar';
import ImageUpload from '@/components/ImageUpload';
import GameImage from '@/components/GameImage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function AdminPageContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameEmoji, setNewGameEmoji] = useState('');
  const [newGameImageFile, setNewGameImageFile] = useState<Id<'_storage'> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get filter values from URL params
  const selectedListFilter = searchParams.get('list') || 'all';
  const searchTerm = searchParams.get('search') || '';

  // Function to update URL parameters
  const updateUrlParams = (newParams: { list?: string; search?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newParams.list !== undefined) {
      if (newParams.list === 'all') {
        params.delete('list');
      } else {
        params.set('list', newParams.list);
      }
    }
    
    if (newParams.search !== undefined) {
      if (newParams.search === '') {
        params.delete('search');
      } else {
        params.set('search', newParams.search);
      }
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/admin';
    router.push(newUrl);
  };

  // Drag and drop sensors with mobile support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  console.log('Sensors configured:', sensors);

  // Fetch games and lists from Convex - ALWAYS call hooks first
  const games = useQuery(api.games.getGamesWithLists) || [];
  const gameLists = useQuery(api.gameLists.getGameLists) || [];
  const createGame = useMutation(api.games.createGame);
  const deleteGame = useMutation(api.games.deleteGame);
  const updateGameIndices = useMutation(api.games.updateGameIndices);

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Focus input when modal opens
  useEffect(() => {
    if (showAddModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddModal]);

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
        emoji: newGameEmoji.trim(),
        imageFile: newGameImageFile,
        rules: '',
        settings: {
          gameplay: 'herkes-tek',
          calculationMode: 'NoPoints',
          roundWinner: 'Highest',
          scoringTiming: 'tur-sonu',
          hideTotalColumn: false
        }
      });
      
      setNewGameName('');
      setNewGameEmoji('');
      setNewGameImageFile(undefined);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleEditGame = (gameId: Id<'games'>) => {
    router.push(`/admin/edit-game?gameId=${gameId}`);
  };

  const handleManageLists = () => {
    router.push('/admin/lists');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newGameName.trim()) {
      handleAddGame();
    }
  };

  const getRuleSectionsCount = (game: any) => {
    if (!game.rules) return 0;
    
    try {
      // Try to parse as JSON first (structured rules)
      const parsedRules = JSON.parse(game.rules);
      if (Array.isArray(parsedRules)) {
        return parsedRules.length;
      }
    } catch (e) {
      // If not JSON, count HTML sections or return 0
      return 0;
    }
    
    return 0;
  };

  // Filter games based on search term and list filter
  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesList = selectedListFilter === 'all' || game.listName === selectedListFilter;
    return matchesSearch && matchesList;
  });

  // Get unique list names for filter dropdown
  const uniqueListNames = Array.from(new Set(games.map(game => game.listName))).sort();



  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('Drag end event:', { active: active.id, over: over?.id });

    if (active.id !== over?.id && over?.id) {
      const oldIndex = filteredGames.findIndex((game) => game._id === active.id);
      const newIndex = filteredGames.findIndex((game) => game._id === over.id);

      console.log('Indices:', { oldIndex, newIndex });

      if (oldIndex === -1 || newIndex === -1) {
        console.error('Could not find game indices');
        return;
      }

      const newGames = arrayMove(filteredGames, oldIndex, newIndex);

      // Update indices
      const updates = newGames.map((game, index) => ({
        id: game._id,
        index: index
      }));

      console.log('Updates to send:', updates);

      try {
        await updateGameIndices({ updates });
        console.log('Successfully updated game order');
      } catch (error) {
        console.error('Error updating game order:', error);
      }
    }
  };

  // Sortable item component
  function SortableItem({ game, onEdit, onDelete }: { 
    game: any; 
    onEdit: (id: Id<'games'>) => void; 
    onDelete: (id: Id<'games'>) => void; 
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: game._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    console.log('SortableItem rendered for game:', game._id, 'isDragging:', isDragging);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`px-6 py-4 hover:bg-gray-50 transition-colors select-none ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-1">
            <div className="flex items-center justify-center">
              <div 
                className="p-2 rounded hover:bg-gray-100 cursor-move touch-manipulation select-none"
                style={{ touchAction: 'none' }}
                {...attributes}
                {...listeners}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DotsSix size={20} className="text-gray-800" />
              </div>
            </div>
          </div>
          <div className="col-span-4 md:col-span-4">
            <div className="flex items-center gap-2">
              <GameImage game={game} size="sm" />
              <h3 className="text-sm font-medium text-gray-900">
                {game.name}
              </h3>
            </div>
          </div>
          <div className="hidden md:block col-span-2">
            <div className="flex items-center justify-start">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {game.listName}
              </span>
            </div>
          </div>
          <div className="hidden md:block col-span-2">
            <div className="flex items-center justify-start">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getRuleSectionsCount(game)} bölüm
              </span>
            </div>
          </div>
          <div className="col-span-5 md:col-span-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(game._id)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
              >
                <PencilSimple size={16} weight="regular" />
              </button>
              <button
                onClick={() => onDelete(game._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash size={16} weight="regular" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Sidebar for wide screens */}
      <Sidebar currentPage="admin" />
      
      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 lg:left-64 bg-white shadow-sm z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} weight="regular" className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Oyunlar</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManageLists}
              className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              <ListBullets size={20} weight="regular" />
              <span>Listeler</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus size={20} weight="regular" />
              <span>Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Games Table - Add top padding to account for fixed header */}
      <div className="px-6 py-6 pt-24">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Mevcut Oyunlar ({filteredGames.length})</h2>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlass size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => updateUrlParams({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Oyun adı ara..."
            />
          </div>
          
          {/* List Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelSimple size={20} className="text-gray-400" />
            </div>
            <select
              value={selectedListFilter}
              onChange={(e) => updateUrlParams({ list: e.target.value })}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none text-gray-800"
            >
              <option value="all" className="text-gray-800 bg-white">Tüm Listeler</option>
              {uniqueListNames.map(listName => (
                <option key={listName} value={listName} className="text-gray-800 bg-white">{listName}</option>
              ))}
            </select>
          </div>
        </div>
        
        {filteredGames.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg">
            <GameController size={48} weight="regular" className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {games.length === 0 ? 'Henüz oyun eklenmemiş' : 'Arama kriterlerinize uygun oyun bulunamadı'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1 text-sm font-medium text-gray-700">
                  
                </div>
                <div className="col-span-4 md:col-span-4 text-sm font-medium text-gray-700">
                  Oyun Adı
                </div>
                <div className="hidden md:block col-span-2 text-sm font-medium text-gray-700">
                  Liste
                </div>
                <div className="hidden md:block col-span-2 text-sm font-medium text-gray-700">
                  Kurallar
                </div>
                <div className="col-span-5 md:col-span-3 text-sm font-medium text-gray-700">
                  İşlemler
                </div>
              </div>
            </div>
            
            {/* Table Body */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(event) => {
                console.log('Drag started:', event.active.id);
              }}
              onDragOver={(event) => {
                console.log('Drag over:', event.active.id, 'over:', event.over?.id);
              }}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredGames.map(game => game._id)} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-gray-200">
                  {filteredGames.map((game) => (
                    <SortableItem
                      key={game._id}
                      game={game}
                      onEdit={handleEditGame}
                      onDelete={handleDeleteGame}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
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
                  ref={inputRef}
                  type="text"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Oyun adını girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emoji
                </label>
                <input
                  type="text"
                  value={newGameEmoji}
                  onChange={(e) => setNewGameEmoji(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="🎮"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resim Dosyası Yükle
                </label>
                <ImageUpload
                  value={newGameImageFile}
                  onChange={setNewGameImageFile}
                  previewSize="sm"
                  accept="image/*"
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
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
