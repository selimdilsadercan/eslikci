'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface GameAskTabProps {
  gameId: Id<'games'>;
}

export default function GameAskTab({ gameId }: GameAskTabProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const gameTemplate = useQuery(api.games.getGameById, { id: gameId });

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setIsChatLoading(true);

    // Add user message to chat history
    const newChatHistory = [...chatHistory, { role: 'user' as const, content: userMessage }];
    setChatHistory(newChatHistory);

    try {
      // Simulate AI response (you can replace this with actual AI API call)
      const rulesText = gameTemplate?.rules || 'Bu oyun için kurallar tanımlanmamış.';
      
      // Simple rule-based responses based on keywords
      let aiResponse = '';
      const lowerMessage = userMessage.toLowerCase();
      
      if (lowerMessage.includes('nasıl') || lowerMessage.includes('oynanır')) {
        aiResponse = `Bu oyun ${gameTemplate?.name || 'oyun'} kurallarına göre oynanır. ${rulesText}`;
      } else if (lowerMessage.includes('puan') || lowerMessage.includes('skor')) {
        aiResponse = `Bu oyun için puanlama sistemi hakkında bilgi: ${rulesText}`;
      } else if (lowerMessage.includes('takım') || lowerMessage.includes('team')) {
        aiResponse = 'Bu oyun hem bireysel hem de takım modunda oynanabilir. Oyun ayarlarından seçim yapabilirsiniz.';
      } else {
        aiResponse = `Oyun kuralları hakkında sorunuz: "${userMessage}". ${rulesText}`;
      }

      // Add AI response to chat history
      setChatHistory([...newChatHistory, { role: 'assistant' as const, content: aiResponse }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatHistory([...newChatHistory, { 
        role: 'assistant' as const, 
        content: 'Üzgünüm, şu anda sorunuzu yanıtlayamıyorum. Lütfen daha sonra tekrar deneyin.' 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      <div className="flex items-center mb-4 px-4 pt-4">
        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
          <span className="text-white text-lg">🤖</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Kural Asistanı</h3>
          <p className="text-gray-600 text-xs">Oyun kuralları hakkında sorularınızı sorun</p>
        </div>
      </div>
      
      {/* Chat History - Takes remaining space */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {chatHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <span className="text-green-400 text-2xl">💬</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">Kural Asistanına Hoş Geldiniz</h4>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
              Oyun kuralları hakkında merak ettiğiniz her şeyi sorabilirsiniz. 
              Nasıl oynanır, puanlama nasıl yapılır, takım modu nasıl çalışır gibi sorularınızı yanıtlayabilirim.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-800 shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 px-4 py-3 rounded-2xl shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Chat Input - Fixed at bottom like WhatsApp */}
      <div className="bg-white border-t border-gray-200">
        <form onSubmit={handleChatSubmit}>
          <div className="flex items-center space-x-3 p-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Mesajınızı yazın..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isChatLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!chatMessage.trim() || isChatLoading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                !chatMessage.trim() || isChatLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isChatLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
