'use client';

import React, { useState } from 'react';
import { usePro } from './ProProvider';
import { useAuth } from './FirebaseAuthProvider';
import { Star, Check, Crown, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProUpgradeProps {
  onClose?: () => void;
  showCloseButton?: boolean;
  isModal?: boolean; // Whether to render as a modal with backdrop
}

export default function ProUpgrade({ onClose, showCloseButton = true, isModal = false }: ProUpgradeProps) {
  const { isPro, isLoading, upgradeToPro } = usePro();
  const { user } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const proFeatures = [
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      title: "Ad-Free Experience",
      description: "Enjoy the app without any interruptions from advertisements"
    },
    {
      icon: <Crown className="w-5 h-5 text-purple-500" />,
      title: "Premium Support",
      description: "Get priority support and faster response times"
    },
    {
      icon: <Star className="w-5 h-5 text-blue-500" />,
      title: "Early Access",
      description: "Be the first to try new features and improvements"
    }
  ];

  const handleUpgrade = async (duration: number) => {
    if (!user) {
      toast.error('Please sign in to upgrade to Pro');
      return;
    }

    try {
      setIsUpgrading(true);
      await upgradeToPro(duration);
      toast.success('Successfully upgraded to Pro! 🎉');
      onClose?.();
    } catch (error) {
      console.error('Upgrade failed:', error);
      toast.error('Failed to upgrade. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const content = isPro ? (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-center mb-4">
        <Crown className="w-8 h-8 text-yellow-300" />
      </div>
      <h3 className="text-xl font-bold text-center mb-2">You're Pro! 🎉</h3>
      <p className="text-center text-purple-100">
        Thank you for supporting Eşlikçi! Enjoy your ad-free experience.
      </p>
    </div>
  ) : (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
        <div className="flex items-center justify-center mb-3">
          <Crown className="w-10 h-10 text-yellow-300" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
        <p className="text-purple-100">Remove ads and support the development</p>
      </div>

      {/* Features */}
      <div className="p-6">
        <div className="space-y-4 mb-6">
          {proFeatures.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Options */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleUpgrade(30 * 24 * 60 * 60 * 1000)} // 30 days
            disabled={isUpgrading || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpgrading ? 'Processing...' : 'Upgrade for 30 Days - Free'}
          </button>
          
          <button
            onClick={() => handleUpgrade(365 * 24 * 60 * 60 * 1000)} // 1 year
            disabled={isUpgrading || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpgrading ? 'Processing...' : 'Upgrade for 1 Year - Free'}
          </button>
        </div>

        {/* Note */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Pro features are currently free during development
          </p>
        </div>
      </div>

      {/* Close Button */}
      {showCloseButton && (
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      )}
    </div>
  );

  // If rendering as modal, wrap with backdrop
  if (isModal) {
    return (
      <div 
        className="fixed inset-0 bg-[#00000080] flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  // Return content directly if not modal
  return content;
}
