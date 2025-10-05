'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/FirebaseAuthProvider';
import { usePro } from '@/components/ProProvider';
import ProUpgrade from '@/components/ProUpgrade';
import BillingDebug from '@/components/BillingDebug';
import AppBar from '@/components/AppBar';
import { Crown, Calendar, Zap, Star, Check, ArrowLeft, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { isPro, isLoading, proExpiresAt, cancelPro, purchasePro } = usePro();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-20 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Pro Features</h1>
            <p className="text-gray-600 mb-8">Please sign in to access Pro features</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCancelPro = async () => {
    try {
      setIsCancelling(true);
      await cancelPro();
      toast.success('Pro subscription cancelled successfully');
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Failed to cancel pro:', error);
      toast.error('Failed to cancel Pro subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const proFeatures = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "Ad-Free Experience",
      description: "Enjoy the app without any interruptions from advertisements",
      benefit: "No more banner ads or interstitial ads"
    },
    {
      icon: <Crown className="w-6 h-6 text-purple-500" />,
      title: "Premium Support",
      description: "Get priority support and faster response times",
      benefit: "Direct access to development team"
    },
    {
      icon: <Star className="w-6 h-6 text-blue-500" />,
      title: "Early Access",
      description: "Be the first to try new features and improvements",
      benefit: "Beta access to upcoming features"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-2 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Pro Features</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="pt-4 pb-20">
        <div className="px-4 max-w-md mx-auto">
          {/* Main Content Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pro Features</h2>
            <p className="text-gray-600">
              {isPro ? 'You have access to all Pro features!' : 'Upgrade to unlock premium features'}
            </p>
          </div>

          {/* Pro Status */}
          {isPro && proExpiresAt && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Pro Active</span>
              </div>
              <p className="text-green-100 text-sm mb-3">
                Expires on {formatDate(proExpiresAt)}
              </p>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel Pro Subscription
              </button>
            </div>
          )}

          {/* Features List */}
          <div className="space-y-4 mb-8">
            {proFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                    <div className="flex items-center space-x-2">
                      {isPro ? (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Active</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">{feature.benefit}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade Section */}
          {!isPro && (
            <div className="mb-8">
              <button
                onClick={() => setShowUpgrade(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
              >
                Upgrade to Pro
              </button>
            </div>
          )}

          {/* Pro Benefits */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Why Upgrade to Pro?</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Support the development of Eşlikçi</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Enjoy a distraction-free gaming experience</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Get early access to new features</span>
              </div>
            </div>
          </div>

          {/* Debug Component - Remove in production */}
          <div className="mt-6">
            <BillingDebug />
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgrade && (
        <ProUpgrade 
          onClose={() => setShowUpgrade(false)}
          showCloseButton={true}
          isModal={true}
        />
      )}

      {/* Cancel Pro Confirmation Modal */}
      {showCancelConfirm && (
        <div 
          className="fixed inset-0 bg-[#00000080] flex items-center justify-center p-4 z-50"
          onClick={() => setShowCancelConfirm(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Cancel Pro Subscription
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to cancel your Pro subscription? You'll lose access to ad-free features immediately.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleCancelPro}
                  disabled={isCancelling}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel Pro'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancelling}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Keep Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
