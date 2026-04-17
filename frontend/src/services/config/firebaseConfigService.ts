import { initializeApp, FirebaseApp } from 'firebase/app';
import { getRemoteConfig, RemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { SHARED_CONFIG } from '../../config/shared';

interface AppConfig {
  apiBaseUrl: string;
  googleClientId: string;
  googleMapsApiKey: string;
  weatherApiKey: string;
  openAiApiKey: string;
  petsApiKey: string;
  geminiApiKey: string;
  firebaseMessagingSenderId: string;
  firebaseVapidKey: string;
  firebaseServiceAccountJson: string;
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

class FirebaseConfigService {
  private app: FirebaseApp | null = null;
  private remoteConfig: RemoteConfig | null = null;
  private config: Partial<AppConfig> = {};
  private isInitialized = false;
  private fallbackConfig: AppConfig = {
    apiBaseUrl: SHARED_CONFIG.development.apiBaseUrl,
    googleClientId: '204752166323-r69volulegreitj2nflcoag0eae3iggk.apps.googleusercontent.com',
    googleMapsApiKey: SHARED_CONFIG.externalApis.googleMapsApiKey,
    weatherApiKey: SHARED_CONFIG.externalApis.weatherApiKey,
    openAiApiKey: SHARED_CONFIG.externalApis.openAiApiKey,
    petsApiKey: SHARED_CONFIG.externalApis.petsApiKey,
    geminiApiKey: SHARED_CONFIG.externalApis.geminiApiKey,
    firebaseMessagingSenderId: '123456789',
    firebaseVapidKey: 'YOUR_VAPID_KEY',
    firebaseServiceAccountJson: '{}',
    enableGoogleAuth: SHARED_CONFIG.features.enableGoogleAuth,
    enableGpsTracking: SHARED_CONFIG.features.enableGpsTracking,
    enableAiChatbot: SHARED_CONFIG.features.enableAiChatbot,
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
    if (this.isInitialized) {
      return;
    }

    try {
      const firebaseConfig = SHARED_CONFIG.firebase;

      if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
        this.config = { ...this.fallbackConfig };
        this.isInitialized = true;
        return;
      }

      this.app = initializeApp({ ...firebaseConfig });
      this.remoteConfig = getRemoteConfig(this.app);

      this.remoteConfig.defaultConfig = {
        api_base_url: this.fallbackConfig.apiBaseUrl,
        google_client_id: this.fallbackConfig.googleClientId,
        google_maps_api_key: this.fallbackConfig.googleMapsApiKey,
        weather_api_key: this.fallbackConfig.weatherApiKey,
        openai_api_key: this.fallbackConfig.openAiApiKey,
        pets_api_key: this.fallbackConfig.petsApiKey,
        gemini_api_key: this.fallbackConfig.geminiApiKey,
        firebase_messaging_sender_id: this.fallbackConfig.firebaseMessagingSenderId,
        firebase_vapid_key: this.fallbackConfig.firebaseVapidKey,
        firebase_service_account_json: this.fallbackConfig.firebaseServiceAccountJson,
        enable_google_auth: this.fallbackConfig.enableGoogleAuth,
        enable_gps_tracking: this.fallbackConfig.enableGpsTracking,
        enable_ai_chatbot: this.fallbackConfig.enableAiChatbot,
        enable_notifications: this.fallbackConfig.enableNotifications,
        enable_offline_mode: this.fallbackConfig.enableOfflineMode,
        environment: this.fallbackConfig.environment,
        api_timeout: this.fallbackConfig.apiTimeout,
        max_image_upload_size: this.fallbackConfig.maxImageUploadSize,
        supported_image_formats: JSON.stringify(this.fallbackConfig.supportedImageFormats),
        emergency_vet_contact: this.fallbackConfig.emergencyVetContact,
        poison_control_contact: this.fallbackConfig.poisonControlContact,
        primary_color: this.fallbackConfig.primaryColor,
        secondary_color: this.fallbackConfig.secondaryColor,
        app_name: this.fallbackConfig.appName,
        version: this.fallbackConfig.version,
      };

      this.remoteConfig.settings = {
        minimumFetchIntervalMillis: 300000,
        fetchTimeoutMillis: 10000,
      };

      await this.fetchConfig();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase Remote Config:', error);
      this.config = { ...this.fallbackConfig };
      this.isInitialized = true;
    }
  }

  async fetchConfig(): Promise<void> {
    if (!this.remoteConfig) {
      return;
    }

    try {
      await fetchAndActivate(this.remoteConfig);
      this.config = {
        apiBaseUrl: this.getStringValue('api_base_url'),
        googleClientId: this.getStringValue('google_client_id'),
        googleMapsApiKey: this.getStringValue('google_maps_api_key'),
        weatherApiKey: this.getStringValue('weather_api_key'),
        openAiApiKey: this.getStringValue('openai_api_key'),
        petsApiKey: this.getStringValue('pets_api_key'),
        geminiApiKey: this.getStringValue('gemini_api_key'),
        firebaseMessagingSenderId: this.getStringValue('firebase_messaging_sender_id'),
        firebaseVapidKey: this.getStringValue('firebase_vapid_key'),
        firebaseServiceAccountJson: this.getStringValue('firebase_service_account_json'),
        enableGoogleAuth: this.getBooleanValue('enable_google_auth'),
        enableGpsTracking: this.getBooleanValue('enable_gps_tracking'),
        enableAiChatbot: this.getBooleanValue('enable_ai_chatbot'),
        enableNotifications: this.getBooleanValue('enable_notifications'),
        enableOfflineMode: this.getBooleanValue('enable_offline_mode'),
        environment: this.getStringValue('environment') as 'development' | 'staging' | 'production',
        apiTimeout: this.getNumberValue('api_timeout'),
        maxImageUploadSize: this.getNumberValue('max_image_upload_size'),
        supportedImageFormats: this.getArrayValue('supported_image_formats'),
        emergencyVetContact: this.getStringValue('emergency_vet_contact'),
        poisonControlContact: this.getStringValue('poison_control_contact'),
        primaryColor: this.getStringValue('primary_color'),
        secondaryColor: this.getStringValue('secondary_color'),
        appName: this.getStringValue('app_name'),
        version: this.getStringValue('version'),
      };
    } catch (error) {
      console.error('Failed to fetch remote config:', error);
    }
  }

  private getStringValue(key: string): string {
    if (!this.remoteConfig) return this.fallbackConfig[key as keyof AppConfig] as string;
    return getValue(this.remoteConfig, key).asString();
  }

  private getBooleanValue(key: string): boolean {
    if (!this.remoteConfig) return this.fallbackConfig[key as keyof AppConfig] as boolean;
    return getValue(this.remoteConfig, key).asBoolean();
  }

  private getNumberValue(key: string): number {
    if (!this.remoteConfig) return this.fallbackConfig[key as keyof AppConfig] as number;
    return getValue(this.remoteConfig, key).asNumber();
  }

  private getArrayValue(key: string): string[] {
    if (!this.remoteConfig) return this.fallbackConfig[key as keyof AppConfig] as string[];
    try {
      const jsonString = getValue(this.remoteConfig, key).asString();
      return JSON.parse(jsonString);
    } catch {
      return this.fallbackConfig[key as keyof AppConfig] as string[];
    }
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return (this.config[key] ?? this.fallbackConfig[key]) as AppConfig[K];
  }

  getAll(): AppConfig {
    return { ...this.fallbackConfig, ...this.config };
  }

  isFeatureEnabled(feature: keyof Pick<AppConfig, 'enableGoogleAuth' | 'enableGpsTracking' | 'enableAiChatbot' | 'enableNotifications' | 'enableOfflineMode'>): boolean {
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

  getApiKeys() {
    return {
      petsApi: this.get('petsApiKey'),
      geminiApi: this.get('geminiApiKey'),
      googleMaps: this.get('googleMapsApiKey'),
      weather: this.get('weatherApiKey'),
      openAi: this.get('openAiApiKey'),
    };
  }

  async refresh(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
      return;
    }
    await this.fetchConfig();
  }
}

export const configService = new FirebaseConfigService();

export type { AppConfig };

configService.initialize().catch(() => undefined);
