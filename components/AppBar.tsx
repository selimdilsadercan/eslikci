'use client';

import Link from 'next/link';
import { GameController, ClockCounterClockwise, AddressBook, User } from '@phosphor-icons/react';

interface AppBarProps {
  activePage?: 'games' | 'history' | 'contacts' | 'profile';
}

export default function AppBar({ activePage }: AppBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around py-2">
        {/* Oyunlar Tab */}
        <Link
          href="/games"
          className={`flex flex-col items-center py-2 px-4 ${
            activePage === 'games' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <GameController size={24} weight="bold" />
          <span className="text-xs font-medium">Oyunlar</span>
        </Link>

        {/* Geçmiş Tab */}
        <Link
          href="/history"
          className={`flex flex-col items-center py-2 px-4 ${
            activePage === 'history' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <ClockCounterClockwise size={24} weight="bold" />
          <span className="text-xs font-medium">Geçmiş</span>
        </Link>

        {/* Rehber Tab */}
        <Link
          href="/contacts"
          className={`flex flex-col items-center py-2 px-4 ${
            activePage === 'contacts' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <AddressBook size={24} weight="bold" />
          <span className="text-xs font-medium">Rehber</span>
        </Link>

        {/* Profil Tab */}
        <Link
          href="/profile"
          className={`flex flex-col items-center py-2 px-4 ${
            activePage === 'profile' ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <User size={24} weight="bold" />
          <span className="text-xs font-medium">Profil</span>
        </Link>
      </div>
    </div>
  );
}
