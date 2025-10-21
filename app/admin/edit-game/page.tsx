'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, FloppyDisk, X, Plus, ListBullets, Check } from '@phosphor-icons/react';
import RichTextEditor from '@/components/RichTextEditor';
import Sidebar from '@/components/Sidebar';
import PdfUpload from '@/components/PdfUpload';
import PdfViewer from '@/components/PdfViewer';

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
  const [gameEmoji, setGameEmoji] = useState('');
  const [gameRules, setGameRules] = useState('');
  const [rulesSections, setRulesSections] = useState<Array<{id: string, title: string, content: string}>>([]);
  const [gameplay, setGameplay] = useState('herkes-tek');
  const [calculationMode, setCalculationMode] = useState('NoPoints');
  const [roundWinner, setRoundWinner] = useState('Highest');
  const [pointsPerRound, setPointsPerRound] = useState('Single');
  const [hideTotalColumn, setHideTotalColumn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rulesMode, setRulesMode] = useState<'text' | 'json'>('text');
  const [activeTab, setActiveTab] = useState('genel');
  const [selectedLists, setSelectedLists] = useState<Id<'gameLists'>[]>([]);
  const [rulesPdfId, setRulesPdfId] = useState<Id<'_storage'> | undefined>(undefined);

  // Fetch game data
  const game = useQuery(api.games.getGameById, gameId ? { id: gameId } : "skip");
  const gameLists = useQuery(api.gameLists.getAllGameLists);
  const updateGame = useMutation(api.games.updateGame);
  const addGamesToList = useMutation(api.gameLists.addGamesToList);
  const removeGamesFromList = useMutation(api.gameLists.removeGamesFromList);

  // Populate form when game data loads
  useEffect(() => {
    if (game) {
      setGameName(game.name);
      setGameEmoji(game.emoji || '');
      setGameRules(game.rules || '');
      setGameplay(game.settings?.gameplay || 'herkes-tek');
      setCalculationMode(game.settings?.calculationMode || 'NoPoints');
      setRoundWinner(game.settings?.roundWinner || 'Highest');
      setPointsPerRound((game.settings as any)?.pointsPerRound || 'Single');
      setHideTotalColumn(game.settings?.hideTotalColumn || false);
      setRulesPdfId(game.rulesPdf);
      
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

  // Load current list assignments
  useEffect(() => {
    if (game && gameLists) {
      const currentLists = gameLists.filter(list => 
        list.gameIds.includes(game._id)
      ).map(list => list._id);
      setSelectedLists(currentLists);
    }
  }, [game, gameLists]);

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

  const convertToJson = () => {
    const jsonRules = JSON.stringify(rulesSections, null, 2);
    setGameRules(jsonRules);
    setRulesMode('json');
  };

  const convertToText = () => {
    try {
      const parsedRules = JSON.parse(gameRules);
      if (Array.isArray(parsedRules)) {
        setRulesSections(parsedRules);
        setRulesMode('text');
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      alert('Geçersiz JSON formatı!');
    }
  };

  const validateAndSaveJson = () => {
    try {
      const parsedRules = JSON.parse(gameRules);
      if (Array.isArray(parsedRules)) {
        // Validate that each rule has required fields
        const isValid = parsedRules.every(rule => 
          rule.id && rule.title && rule.content !== undefined
        );
        
        if (isValid) {
          setRulesSections(parsedRules);
          setRulesMode('text');
        }
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
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

      // Update list assignments
      if (gameLists) {
        const currentLists = gameLists.filter(list => 
          list.gameIds.includes(gameId)
        ).map(list => list._id);
        
        const listsToAdd = selectedLists.filter(id => !currentLists.includes(id));
        const listsToRemove = currentLists.filter(id => !selectedLists.includes(id));

        // Add to new lists
        for (const listId of listsToAdd) {
          await addGamesToList({ listId, gameIds: [gameId] });
        }
        
        // Remove from old lists
        for (const listId of listsToRemove) {
          await removeGamesFromList({ listId, gameIds: [gameId] });
        }
      }
      
      router.push('/admin');
    } catch (error) {
      console.error('Error updating game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUploadComplete = (pdfId: Id<'_storage'>) => {
    setRulesPdfId(pdfId);
  };

  const handlePdfDelete = () => {
    setRulesPdfId(undefined);
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
    <div className="min-h-screen pb-20 lg:pb-0" style={{ backgroundColor: '#f4f6f9' }}>
      {/* Sidebar for wide screens */}
      <Sidebar currentPage="admin" />
      
      {/* Main content area */}
      <div className="lg:ml-64">
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
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
            }`}
          >
            Genel
          </button>
          <button
            onClick={() => setActiveTab('kurallar')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'kurallar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
            }`}
          >
            Kurallar
          </button>
          <button
            onClick={() => setActiveTab('listeler')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'listeler'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
            }`}
          >
            Listeler
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
          <div className="space-y-6">
            {/* PDF Upload Section */}
            <PdfUpload
              gameId={gameId}
              currentPdfId={rulesPdfId}
              onUploadComplete={handlePdfUploadComplete}
              onDelete={handlePdfDelete}
            />

            {/* PDF Preview Section */}
            {rulesPdfId && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">PDF Önizleme</h3>
                <PdfViewer 
                  pdfId={rulesPdfId} 
                  fileName={`${gameName} - Kurallar.pdf`}
                />
              </div>
            )}

            {/* Text Rules Section */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Metin Kuralları</h3>
                <p className="text-sm text-gray-600 mt-1">
                  PDF yüklediyseniz, bu kurallar PDF ile birlikte görüntülenecek. 
                  PDF yoksa sadece bu kurallar gösterilir.
                </p>
              </div>

              {/* Inner Tabs for Rules Mode */}
              <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setRulesMode('text')}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      rulesMode === 'text'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
                    }`}
                  >
                    Metin Modu
                  </button>
                  <button
                    onClick={() => setRulesMode('json')}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      rulesMode === 'json'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
                    }`}
                  >
                    JSON Modu
                  </button>
                </div>
              </div>
            
            {/* Rules Content based on Mode */}
            {rulesMode === 'text' ? (
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
                    <p className="text-sm">Aşağıdaki "Bölüm Ekle" butonuna tıklayarak başlayın</p>
                  </div>
                )}
                
                {/* Add Section Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={addRulesSection}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    <Plus size={16} weight="regular" />
                    <span>Bölüm Ekle</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    JSON Kurallar
                  </label>
                  <textarea
                    value={gameRules}
                    onChange={(e) => setGameRules(e.target.value)}
                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-mono text-sm"
                    placeholder='[{"id":"1","title":"Bölüm Başlığı","content":"<p>Bölüm içeriği...</p>"}]'
                  />
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={validateAndSaveJson}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    JSON'u Doğrula ve Kaydet
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {activeTab === 'listeler' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Oyun Listeleri</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bu oyunu hangi listelerde göstermek istediğinizi seçin.
            </p>
            
            {gameLists === undefined ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
                <p className="text-gray-600">Listeler yükleniyor...</p>
              </div>
            ) : gameLists.length === 0 ? (
              <div className="text-center py-8">
                <ListBullets size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Henüz liste oluşturulmamış</p>
                <p className="text-sm text-gray-400 mt-2">
                  <a href="/admin/lists" className="text-blue-500 hover:text-blue-600">
                    Liste oluşturmak için tıklayın
                  </a>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gameLists.map((list) => (
                  <div
                    key={list._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedLists.includes(list._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedLists(prev => 
                        prev.includes(list._id)
                          ? prev.filter(id => id !== list._id)
                          : [...prev, list._id]
                      );
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {selectedLists.includes(list._id) ? (
                          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {list.emoji && <span className="text-lg">{list.emoji}</span>}
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {list.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {list.gameIds.length} oyun
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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
