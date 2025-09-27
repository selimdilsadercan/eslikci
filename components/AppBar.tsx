'use client';

import { useState } from 'react';
import { GameController, ClockCounterClockwise, Users } from '@phosphor-icons/react';

interface AppBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AppBar({ activeTab, onTabChange }: AppBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around py-2">
        {/* Oyunlar Tab */}
        <button
          onClick={() => onTabChange('oyunlar')}
          className={`flex flex-col items-center py-2 px-4 ${
            activeTab === 'oyunlar' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <GameController size={24} weight={activeTab === 'oyunlar' ? 'fill' : 'regular'} />
          <span className="text-xs font-medium">Oyunlar</span>
        </button>

        {/* Geçmiş Tab */}
        <button
          onClick={() => onTabChange('gecmis')}
          className={`flex flex-col items-center py-2 px-4 ${
            activeTab === 'gecmis' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <ClockCounterClockwise size={24} weight={activeTab === 'gecmis' ? 'fill' : 'regular'} />
          <span className="text-xs font-medium">Geçmiş</span>
        </button>

        {/* Rehber Tab */}
        <button
          onClick={() => onTabChange('rehber')}
          className={`flex flex-col items-center py-2 px-4 ${
            activeTab === 'rehber' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <Users size={24} weight={activeTab === 'rehber' ? 'fill' : 'regular'} />
          <span className="text-xs font-medium">Rehber</span>
        </button>
      </div>
      
      {/* Gesture Bar */}
      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2"></div>
    </div>
  );
}
