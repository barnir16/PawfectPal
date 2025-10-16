import { useState, useEffect } from 'react';
import { configService, type AppConfig } from '../services/config/firebaseConfigService';

/**
 * React hook for accessing Firebase Remote Config
 * Provides reactive updates when configuration changes
 */
export const useConfig = () => {
  const [config, setConfig] = useState<AppConfig>(configService.getAll());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refresh configuration and update state
  const refreshConfig = async () => {
    setIsLoading(true);
    try {
      await configService.refresh();
      setConfig(configService.getAll());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh on mount
  useEffect(() => {
    refreshConfig();
    
    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(refreshConfig, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    config,
    isLoading,
    lastUpdated,
    refreshConfig,
    
    // Convenience getters
    get: <K extends keyof AppConfig>(key: K) => config[key],
    isFeatureEnabled: (feature: keyof Pick<AppConfig, 'enableGoogleAuth' | 'enableGpsTracking' | 'enableAiChatbot' | 'enableNotifications' | 'enableOfflineMode'>) => config[feature],
    getApiConfig: () => configService.getApiConfig(),
    getOAuthConfig: () => configService.getOAuthConfig(),
    getEmergencyContacts: () => configService.getEmergencyContacts(),
    getThemeConfig: () => configService.getThemeConfig(),
  };
};

/**
 * Hook for specific configuration value
 * Re-renders component when the specific value changes
 */
export const useConfigValue = <K extends keyof AppConfig>(key: K): AppConfig[K] => {
  const { config } = useConfig();
  return config[key];
};

/**
 * Hook for feature flags
 * Returns boolean indicating if feature is enabled
 */
export const useFeatureFlag = (feature: keyof Pick<AppConfig, 'enableGoogleAuth' | 'enableGpsTracking' | 'enableAiChatbot' | 'enableNotifications' | 'enableOfflineMode'>): boolean => {
  const { config } = useConfig();
  return config[feature];
};

/**
 * Hook for API configuration
 * Useful for components that make API calls
 */
export const useApiConfig = () => {
  const { config } = useConfig();
  return {
    baseUrl: config.apiBaseUrl,
    timeout: config.apiTimeout,
  };
};

/**
 * Hook for theme configuration
 * Useful for applying dynamic theming
 */
export const useThemeConfig = () => {
  const { config } = useConfig();
  return {
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    appName: config.appName,
    version: config.version,
  };
};

