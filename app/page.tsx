'use client';

import { useState } from 'react';
import AppBar from '../components/AppBar';
import GamesPage from './games/page';
import HistoryPage from './history/page';
import ContactsPage from './contacts/page';

export default function Home() {
  const [activeTab, setActiveTab] = useState('oyunlar');

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6f9' }}>
      {renderContent()}
      <AppBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
