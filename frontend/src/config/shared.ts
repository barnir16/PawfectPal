/**
 * Shared Configuration for PawfectPal
 * This file can be safely shared with team members
 * Firebase API keys are public and safe to expose
 */

export const SHARED_CONFIG = {
  // Firebase Configuration (Safe to expose - security handled by Firebase Rules)
  firebase: {
    apiKey: "AIzaSyDoNsVE_ZmgBBuVJ3IKZpAAZRz9HS-67s8",
    authDomain: "pawfectpal-ac5d7.firebaseapp.com",
    projectId: "pawfectpal-ac5d7",
    storageBucket: "pawfectpal-ac5d7.firebasestorage.app",
    messagingSenderId: "204752166323",
    appId: "1:204752166323:web:4efd89fff62af150343fc6",
  },

  // App Configuration
  app: {
    name: "PawfectPal",
    version: "1.0.0",
    environment: "development" as const,
  },

  // Development Settings
  development: {
    apiBaseUrl: import.meta.env.VITE_API_URL || "https://pawfectpal-production.up.railway.app",
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

  // External API Keys (These should be stored in Firebase Remote Config)
  externalApis: {
    googleMapsApiKey: "", // Set via Firebase Remote Config
    weatherApiKey: "",    // Set via Firebase Remote Config
    openAiApiKey: "",     // Set via Firebase Remote Config
    petsApiKey: "",       // Set via Firebase Remote Config
    geminiApiKey: "",     // Set via Firebase Remote Config
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
    baseConfig.development.apiBaseUrl = "https://api.pawfectpal.com"; // Replace with actual production URL
    baseConfig.development.enableDebugMode = false;
    baseConfig.development.enableMockData = false;
  }
  
  return baseConfig;
};

/**
 * Export default configuration
 */
export default SHARED_CONFIG;
