import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

// Mobile app configuration - use these for mobile apps
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Mobile app specific configuration
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure auth for mobile and web
if (typeof window !== 'undefined') {
  const currentHost = window.location.hostname;
  const currentOrigin = window.location.origin;
  
  console.log('Current host:', currentHost);
  console.log('Current origin:', currentOrigin);
  
  // Configure for mobile apps
  if (Capacitor.isNativePlatform()) {
    console.log('Configuring auth for mobile app with redirect support');
    // Mobile apps use redirect flow
    auth.settings.appVerificationDisabledForTesting = true;
  } else if (currentHost === 'eslikci-three.vercel.app' || currentHost.includes('vercel.app')) {
    // For deployed web app - set the correct redirect URL
    console.log('Configuring auth for deployed web app');
    auth.settings.appVerificationDisabledForTesting = true;
    
    // Set the correct redirect URL for deployed app
    if (currentOrigin === 'https://eslikci-three.vercel.app') {
      console.log('Setting redirect URL for Vercel deployment');
      // The redirect will now go to the correct Vercel URL
    }
  } else if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    // For local development
    console.log('Configuring auth for local development');
  }
}

// Configure auth for mobile if running in Capacitor
if (Capacitor.isNativePlatform()) {
  // Set up mobile-specific auth configuration
  auth.settings.appVerificationDisabledForTesting = true;
  
  // Configure auth for mobile redirects
  auth.settings.appVerificationDisabledForTesting = true;
  
  // Set the auth domain for mobile redirects
  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    auth.settings.appVerificationDisabledForTesting = true;
  }
}

export default app;
