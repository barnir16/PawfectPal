# Firebase Remote Config Setup Guide

PawfectPal now uses Firebase Remote Config for centralized key management instead of `.env` files. This provides better security, real-time updates, and centralized configuration management.

## 🚀 Benefits of Firebase Remote Config

- **🔐 Secure**: API keys stored securely in Firebase, not in your codebase
- **🔄 Real-time Updates**: Change configuration without redeploying
- **🎛️ Feature Flags**: Enable/disable features remotely
- **🌍 Environment Management**: Different configs for dev/staging/production
- **📊 A/B Testing**: Test different configurations with different user groups
- **💾 Fallback**: Graceful degradation when Firebase is unavailable

## 📋 Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `pawfectpal-config` (or your preferred name)
4. Disable Google Analytics (optional for config-only project)
5. Click "Create project"

### 2. Enable Remote Config

1. In your Firebase project, go to "Remote Config" in the left sidebar
2. Click "Create configuration"
3. You'll start with an empty configuration

### 3. Add Configuration Parameters

Add these parameters in Firebase Remote Config:

#### **API Configuration**
```
Parameter: api_base_url
Default value: http://127.0.0.1:8000
Description: Backend API base URL
```

#### **Google OAuth**
```
Parameter: google_client_id
Default value: (leave empty initially)
Description: Google OAuth Client ID

Parameter: enable_google_auth
Default value: false
Description: Enable Google Sign-In feature
```

#### **External API Keys**
```
Parameter: google_maps_api_key
Default value: (leave empty initially)
Description: Google Maps API key for GPS features

Parameter: weather_api_key
Default value: (leave empty initially)
Description: Weather API key for location features

Parameter: openai_api_key
Default value: (leave empty initially)
Description: OpenAI API key for enhanced AI features
```

#### **Feature Flags**
```
Parameter: enable_gps_tracking
Default value: true
Description: Enable GPS pet tracking

Parameter: enable_ai_chatbot
Default value: true
Description: Enable AI chatbot assistant

Parameter: enable_notifications
Default value: true
Description: Enable push notifications

Parameter: enable_offline_mode
Default value: false
Description: Enable offline functionality
```

#### **App Settings**
```
Parameter: environment
Default value: development
Description: Current environment (development/staging/production)

Parameter: api_timeout
Default value: 10000
Description: API request timeout in milliseconds

Parameter: max_image_upload_size
Default value: 5242880
Description: Maximum image upload size in bytes (5MB)

Parameter: supported_image_formats
Default value: ["image/jpeg","image/png","image/webp"]
Description: Supported image formats (JSON array)
```

#### **Emergency Configuration**
```
Parameter: emergency_vet_contact
Default value: 911
Description: Emergency veterinary contact number

Parameter: poison_control_contact
Default value: (888) 426-4435
Description: Pet poison control hotline
```

#### **UI Configuration**
```
Parameter: primary_color
Default value: #007AFF
Description: App primary color

Parameter: secondary_color
Default value: #34C759
Description: App secondary color

Parameter: app_name
Default value: PawfectPal
Description: Application name

Parameter: version
Default value: 1.0.0
Description: Application version
```

### 4. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app (</>) 
4. Register app name: `pawfectpal-web`
5. Copy the Firebase configuration object

### 5. Configure Environment Variables

Create `.env.local` in the frontend directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Fallback API URL (used when Firebase is unavailable)
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 6. Publish Configuration

1. In Firebase Remote Config, click "Publish changes"
2. Add a description: "Initial PawfectPal configuration"
3. Click "Publish"

## 🎯 Usage in Code

The configuration service is automatically initialized. Use it like this:

```typescript
import { configService } from '@/services/config/firebaseConfigService';

// Get specific values
const apiUrl = configService.get('apiBaseUrl');
const isGoogleAuthEnabled = configService.isFeatureEnabled('enableGoogleAuth');

// Get grouped configurations
const oauthConfig = configService.getOAuthConfig();
const apiConfig = configService.getApiConfig();
const emergencyContacts = configService.getEmergencyContacts();

// Manually refresh configuration
await configService.refresh();
```

## 🔄 Real-time Updates

Configuration updates in Firebase Remote Config are automatically fetched:
- **Minimum fetch interval**: 5 minutes
- **Fetch timeout**: 10 seconds
- **Automatic retry**: On network recovery

## 🌍 Environment-Specific Configuration

### Development
Set `environment: development` in Remote Config and use development API URLs.

### Staging
Set `environment: staging` and configure staging API endpoints.

### Production
Set `environment: production` and use production API keys and endpoints.

## 🛡️ Security Best Practices

1. **Conditional Rules**: Use Firebase Remote Config conditions to serve different values to different environments
2. **Key Rotation**: Regularly rotate API keys through Remote Config
3. **Access Control**: Use Firebase IAM to control who can modify configurations
4. **Audit Logs**: Monitor configuration changes through Firebase console

## 🚨 Fallback Behavior

If Firebase is unavailable, the app uses fallback configuration:
- Basic functionality remains available
- Google Sign-In is disabled
- GPS features may be limited
- Emergency contacts use default values

## 📱 Testing Configuration

1. **Local Testing**: Run app locally to verify Firebase connection
2. **Remote Testing**: Deploy to staging with staging Remote Config
3. **A/B Testing**: Use Firebase's percentage-based rollouts
4. **Feature Flags**: Toggle features without code changes

## 🔧 Troubleshooting

**Configuration not loading?**
- Check Firebase project ID in environment variables
- Verify Remote Config is enabled in Firebase console
- Check browser network tab for Firebase requests

**Values not updating?**
- Wait for minimum fetch interval (5 minutes)
- Call `configService.refresh()` manually
- Check Firebase console for published changes

**App using fallback config?**
- Firebase configuration missing or invalid
- Network connectivity issues
- Remote Config service errors

## 📦 Package Dependencies

The Firebase config service requires these packages:

```bash
npm install firebase
```

This is automatically included in the project dependencies.

## 🎉 Benefits Achieved

✅ **Centralized Configuration**: All app settings in one place  
✅ **Secure Key Management**: No API keys in codebase  
✅ **Real-time Updates**: Change settings without redeploy  
✅ **Feature Flags**: Enable/disable features remotely  
✅ **Environment Management**: Easy dev/staging/prod configs  
✅ **Graceful Fallbacks**: App works even if Firebase is down  

Your PawfectPal app now has enterprise-grade configuration management! 🎯

