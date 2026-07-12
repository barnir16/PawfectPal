import { SHARED_CONFIG } from '../../config/shared';

interface AppConfig {
  apiBaseUrl: string;
  googleClientId: string;
  firebaseMessagingSenderId: string;
  firebaseVapidKey: string;
  enableGoogleAuth: boolean;
  enableGpsTracking: boolean;
  enableAiChatbot: boolean;
  enableNotifications: boolean;
  enableOfflineMode: boolean;
  environment: 'development' | 'staging' | 'production';
  apiTimeout: number;
  maxImageUploadSize: number;
  supportedImageFormats: string[];
  emergencyVetContact: string;
  poisonControlContact: string;
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  version: string;
}

class PublicConfigService {
  private config: AppConfig = {
    apiBaseUrl: SHARED_CONFIG.development.apiBaseUrl,
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    firebaseVapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
    enableGoogleAuth: import.meta.env.VITE_ENABLE_GOOGLE_AUTH !== 'false',
    enableGpsTracking: SHARED_CONFIG.features.enableGpsTracking,
    enableAiChatbot: import.meta.env.VITE_ENABLE_AI_CHATBOT !== 'false',
    enableNotifications: SHARED_CONFIG.features.enableNotifications,
    enableOfflineMode: SHARED_CONFIG.features.enableOfflineMode,
    environment: SHARED_CONFIG.app.environment,
    apiTimeout: 10000,
    maxImageUploadSize: SHARED_CONFIG.ui.maxImageUploadSize,
    supportedImageFormats: SHARED_CONFIG.ui.supportedImageFormats,
    emergencyVetContact: SHARED_CONFIG.emergency.vetContact,
    poisonControlContact: SHARED_CONFIG.emergency.poisonControl,
    primaryColor: SHARED_CONFIG.ui.primaryColor,
    secondaryColor: SHARED_CONFIG.ui.secondaryColor,
    appName: SHARED_CONFIG.app.name,
    version: SHARED_CONFIG.app.version,
  };

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  async refresh(): Promise<void> {
    return Promise.resolve();
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  getAll(): AppConfig {
    return { ...this.config };
  }

  isFeatureEnabled(
    feature: keyof Pick<
      AppConfig,
      | 'enableGoogleAuth'
      | 'enableGpsTracking'
      | 'enableAiChatbot'
      | 'enableNotifications'
      | 'enableOfflineMode'
    >
  ): boolean {
    return this.get(feature);
  }

  getApiConfig() {
    return {
      baseUrl: this.get('apiBaseUrl'),
      timeout: this.get('apiTimeout'),
    };
  }

  getOAuthConfig() {
    return {
      googleClientId: this.get('googleClientId'),
      isGoogleAuthEnabled: this.isFeatureEnabled('enableGoogleAuth'),
    };
  }

  getEmergencyContacts() {
    return {
      veterinary: this.get('emergencyVetContact'),
      poisonControl: this.get('poisonControlContact'),
    };
  }

  getThemeConfig() {
    return {
      primaryColor: this.get('primaryColor'),
      secondaryColor: this.get('secondaryColor'),
      appName: this.get('appName'),
      version: this.get('version'),
    };
  }
}

export const configService = new PublicConfigService();

export type { AppConfig };

configService.initialize().catch(() => undefined);
