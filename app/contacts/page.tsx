'use client';

import { Plus, User } from '@phosphor-icons/react';

// Sample contacts data
const contacts = {
  ungrouped: [
    { id: 1, name: 'Yiğit', initial: 'Y' },
    { id: 2, name: 'Betül', initial: 'B' }
  ],
  home: [
    { id: 3, name: 'Murat', initial: 'M' },
    { id: 4, name: 'Arda', initial: 'A' },
    { id: 5, name: 'Emel', initial: 'E' }
  ]
};

export default function ContactsPage() {
  const handleAddContact = () => {
    // TODO: Implement add contact functionality
    console.log('Add new contact');
  };

  return (
    <>
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Rehber</h1>
          <button
            onClick={handleAddContact}
            className="text-blue-500 font-medium text-sm"
          >
            Ekle
          </button>
        </div>

        {/* Ungrouped Contacts */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-600 mb-3">Gruplandırılmamış</h2>
          <div className="space-y-3">
            {contacts.ungrouped.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-lg p-4 flex items-center space-x-3 shadow-lg"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{contact.initial}</span>
                </div>
                <span className="font-medium text-gray-800">{contact.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Home Group */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-600 mb-3">Ev</h2>
          <div className="space-y-3">
            {contacts.home.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-lg p-4 flex items-center space-x-3 shadow-lg"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{contact.initial}</span>
                </div>
                <span className="font-medium text-gray-800">{contact.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
