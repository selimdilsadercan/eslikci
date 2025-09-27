'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import AppBar from '../components/AppBar';
import GamesPage from './games/page';
import HistoryPage from './history/page';
import ContactsPage from './contacts/page';
import AuthButton from '../components/AuthButton';
import { useUserSync } from '../hooks/useUserSync';

export default function Home() {
  const [activeTab, setActiveTab] = useState('oyunlar');
  const { isSignedIn, isLoaded } = useUser();
  
  // Sync user with Convex when they sign in
  useUserSync();

  const renderContent = () => {
    switch (activeTab) {
      case 'oyunlar':
        return <GamesPage />;
      case 'gecmis':
        return <HistoryPage />;
      case 'rehber':
        return <ContactsPage />;
      default:
        return <GamesPage />;
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6f9' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Eslikci</h1>
          <p className="text-gray-600 mb-6">Your companion app for table games</p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6f9' }}>
      {renderContent()}
      <AppBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
