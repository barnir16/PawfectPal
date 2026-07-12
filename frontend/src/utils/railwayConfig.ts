// Railway-specific configuration for web deployment
const getConfiguredApiBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }
  return 'http://localhost:8000';
};

export const railwayConfig = {
  // Check if we're running on Railway
  isRailway: () => {
    return window.location.hostname.includes('railway.app') || 
           window.location.hostname.includes('up.railway.app');
  },

  // Check if we're on HTTPS (required for geolocation)
  isHTTPS: () => {
    return window.location.protocol === 'https:';
  },

  // Check if geolocation is available
  hasGeolocation: () => {
    return 'geolocation' in navigator;
  },

  // Check if file upload is supported
  hasFileUpload: () => {
    return 'FormData' in window && 'File' in window;
  },

  // Get environment-specific API base URL
  getApiBaseUrl: () => {
    return getConfiguredApiBaseUrl();
  },

  // Get feature availability based on environment
  getFeatureAvailability: () => {
    return {
      geolocation: railwayConfig.isHTTPS() && railwayConfig.hasGeolocation(),
      fileUpload: railwayConfig.hasFileUpload(),
      notifications: false, // Not available in web-only mode
      pushNotifications: false, // Not available in web-only mode
      camera: false, // Not available in web-only mode
    };
  },

  // Get user-friendly feature status messages
  getFeatureStatusMessages: () => {
    const features = railwayConfig.getFeatureAvailability();
    
    return {
      geolocation: features.geolocation 
        ? 'Location sharing available' 
        : 'Location sharing limited (address only)',
      fileUpload: features.fileUpload 
        ? 'Photo sharing available' 
        : 'Photo sharing not available',
      notifications: 'Notifications not available in web version',
    };
  }
};
