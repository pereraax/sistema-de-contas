/// <reference types="@capacitor/push-notifications" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plenipay.app',
  appName: 'PLENIPAY',
  webDir: 'www',
  server: {
    // DEV: simulador iOS usa localhost = seu Mac; dispositivo físico use o IP (ex.: 192.168.100.57:3000)
    url: 'http://localhost:3000?platform=app',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
