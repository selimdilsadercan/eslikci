'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, FloppyDisk, X, Plus } from '@phosphor-icons/react';
import RichTextEditor from '@/components/RichTextEditor';

function EditGameContent() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId') as Id<'games'>;

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
  
  const [gameName, setGameName] = useState('');
  const [gameCategory, setGameCategory] = useState('');
  const [gameEmoji, setGameEmoji] = useState('');
  const [gameRules, setGameRules] = useState('');
  const [rulesSections, setRulesSections] = useState<Array<{id: string, title: string, content: string}>>([]);
  const [gameplay, setGameplay] = useState('herkes-tek');
  const [calculationMode, setCalculationMode] = useState('NoPoints');
  const [roundWinner, setRoundWinner] = useState('Highest');
  const [pointsPerRound, setPointsPerRound] = useState('Single');
  const [hideTotalColumn, setHideTotalColumn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('genel');

  // Fetch game data
  const game = useQuery(api.games.getGameById, gameId ? { id: gameId } : "skip");
  const updateGame = useMutation(api.games.updateGame);

  // Populate form when game data loads
  useEffect(() => {
    if (game) {
      setGameName(game.name);
      setGameCategory(game.category || '');
      setGameEmoji(game.emoji || '');
      setGameRules(game.rules || '');
      setGameplay(game.settings?.gameplay || 'herkes-tek');
      setCalculationMode(game.settings?.calculationMode || 'NoPoints');
      setRoundWinner(game.settings?.roundWinner || 'Highest');
      setPointsPerRound((game.settings as any)?.pointsPerRound || 'Single');
      setHideTotalColumn(game.settings?.hideTotalColumn || false);
      
      // Parse rules sections if they exist
      if (game.rules) {
        try {
          const parsed = JSON.parse(game.rules);
          if (Array.isArray(parsed)) {
            setRulesSections(parsed);
          }
        } catch {
          // If not JSON, treat as plain text
          setRulesSections([{id: '1', title: 'Genel Kurallar', content: game.rules}]);
        }
      }
    }
  }, [game]);

  const handleBack = () => {
    router.push('/admin');
  };

  const addRulesSection = () => {
    const newSection = {
      id: Date.now().toString(),
      title: '',
      content: ''
    };
    setRulesSections([...rulesSections, newSection]);
  };

  const updateRulesSection = (id: string, field: 'title' | 'content', value: string) => {
    setRulesSections(sections => 
      sections.map(section => 
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const removeRulesSection = (id: string) => {
    setRulesSections(sections => sections.filter(section => section.id !== id));
  };

  const handleSave = async () => {
    if (!gameName.trim() || !gameId) return;

    setIsLoading(true);
    try {
      await updateGame({
        id: gameId,
        name: gameName.trim(),
        category: gameCategory.trim(),
        emoji: gameEmoji.trim(),
        rules: JSON.stringify(rulesSections),
        settings: {
          gameplay,
          calculationMode,
          roundWinner,
          pointsPerRound,
          hideTotalColumn,
        }
      });
      
      router.push('/admin');
    } catch (error) {
      console.error('Error updating game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-800">Oyunu Düzenle</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={!gameName.trim() || isLoading}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
          >
            <FloppyDisk size={20} weight="regular" />
            <span>{isLoading ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('genel')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'genel'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Genel Ayarlar
          </button>
          <button
            onClick={() => setActiveTab('kurallar')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'kurallar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Kurallar
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-6">
        {activeTab === 'genel' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Temel Bilgiler</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oyun Adı *
                  </label>
                  <input
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Oyun adını girin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={gameCategory}
                    onChange={(e) => setGameCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Oyun kategorisini girin (örn: Kart Oyunu, Strateji, vb.)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={gameEmoji}
                    onChange={(e) => setGameEmoji(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Oyun emojisini girin (örn: 🎮, 🃏, ⚡)"
                    maxLength={2}
                  />
                </div>

              </div>
            </div>

            {/* Game Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Oyun Ayarları</h3>
              
              <div className="space-y-6">
                {/* Oynanış */}
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800 whitespace-nowrap">Oynanış:</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGameplay('herkes-tek')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        gameplay === 'herkes-tek'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={gameplay === 'herkes-tek' ? { backgroundColor: '#365376' } : {}}
                    >
                      Herkes Tek
                    </button>
                    <button
                      onClick={() => setGameplay('takimli')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        gameplay === 'takimli'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={gameplay === 'takimli' ? { backgroundColor: '#365376' } : {}}
                    >
                      Takımlı
                    </button>
                  </div>
                </div>

                {/* Hesaplama Modu */}
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800 whitespace-nowrap">Hesaplama Modu:</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCalculationMode('NoPoints')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        calculationMode === 'NoPoints'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={calculationMode === 'NoPoints' ? { backgroundColor: '#365376' } : {}}
                    >
                      Puansız
                    </button>
                    <button
                      onClick={() => setCalculationMode('Points')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        calculationMode === 'Points'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                      style={calculationMode === 'Points' ? { backgroundColor: '#365376' } : {}}
                    >
                      Puanlı
                    </button>
                  </div>
                </div>

                {/* Tur Kazananı - Conditional based on calculation mode */}
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800 whitespace-nowrap">Kazanan:</h2>
                  <div className="flex gap-2">
                    {calculationMode === 'NoPoints' ? (
                      // Options for Puansız mode
                      <>
                        <button
                          onClick={() => setRoundWinner('Highest')}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                            roundWinner === 'Highest'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={roundWinner === 'Highest' ? { backgroundColor: '#365376' } : {}}
                        >
                          <span>↑</span>
                          <span>En Yüksek</span>
                        </button>
                        <button
                          onClick={() => setRoundWinner('Lowest')}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                            roundWinner === 'Lowest'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={roundWinner === 'Lowest' ? { backgroundColor: '#365376' } : {}}
                        >
                          <span>↓</span>
                          <span>En Düşük</span>
                        </button>
                      </>
                    ) : calculationMode === 'Points' ? (
                      // Options for Puanlı mode
                      <>
                        <button
                          onClick={() => setRoundWinner('Highest')}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                            roundWinner === 'Highest'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={roundWinner === 'Highest' ? { backgroundColor: '#365376' } : {}}
                        >
                          <span>↑</span>
                          <span>En Yüksek</span>
                        </button>
                        <button
                          onClick={() => setRoundWinner('Lowest')}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-2 ${
                            roundWinner === 'Lowest'
                              ? 'text-white'
                              : 'text-gray-800'
                          }`}
                          style={roundWinner === 'Lowest' ? { backgroundColor: '#365376' } : {}}
                        >
                          <span>↓</span>
                          <span>En Düşük</span>
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Tur İçi Puan Sayısı - Only show when Puanlı is selected with animation */}
                {calculationMode === 'Points' && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <h2 className="text-sm font-semibold text-gray-800 whitespace-nowrap">Tur İçi Puan Sayısı:</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPointsPerRound('Single')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                          pointsPerRound === 'Single'
                            ? 'text-white'
                            : 'text-gray-800'
                        }`}
                        style={pointsPerRound === 'Single' ? { backgroundColor: '#365376' } : {}}
                      >
                        Tek
                      </button>
                      <button
                        onClick={() => setPointsPerRound('Multiple')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                          pointsPerRound === 'Multiple'
                            ? 'text-white'
                            : 'text-gray-800'
                        }`}
                        style={pointsPerRound === 'Multiple' ? { backgroundColor: '#365376' } : {}}
                      >
                        Çok
                      </button>
                    </div>
                  </div>
                )}

                {/* Toplam Sütununu Gizle */}
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800 whitespace-nowrap">Toplam Sütununu Gizle:</h2>
                  <button
                    onClick={() => setHideTotalColumn(!hideTotalColumn)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      hideTotalColumn
                        ? 'border-gray-300'
                        : 'border-gray-300'
                    }`}
                    style={hideTotalColumn ? { backgroundColor: '#365376' } : {}}
                  >
                    {hideTotalColumn && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kurallar' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Oyun Kuralları</h3>
              <button
                onClick={addRulesSection}
                className="flex items-center space-x-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
              >
                <Plus size={16} weight="regular" />
                <span>Bölüm Ekle</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {rulesSections.map((section, index) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-800">
                      Bölüm {index + 1}
                    </h4>
                    <button
                      onClick={() => removeRulesSection(section.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X size={16} weight="regular" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bölüm Başlığı
                      </label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateRulesSection(section.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        placeholder="Örn: TAKIMLARIN OTURMA DÜZENİ"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bölüm İçeriği
                      </label>
                      <RichTextEditor
                        content={section.content}
                        onChange={(content: string) => updateRulesSection(section.id, 'content', content)}
                        placeholder="Bu bölümün kurallarını yazın..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {rulesSections.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Henüz kural bölümü eklenmemiş</p>
                  <p className="text-sm">Yukarıdaki "Bölüm Ekle" butonuna tıklayarak başlayın</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <EditGameContent />
    </Suspense>
  );
}
