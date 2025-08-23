# Firebase Remote Config Parameters for PawfectPal

Add these parameters in your Firebase Remote Config console:

## 🔑 API Configuration
```
Parameter: api_base_url
Value: http://127.0.0.1:8000
Description: Backend API base URL

Parameter: pets_api_key
Value: [your existing value]
Description: External pets API key

Parameter: gemini_api_key  
Value: [your existing value]
Description: Google Gemini AI API key for chatbot
```

## 🔐 Google OAuth
```
Parameter: google_client_id
Value: [your OAuth client ID from Step 2]
Description: Google OAuth Client ID for sign-in

Parameter: enable_google_auth
Value: true
Description: Enable Google Sign-In feature
```

## 🚀 Feature Flags
```
Parameter: enable_gps_tracking
Value: true
Description: Enable GPS pet tracking

Parameter: enable_ai_chatbot
Value: true
Description: Enable AI chatbot assistant

Parameter: enable_notifications
Value: true
Description: Enable push notifications

Parameter: enable_offline_mode
Value: false
Description: Enable offline functionality
```

## ⚙️ App Settings
```
Parameter: environment
Value: development
Description: Current environment

Parameter: api_timeout
Value: 10000
Description: API request timeout in milliseconds

Parameter: max_image_upload_size
Value: 5242880
Description: Maximum image upload size (5MB)

Parameter: supported_image_formats
Value: ["image/jpeg","image/png","image/webp"]
Description: Supported image formats (JSON array)
```

## 🆘 Emergency Configuration
```
Parameter: emergency_vet_contact
Value: 911
Description: Emergency veterinary contact

Parameter: poison_control_contact
Value: (888) 426-4435
Description: Pet poison control hotline
```

## 🎨 UI Configuration
```
Parameter: primary_color
Value: #007AFF
Description: App primary color

Parameter: secondary_color
Value: #34C759
Description: App secondary color

Parameter: app_name
Value: PawfectPal
Description: Application name

Parameter: version
Value: 1.0.0
Description: Application version
```

## 📝 How to Add Parameters

1. Go to Firebase Console → Remote Config
2. Click "Add parameter"
3. Enter parameter name and default value
4. Add description for documentation
5. Click "Save"
6. Repeat for all parameters
7. Click "Publish changes" when done

## 🎯 Priority Parameters (Add These First)

If you want to start with just the essential ones:

1. `google_client_id` - Your OAuth client ID
2. `enable_google_auth` - Set to `true`
3. `api_base_url` - `http://127.0.0.1:8000`
4. `enable_ai_chatbot` - Set to `true`
5. `environment` - `development`

You can add the rest later!

