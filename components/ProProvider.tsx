'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './FirebaseAuthProvider';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { billingService, PRODUCT_IDS, ProductId } from '@/lib/billing';

interface ProContextType {
  isPro: boolean;
  isLoading: boolean;
  proExpiresAt: number | null;
  upgradeToPro: (duration: number) => Promise<{ success: boolean; proExpiresAt: number }>;
  cancelPro: () => Promise<{ success: boolean }>;
  purchasePro: (productId: ProductId) => Promise<{ success: boolean; proExpiresAt: number }>;
  restorePurchases: () => Promise<{ success: boolean }>;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export function ProProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<number | null>(null);

  // Query pro status from Convex
  const proStatus = useQuery(api.users.isUserPro, 
    user?.uid ? { firebaseId: user.uid } : "skip"
  );

  useEffect(() => {
    if (!isSignedIn || !user) {
      setIsPro(false);
      setProExpiresAt(null);
      setIsLoading(false);
      return;
    }

    if (proStatus !== undefined) {
      setIsPro(proStatus);
      setIsLoading(false);
    }
  }, [isSignedIn, user, proStatus]);

  // Initialize billing service with delay to prevent blocking app startup
  useEffect(() => {
    const initBilling = async () => {
      try {
        // Delay billing initialization to prevent blocking app startup
        setTimeout(async () => {
          try {
            await billingService.initialize();
          } catch (error) {
            console.error('Failed to initialize billing service:', error);
          }
        }, 2000); // Wait 2 seconds after app loads
      } catch (error) {
        console.error('Failed to initialize billing service:', error);
      }
    };

    initBilling();
  }, []);

  const upgradeToPro = async (duration: number) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      // This would typically call a Convex mutation
      // For now, we'll simulate the upgrade
      const newExpirationTime = Date.now() + duration;
      setIsPro(true);
      setProExpiresAt(newExpirationTime);
      
      return { success: true, proExpiresAt: newExpirationTime };
    } catch (error) {
      console.error('Failed to upgrade to pro:', error);
      throw error;
    }
  };

  const cancelPro = async () => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      // This would typically call a Convex mutation
      // For now, we'll simulate the cancellation
      setIsPro(false);
      setProExpiresAt(null);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to cancel pro:', error);
      throw error;
    }
  };

  const purchasePro = async (productId: ProductId) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Attempting to purchase product:', productId);
      
      // First, try to get products to verify connection
      const products = await billingService.getProducts();
      console.log('Available products:', products);
      
      if (!products || products.length === 0) {
        throw new Error('No products available. Please check your Google Play Console setup.');
      }
      
      const product = products.find(p => (p.productId === productId) || (p.id === productId));
      if (!product) {
        throw new Error(`Product ${productId} not found. Available products: ${products.map(p => p.productId || p.id).join(', ')}`);
      }
      
      console.log('Product found:', product);
      
      const purchase = await billingService.purchaseProduct(productId);
      console.log('Purchase result:', purchase);
      
      // Calculate expiration based on product
      let duration = 0;
      switch (productId) {
        case PRODUCT_IDS.PRO_MONTHLY:
          duration = 30 * 24 * 60 * 60 * 1000; // 30 days
          break;
        case PRODUCT_IDS.PRO_YEARLY:
          duration = 365 * 24 * 60 * 60 * 1000; // 1 year
          break;
        case PRODUCT_IDS.PRO_LIFETIME:
          duration = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years (effectively lifetime)
          break;
      }

      const newExpirationTime = Date.now() + duration;
      setIsPro(true);
      setProExpiresAt(newExpirationTime);
      
      return { success: true, proExpiresAt: newExpirationTime };
    } catch (error) {
      console.error('Failed to purchase pro:', error);
      throw error;
    }
  };

  const restorePurchases = async () => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const purchases = await billingService.restorePurchases();
      
      if (purchases.length > 0) {
        // Find the most recent purchase
        const latestPurchase = purchases.sort((a, b) => b.purchaseTime - a.purchaseTime)[0];
        
        // Calculate expiration based on product
        let duration = 0;
        switch (latestPurchase.productId) {
          case PRODUCT_IDS.PRO_MONTHLY:
            duration = 30 * 24 * 60 * 60 * 1000; // 30 days
            break;
          case PRODUCT_IDS.PRO_YEARLY:
            duration = 365 * 24 * 60 * 60 * 1000; // 1 year
            break;
          case PRODUCT_IDS.PRO_LIFETIME:
            duration = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years (effectively lifetime)
            break;
        }

        const expirationTime = latestPurchase.purchaseTime + duration;
        setIsPro(true);
        setProExpiresAt(expirationTime);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  };

  const value: ProContextType = {
    isPro,
    isLoading,
    proExpiresAt,
    upgradeToPro,
    cancelPro,
    purchasePro,
    restorePurchases,
  };

  return (
    <ProContext.Provider value={value}>
      {children}
    </ProContext.Provider>
  );
}

export function usePro() {
  const context = useContext(ProContext);
  if (context === undefined) {
    throw new Error('usePro must be used within a ProProvider');
  }
  return context;
}
