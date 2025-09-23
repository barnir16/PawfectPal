import React, { useState } from 'react';
import { Button, Card, CardContent, Typography, Box, Alert } from '@mui/material';

export const FirebaseTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testFirebaseConfig = async () => {
    setIsLoading(true);
    setTestResult('Testing Firebase configuration...');

    try {
      // Test 1: Check if Firebase config is accessible
      const { SHARED_CONFIG } = await import('../../config/shared');
      const firebaseConfig = SHARED_CONFIG.firebase;

      setTestResult('✅ Firebase config loaded\n');

      // Test 2: Try to initialize Firebase manually
      const { initializeApp } = await import('firebase/app');
      const app = initializeApp(firebaseConfig);
      
      setTestResult(prev => prev + '✅ Firebase app initialized\n');

      // Test 3: Try to get Remote Config
      const { getRemoteConfig, fetchAndActivate } = await import('firebase/remote-config');
      const remoteConfig = getRemoteConfig(app);
      
      setTestResult(prev => prev + '✅ Remote Config instance created\n');

      // Test 4: Try to fetch config
      await fetchAndActivate(remoteConfig);
      
      setTestResult(prev => prev + '✅ Remote Config fetched successfully!\n');
      setTestResult(prev => prev + '🎉 All Firebase tests passed!');

    } catch (error: any) {
      console.error('Firebase test error:', error);
      setTestResult(prev => prev + `❌ Error: ${error.message}\n`);
      
      if (error.message.includes('API key not valid')) {
        setTestResult(prev => prev + '\n🔧 Solution: Check API key restrictions in Google Cloud Console');
      } else if (error.message.includes('PERMISSION_DENIED')) {
        setTestResult(prev => prev + '\n🔧 Solution: Enable Firebase Remote Config API');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          🔥 Firebase Connection Test
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            onClick={testFirebaseConfig}
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test Firebase Connection'}
          </Button>
        </Box>

        {testResult && (
          <Alert severity={testResult.includes('❌') ? 'error' : 'success'}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {testResult}
            </Typography>
          </Alert>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>If you see API key errors:</strong><br/>
            1. Go to Google Cloud Console → APIs & Services → Credentials<br/>
            2. Click your API key (AIzaSybNsVE_...)<br/>
            3. Set API restrictions to "Don't restrict key"<br/>
            4. Enable "Firebase Remote Config API" in the Library
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default FirebaseTest;

