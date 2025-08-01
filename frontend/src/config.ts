/**
 * Configuration settings for the PawfectPal app
 */

// API Configuration
export const API_CONFIG = {
  // For development on local machine
  LOCAL: 'http://127.0.0.1:8000',
  
  // For development on physical device (replace with your computer's IP)
  DEVICE: 'http://192.168.1.100:8000', // Change this to your computer's IP
  
  // For production
  PRODUCTION: 'https://your-api-domain.com',
};

// Get the appropriate API URL based on environment
export const getApiUrl = (): string => {
  // In a real app, you'd use environment variables
  // For now, we'll use a simple approach
  
  // Check if we're running on a physical device
  // In React Native, __DEV__ is true for development builds
  const isDevice = !__DEV__;
  
  if (isDevice) {
    // On physical device, use the device URL
    return API_CONFIG.DEVICE;
  } else {
    // On simulator/emulator, use localhost
    return API_CONFIG.LOCAL;
  }
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'PawfectPal',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'he'],
  DEFAULT_CURRENCY: 'USD',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Feature flags
export const FEATURES = {
  GPS_TRACKING: true,
  IMAGE_UPLOAD: true,
  SERVICE_BOOKING: true,
  AI_ASSISTANT: true,
  PUSH_NOTIFICATIONS: false, // Not implemented yet
  PAYMENT_PROCESSING: false, // Not implemented yet
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  GPS_ERROR: 'Location access denied. Please enable location services.',
  GENERAL_ERROR: 'Something went wrong. Please try again.',
}; 