'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../../components/FirebaseAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { ArrowLeft, FloppyDisk, X, Plus } from '@phosphor-icons/react';
import RichTextEditor from '../../../components/RichTextEditor';

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
  const [gameRules, setGameRules] = useState('');
  const [rulesSections, setRulesSections] = useState<Array<{id: string, title: string, content: string}>>([]);
  const [gameplay, setGameplay] = useState('herkes-tek');
  const [calculationMode, setCalculationMode] = useState('NoPoints');
  const [roundWinner, setRoundWinner] = useState('OnePoint');
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
      setGameRules(game.rules || '');
      setGameplay(game.settings?.gameplay || 'herkes-tek');
      setCalculationMode(game.settings?.calculationMode || 'NoPoints');
      setRoundWinner(game.settings?.roundWinner || 'OnePoint');
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
        rules: JSON.stringify(rulesSections),
        settings: {
          gameplay,
          calculationMode,
          roundWinner,
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

              </div>
            </div>

            {/* Game Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Oyun Ayarları</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oyun Modu
                  </label>
                  <select
                    value={gameplay}
                    onChange={(e) => setGameplay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="herkes-tek">Herkes Tek</option>
                    <option value="takim">Takım</option>
                    <option value="bireysel">Bireysel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hesaplama Modu
                  </label>
                  <select
                    value={calculationMode}
                    onChange={(e) => setCalculationMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="NoPoints">Puan Yok</option>
                    <option value="Points">Puanlı</option>
                    <option value="Score">Skor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Round Kazananı
                  </label>
                  <select
                    value={roundWinner}
                    onChange={(e) => setRoundWinner(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="OnePoint">Tek Puan</option>
                    <option value="MultiplePoints">Çoklu Puan</option>
                    <option value="ScoreBased">Skor Bazlı</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="hideTotalColumn"
                    checked={hideTotalColumn}
                    onChange={(e) => setHideTotalColumn(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="hideTotalColumn" className="text-sm text-gray-700">
                    Toplam sütununu gizle
                  </label>
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
