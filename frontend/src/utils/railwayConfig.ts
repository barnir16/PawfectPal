// Railway-specific configuration for web deployment
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
    if (railwayConfig.isRailway()) {
      // Railway production URL
      return 'https://pawfectpal-production-2f07.up.railway.app';
    }
    // Local development
    return 'http://localhost:8000';
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
