import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, Alert } from '@mui/material';
import { configService } from '../../services/config/firebaseConfigService';

export const FirebaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setConnectionStatus('connecting');
    setError(null);
    
    try {
      // Initialize and fetch config
      await configService.initialize();
      await configService.refresh();
      
      const allConfig = configService.getAll();
      setConfig(allConfig);
      setConnectionStatus('connected');
      
      console.log('🔥 Firebase Remote Config loaded:', allConfig);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setConnectionStatus('failed');
      console.error('❌ Firebase connection failed:', err);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          🔥 Firebase Remote Config Connection Test
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Chip 
            label={
              connectionStatus === 'connecting' ? 'Connecting...' :
              connectionStatus === 'connected' ? 'Connected ✅' :
              'Failed ❌'
            }
            color={
              connectionStatus === 'connecting' ? 'warning' :
              connectionStatus === 'connected' ? 'success' :
              'error'
            }
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Connection Error:</strong> {error}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Check your .env.local file and Firebase project configuration.
            </Typography>
          </Alert>
        )}

        {config && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configuration Values:
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <Box>
                <Typography variant="subtitle2">API Configuration:</Typography>
                <Typography variant="body2">Base URL: {config.apiBaseUrl}</Typography>
                <Typography variant="body2">Timeout: {config.apiTimeout}ms</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">OAuth:</Typography>
                <Typography variant="body2">
                  Google Client ID: {config.googleClientId ? 'Configured ✅' : 'Not set ❌'}
                </Typography>
                <Typography variant="body2">
                  Google Auth Enabled: {config.enableGoogleAuth ? 'Yes ✅' : 'No ❌'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">Features:</Typography>
                <Typography variant="body2">
                  AI Chatbot: {config.enableAiChatbot ? 'Enabled ✅' : 'Disabled ❌'}
                </Typography>
                <Typography variant="body2">
                  GPS Tracking: {config.enableGpsTracking ? 'Enabled ✅' : 'Disabled ❌'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2">API Keys:</Typography>
                <Typography variant="body2">
                  Pets API: {config.petsApiKey ? 'Configured ✅' : 'Not set ❌'}
                </Typography>
                <Typography variant="body2">
                  Gemini API: {config.geminiApiKey ? 'Configured ✅' : 'Not set ❌'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={testConnection}
            disabled={connectionStatus === 'connecting'}
          >
            Test Connection
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => console.log('Current config:', configService.getAll())}
          >
            Log Config to Console
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Next Steps:</strong>
          </Typography>
          <Typography variant="body2">
            1. Create .env.local with your Firebase config<br/>
            2. Add Remote Config parameters in Firebase console<br/>
            3. Add your Google OAuth Client ID to Remote Config<br/>
            4. Publish changes in Firebase Remote Config
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default FirebaseConnectionTest;

