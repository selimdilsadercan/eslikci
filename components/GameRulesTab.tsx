"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import PdfPageRenderer from "./PdfPageRenderer";

interface GameRulesTabProps {
  gameId: Id<"games">;
}

export default function GameRulesTab({ gameId }: GameRulesTabProps) {
  const gameTemplate = useQuery(api.games.getGameById, { id: gameId });

  return (
    <div className="flex-1 overflow-y-auto px-4">
      {/* Show PDF if available */}
      {gameTemplate?.rulesPdf ? (
        <PdfPageRenderer
          pdfId={gameTemplate.rulesPdf}
          fileName={`${gameTemplate.name} - Kurallar.pdf`}
        />
      ) : gameTemplate?.rules ? (
        /* Show text rules if no PDF */
        <div className="space-y-4">
          {(() => {
            try {
              // Try to parse as JSON first (structured rules)
              const parsedRules = JSON.parse(gameTemplate.rules);
              if (Array.isArray(parsedRules)) {
                return parsedRules.map((section, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-[var(--card-background)] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[var(--card-border)] hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-blue-600 font-bold text-xs">
                          {index + 1}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-800 dark:text-gray-200">
                        {section.title}
                      </h4>
                    </div>
                    <div
                      className="rich-text-content"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                ));
              }
            } catch (e) {
              // If not JSON, treat as HTML content
              return (
                <div className="bg-white dark:bg-[var(--card-background)] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[var(--card-border)]">
                  <div
                    className="rich-text-content"
                    dangerouslySetInnerHTML={{ __html: gameTemplate.rules }}
                  />
                </div>
              );
            }
          })()}
        </div>
      ) : (
        /* Show empty state if no rules or PDF */
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <span className="text-gray-400 text-3xl">📋</span>
          </div>
          <h4 className="text-xl font-semibold text-gray-700 mb-3">
            Kurallar henüz eklenmemiş
          </h4>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            Bu oyun için kurallar henüz tanımlanmamış. Oyun yöneticisi kuralları
            eklediğinde burada görünecektir.
          </p>
        </div>
      )}
    </div>
  );
}
