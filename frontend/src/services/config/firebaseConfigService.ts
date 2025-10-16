import { initializeApp, FirebaseApp } from 'firebase/app';
import { getRemoteConfig, RemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { SHARED_CONFIG } from '../../config/shared';

interface AppConfig {
  // API Configuration
  apiBaseUrl: string;
  
  // Google OAuth
  googleClientId: string;
  
  // External API Keys
  googleMapsApiKey: string;
  weatherApiKey: string;
  openAiApiKey: string;
  petsApiKey: string;
  geminiApiKey: string;
  
  // Firebase Configuration
  firebaseMessagingSenderId: string;
  firebaseVapidKey: string;
  firebaseServiceAccountJson: string;
  
  // Feature Flags
  enableGoogleAuth: boolean;
  enableGpsTracking: boolean;
  enableAiChatbot: boolean;
  enableNotifications: boolean;
  enableOfflineMode: boolean;
  
  // App Settings
  environment: 'development' | 'staging' | 'production';
  apiTimeout: number;
  maxImageUploadSize: number;
  supportedImageFormats: string[];
  
  // Emergency Configuration
  emergencyVetContact: string;
  poisonControlContact: string;
  
  // UI Configuration
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
    // Fallback configuration for when Firebase is not available
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

  /**
   * Initialize Firebase Remote Config
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Use shared configuration (safe to expose)
      const firebaseConfig = SHARED_CONFIG.firebase;

      // Check if Firebase config is provided
      if (!firebaseConfig.projectId) {
        console.warn('Firebase project ID not found. Using fallback configuration.');
        this.config = { ...this.fallbackConfig };
        this.isInitialized = true;
        return;
      }

      // If API key is empty, we'll get it from Remote Config
      if (!firebaseConfig.apiKey) {
        console.log('Firebase API key not set in config, will be loaded from Remote Config');
      }

      // Initialize Firebase with dynamic config
      const dynamicConfig = { ...firebaseConfig };
      
      // Initialize Firebase
      this.app = initializeApp(dynamicConfig);
      this.remoteConfig = getRemoteConfig(this.app);

      // Set default values (convert arrays to JSON strings for Firebase)
      const firebaseDefaults: { [key: string]: string | number | boolean } = {
        // App configuration
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
      this.remoteConfig.defaultConfig = firebaseDefaults;

      // Configure remote config settings
      this.remoteConfig.settings = {
        minimumFetchIntervalMillis: 300000, // 5 minutes
        fetchTimeoutMillis: 10000, // 10 seconds
      };

      // Fetch and activate remote config
      await this.fetchConfig();
      
      console.log('✅ Firebase Remote Config initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Remote Config:', error);
      console.log('📋 Using fallback configuration');
      this.config = { ...this.fallbackConfig };
      this.isInitialized = true;
    }
  }

  /**
   * Fetch latest configuration from Firebase
   */
  async fetchConfig(): Promise<void> {
    if (!this.remoteConfig) {
      console.warn('Remote Config not initialized. Using fallback configuration.');
      return;
    }

    try {
      await fetchAndActivate(this.remoteConfig);
      
      // Parse configuration
      this.config = {
        // API Configuration
        apiBaseUrl: this.getStringValue('api_base_url'),
        
        // OAuth Keys
        googleClientId: this.getStringValue('google_client_id'),
        
        // External API Keys
        googleMapsApiKey: this.getStringValue('google_maps_api_key'),
        weatherApiKey: this.getStringValue('weather_api_key'),
        openAiApiKey: this.getStringValue('openai_api_key'),
        petsApiKey: this.getStringValue('pets_api_key'),
        geminiApiKey: this.getStringValue('gemini_api_key'),
        
        // Firebase Configuration
        firebaseMessagingSenderId: this.getStringValue('firebase_messaging_sender_id'),
        firebaseVapidKey: this.getStringValue('firebase_vapid_key'),
        firebaseServiceAccountJson: this.getStringValue('firebase_service_account_json'),
        
        // Feature Flags
        enableGoogleAuth: this.getBooleanValue('enable_google_auth'),
        enableGpsTracking: this.getBooleanValue('enable_gps_tracking'),
        enableAiChatbot: this.getBooleanValue('enable_ai_chatbot'),
        enableNotifications: this.getBooleanValue('enable_notifications'),
        enableOfflineMode: this.getBooleanValue('enable_offline_mode'),
        
        // App Settings
        environment: this.getStringValue('environment') as 'development' | 'staging' | 'production',
        apiTimeout: this.getNumberValue('api_timeout'),
        maxImageUploadSize: this.getNumberValue('max_image_upload_size'),
        supportedImageFormats: this.getArrayValue('supported_image_formats'),
        
        // Emergency Configuration
        emergencyVetContact: this.getStringValue('emergency_vet_contact'),
        poisonControlContact: this.getStringValue('poison_control_contact'),
        
        // UI Configuration
        primaryColor: this.getStringValue('primary_color'),
        secondaryColor: this.getStringValue('secondary_color'),
        appName: this.getStringValue('app_name'),
        version: this.getStringValue('version'),
      };

      console.log('🔄 Configuration updated from Firebase Remote Config');
    } catch (error) {
      console.error('❌ Failed to fetch remote config:', error);
    }
  }

  /**
   * Get string value from remote config
   */
  private getStringValue(key: string): string {
    if (!this.remoteConfig) return this.fallbackConfig[key as keyof AppConfig] as string;
    return getValue(this.remoteConfig, key).asString();
  }

  /**
   * Get boolean value from remote config
   */
  private getBooleanValue(key: string): boolean {
    if (!this.remoteConfig) return this.fallbackConfig[key as keyof AppConfig] as boolean;
    return getValue(this.remoteConfig, key).asBoolean();
  }

  /**
   * Get number value from remote config
   */
  private getNumberValue(key: string): number {
    if (!this.remoteConfig) return this.fallbackConfig[key as keyof AppConfig] as number;
    return getValue(this.remoteConfig, key).asNumber();
  }

  /**
   * Get array value from remote config (stored as JSON string)
   */
  private getArrayValue(key: string): string[] {
    if (!this.remoteConfig) return this.fallbackConfig[key as keyof AppConfig] as string[];
    try {
      const jsonString = getValue(this.remoteConfig, key).asString();
      return JSON.parse(jsonString);
    } catch {
      return this.fallbackConfig[key as keyof AppConfig] as string[];
    }
  }

  /**
   * Get specific configuration value
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return (this.config[key] ?? this.fallbackConfig[key]) as AppConfig[K];
  }

  /**
   * Get all configuration
   */
  getAll(): AppConfig {
    return { ...this.fallbackConfig, ...this.config };
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof Pick<AppConfig, 'enableGoogleAuth' | 'enableGpsTracking' | 'enableAiChatbot' | 'enableNotifications' | 'enableOfflineMode'>): boolean {
    return this.get(feature);
  }

  /**
   * Get API configuration
   */
  getApiConfig() {
    return {
      baseUrl: this.get('apiBaseUrl'),
      timeout: this.get('apiTimeout'),
    };
  }

  /**
   * Get OAuth configuration
   */
  getOAuthConfig() {
    return {
      googleClientId: this.get('googleClientId'),
      isGoogleAuthEnabled: this.isFeatureEnabled('enableGoogleAuth'),
    };
  }

  /**
   * Get emergency contacts
   */
  getEmergencyContacts() {
    return {
      veterinary: this.get('emergencyVetContact'),
      poisonControl: this.get('poisonControlContact'),
    };
  }

  /**
   * Get UI theme configuration
   */
  getThemeConfig() {
    return {
      primaryColor: this.get('primaryColor'),
      secondaryColor: this.get('secondaryColor'),
      appName: this.get('appName'),
      version: this.get('version'),
    };
  }

  /**
   * Get API keys configuration
   */
  getApiKeys() {
    return {
      petsApi: this.get('petsApiKey'),
      geminiApi: this.get('geminiApiKey'),
      googleMaps: this.get('googleMapsApiKey'),
      weather: this.get('weatherApiKey'),
      openAi: this.get('openAiApiKey'),
    };
  }

  /**
   * Manually refresh configuration
   */
  async refresh(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
      return;
    }
    await this.fetchConfig();
  }
}

// Export singleton instance
export const configService = new FirebaseConfigService();

// Export types
export type { AppConfig };

// Initialize on module load
configService.initialize().catch(console.error);
