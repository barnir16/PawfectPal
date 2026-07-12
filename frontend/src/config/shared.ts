/**
 * Shared Configuration for PawfectPal
 * This file can be safely shared with team members
 * Firebase API keys are public and safe to expose
 */

export const SHARED_CONFIG = {
  // Firebase Configuration (Safe to expose - security handled by Firebase Rules)
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  },

  // App Configuration
  app: {
    name: "PawfectPal",
    version: "1.0.0",
    environment: "development" as const,
  },

  // Development Settings
  development: {
    apiBaseUrl:
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:8000",
    enableDebugMode: true,
    enableMockData: false,
  },

  // Feature Flags
  features: {
    enableGoogleAuth: true, // Re-enabled after adding Railway domains to Google OAuth
    enableGpsTracking: false,
    enableAiChatbot: true,
    enableNotifications: true,
    enableOfflineMode: false,
  },

  // Emergency Contacts
  emergency: {
    vetContact: "911",
    poisonControl: "(888) 426-4435",
  },

  // UI Configuration
  ui: {
    primaryColor: "#007AFF",
    secondaryColor: "#34C759",
    maxImageUploadSize: 5242880, // 5MB
    supportedImageFormats: ["image/jpeg", "image/png", "image/webp"],
  },
};

/**
 * Get configuration for specific environment
 */
export const getConfig = (environment: 'development' | 'staging' | 'production' = 'development') => {
  const baseConfig = { ...SHARED_CONFIG };
  
  if (environment === 'production') {
    baseConfig.development.enableDebugMode = false;
    baseConfig.development.enableMockData = false;
  }
  
  return baseConfig;
};

/**
 * Export default configuration
 */
export default SHARED_CONFIG;
