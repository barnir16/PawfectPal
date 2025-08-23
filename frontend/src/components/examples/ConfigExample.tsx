import React from 'react';
import { Box, Typography, Chip, Button, Card, CardContent } from '@mui/material';
import { useConfig, useFeatureFlag, useThemeConfig } from '../../hooks/useConfig';

/**
 * Example component showing how to use Firebase Remote Config
 * This demonstrates the new configuration system
 */
export const ConfigExample: React.FC = () => {
  const { config, isLoading, lastUpdated, refreshConfig } = useConfig();
  const isGoogleAuthEnabled = useFeatureFlag('enableGoogleAuth');
  const isAiChatbotEnabled = useFeatureFlag('enableAiChatbot');
  const themeConfig = useThemeConfig();

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          🔧 Firebase Remote Config Demo
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This component demonstrates the new Firebase-based configuration system.
          Configuration updates automatically without requiring app restart.
        </Typography>

        {/* Configuration Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configuration Status
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              label={isLoading ? 'Loading...' : 'Ready'} 
              color={isLoading ? 'warning' : 'success'} 
              size="small" 
            />
            <Chip 
              label={`Environment: ${config.environment}`} 
              color="info" 
              size="small" 
            />
            {lastUpdated && (
              <Chip 
                label={`Updated: ${lastUpdated.toLocaleTimeString()}`} 
                variant="outlined" 
                size="small" 
              />
            )}
          </Box>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={refreshConfig}
            disabled={isLoading}
          >
            Refresh Config
          </Button>
        </Box>

        {/* Feature Flags */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Feature Flags
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="Google Auth" 
              color={isGoogleAuthEnabled ? 'success' : 'default'} 
              variant={isGoogleAuthEnabled ? 'filled' : 'outlined'}
              size="small" 
            />
            <Chip 
              label="AI Chatbot" 
              color={isAiChatbotEnabled ? 'success' : 'default'} 
              variant={isAiChatbotEnabled ? 'filled' : 'outlined'}
              size="small" 
            />
            <Chip 
              label="GPS Tracking" 
              color={config.enableGpsTracking ? 'success' : 'default'} 
              variant={config.enableGpsTracking ? 'filled' : 'outlined'}
              size="small" 
            />
            <Chip 
              label="Notifications" 
              color={config.enableNotifications ? 'success' : 'default'} 
              variant={config.enableNotifications ? 'filled' : 'outlined'}
              size="small" 
            />
          </Box>
        </Box>

        {/* API Configuration */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            API Configuration
          </Typography>
          <Typography variant="body2">
            <strong>Base URL:</strong> {config.apiBaseUrl}
          </Typography>
          <Typography variant="body2">
            <strong>Timeout:</strong> {config.apiTimeout}ms
          </Typography>
          <Typography variant="body2">
            <strong>Max Upload Size:</strong> {(config.maxImageUploadSize / 1024 / 1024).toFixed(1)}MB
          </Typography>
        </Box>

        {/* Theme Configuration */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Theme Configuration
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: themeConfig.primaryColor, 
                borderRadius: 1 
              }} 
            />
            <Typography variant="body2">
              Primary: {themeConfig.primaryColor}
            </Typography>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: themeConfig.secondaryColor, 
                borderRadius: 1 
              }} 
            />
            <Typography variant="body2">
              Secondary: {themeConfig.secondaryColor}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>App:</strong> {themeConfig.appName} v{themeConfig.version}
          </Typography>
        </Box>

        {/* Emergency Contacts */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Emergency Contacts
          </Typography>
          <Typography variant="body2">
            <strong>Veterinary:</strong> {config.emergencyVetContact}
          </Typography>
          <Typography variant="body2">
            <strong>Poison Control:</strong> {config.poisonControlContact}
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.main', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: 'info.contrastText' }}>
            💡 All these values can be updated in Firebase Remote Config without requiring an app restart!
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ConfigExample;

