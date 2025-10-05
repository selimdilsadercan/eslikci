'use client';

import React, { useState } from 'react';
import { usePro } from './ProProvider';
import { billingService } from '@/lib/billing';
import { PRODUCT_IDS } from '@/lib/billing';

export default function BillingDebug() {
  const { purchasePro } = usePro();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testBillingConnection = async () => {
    setIsLoading(true);
    setDebugInfo('Testing billing connection...\n');
    
    try {
      // Test initialization
      setDebugInfo(prev => prev + '1. Initializing billing service...\n');
      await billingService.initialize();
      setDebugInfo(prev => prev + '✅ Billing service initialized\n');
      
      // Test getting products
      setDebugInfo(prev => prev + '2. Fetching products...\n');
      const products = await billingService.getProducts();
      setDebugInfo(prev => prev + `✅ Found ${products.length} products:\n`);
      
      products.forEach((product, index) => {
        setDebugInfo(prev => prev + `   ${index + 1}. ${product.productId || product.id} - ${product.title || 'Unknown'}\n`);
        setDebugInfo(prev => prev + `      Price: ${product.price || 'Unknown'}\n`);
        setDebugInfo(prev => prev + `      State: ${product.state || 'Unknown'}\n`);
      });
      
      // Test product availability - check both productId and id fields
      const targetProduct = products.find(p => 
        (p.productId === PRODUCT_IDS.PRO_MONTHLY) || 
        (p.id === PRODUCT_IDS.PRO_MONTHLY)
      );
      if (targetProduct) {
        setDebugInfo(prev => prev + `✅ Target product ${PRODUCT_IDS.PRO_MONTHLY} found\n`);
        setDebugInfo(prev => prev + `   Product state: ${targetProduct.state || 'Unknown'}\n`);
        setDebugInfo(prev => prev + `   Product price: ${targetProduct.price || 'Unknown'}\n`);
      } else {
        setDebugInfo(prev => prev + `❌ Target product ${PRODUCT_IDS.PRO_MONTHLY} not found\n`);
        setDebugInfo(prev => prev + `Available product IDs: ${products.map(p => p.productId || p.id).join(', ')}\n`);
        setDebugInfo(prev => prev + `Looking for: ${PRODUCT_IDS.PRO_MONTHLY}\n`);
      }
      
      // Check if we're using mock products
      if (products.length > 0 && products[0].price === '$2.99') {
        setDebugInfo(prev => prev + `⚠️ Using mock products - Play Store not connected\n`);
        setDebugInfo(prev => prev + `   Make sure products are configured in Google Play Console\n`);
        setDebugInfo(prev => prev + `   Subscriptions: ${PRODUCT_IDS.PRO_MONTHLY}, ${PRODUCT_IDS.PRO_YEARLY}\n`);
        setDebugInfo(prev => prev + `   One-time purchase: ${PRODUCT_IDS.PRO_LIFETIME}\n`);
        setDebugInfo(prev => prev + `   Note: Monthly and Yearly are SUBSCRIPTIONS, not one-time purchases\n`);
      }
      
    } catch (error) {
      setDebugInfo(prev => prev + `❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
      console.error('Billing debug error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testPurchase = async () => {
    setIsLoading(true);
    setDebugInfo('Testing purchase flow...\n');
    
    try {
      await purchasePro(PRODUCT_IDS.PRO_MONTHLY);
      setDebugInfo(prev => prev + '✅ Purchase test completed\n');
    } catch (error) {
      setDebugInfo(prev => prev + `❌ Purchase failed: ${error instanceof Error ? error.message : String(error)}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Billing Debug</h3>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={testBillingConnection}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Billing Connection'}
        </button>
        
        <button
          onClick={testPurchase}
          disabled={isLoading}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Purchase Flow'}
        </button>
      </div>
      
      {debugInfo && (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2 text-gray-900">Debug Output:</h4>
          <pre className="text-sm whitespace-pre-wrap text-gray-800 font-mono bg-gray-50 p-2 rounded border">{debugInfo}</pre>
        </div>
      )}
    </div>
  );
}
