import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eslikci.app',
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
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
