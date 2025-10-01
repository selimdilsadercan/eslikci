import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.everything.eslikci',
  appName: 'Eşlikçi',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    FirebaseAuth: {
      enabled: true
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#ffffff",
      overlaysWebView: false
    },
    AdMob: {
      appId: {
        android: 'ca-app-pub-7161995041674415~6175723899', // Your real app ID
        ios: 'ca-app-pub-7161995041674415~6175723899' // Your real app ID
      },
      banner: {
        android: 'ca-app-pub-7161995041674415/3549560558', // Your real banner ID
        ios: 'ca-app-pub-7161995041674415/3549560558' // Your real banner ID
      },
      interstitial: {
        android: 'ca-app-pub-3940256099942544/1033173712', // Test interstitial ID (safe)
        ios: 'ca-app-pub-3940256099942544/4411468910' // Test interstitial ID (safe)
      },
      rewarded: {
        android: 'ca-app-pub-3940256099942544/5224354917', // Test rewarded ID (safe)
        ios: 'ca-app-pub-3940256099942544/1712485313' // Test rewarded ID (safe)
      }
    },
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
