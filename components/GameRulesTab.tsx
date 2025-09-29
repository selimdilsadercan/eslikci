'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface GameRulesTabProps {
  gameId: Id<'games'>;
}

export default function GameRulesTab({ gameId }: GameRulesTabProps) {
  const gameTemplate = useQuery(api.games.getGameById, { id: gameId });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shadow-sm">
          <span className="text-white text-lg">📋</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Oyun Kuralları</h3>
          <p className="text-gray-600 text-xs">Bu oyunun nasıl oynanacağını öğrenin</p>
        </div>
      </div>
      
      {gameTemplate?.rules ? (
        <div className="space-y-4">
          {(() => {
            try {
              // Try to parse as JSON first (structured rules)
              const parsedRules = JSON.parse(gameTemplate.rules);
              if (Array.isArray(parsedRules)) {
                return parsedRules.map((section, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                        <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-gray-800 mb-2">
                          {section.title}
                        </h4>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                          style={{
                            '--tw-prose-headings': '#374151',
                            '--tw-prose-links': '#3b82f6',
                            '--tw-prose-bold': '#1f2937',
                            '--tw-prose-code': '#1f2937',
                            '--tw-prose-pre-code': '#1f2937',
                            '--tw-prose-pre-bg': '#f3f4f6',
                            '--tw-prose-th-borders': '#d1d5db',
                            '--tw-prose-td-borders': '#e5e7eb'
                          } as React.CSSProperties}
                          dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                      </div>
                    </div>
                  </div>
                ));
              }
            } catch (e) {
              // If not JSON, treat as HTML content
              return (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    style={{
                      '--tw-prose-headings': '#374151',
                      '--tw-prose-links': '#3b82f6',
                      '--tw-prose-bold': '#1f2937',
                      '--tw-prose-code': '#1f2937',
                      '--tw-prose-pre-code': '#1f2937',
                      '--tw-prose-pre-bg': '#f3f4f6',
                      '--tw-prose-th-borders': '#d1d5db',
                      '--tw-prose-td-borders': '#e5e7eb'
                    } as React.CSSProperties}
                    dangerouslySetInnerHTML={{ __html: gameTemplate.rules }}
                  />
                </div>
              );
            }
          })()}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="text-gray-400 text-3xl">📋</span>
          </div>
          <h4 className="text-xl font-semibold text-gray-700 mb-3">Kurallar henüz eklenmemiş</h4>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            Bu oyun için kurallar henüz tanımlanmamış. Oyun yöneticisi kuralları eklediğinde burada görünecektir.
          </p>
        </div>
      )}
    </div>
  );
}
