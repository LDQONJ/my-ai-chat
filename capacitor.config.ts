import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'work.daqian.ai',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
    },
  },
};

export default config;
