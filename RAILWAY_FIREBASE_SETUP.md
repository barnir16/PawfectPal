# Railway Firebase Setup Guide

## 🎯 Firebase Remote Config Fix for Railway

### **Problem Identified**
- Firebase Remote Config API requires **OAuth 2 authentication**, not just API keys
- Railway containers don't have Google Cloud SDK or cached credentials
- Current code uses incorrect authentication method

### **Solution Implemented**

#### **1. New Firebase Admin Service**
- Created `backend/services/firebase_admin.py`
- Uses proper OAuth 2 authentication with service account
- Handles both service account JSON and default credentials
- Correct Firebase Remote Config API endpoint

#### **2. User-Specific Firebase Service**
- Created `backend/services/firebase_user_service.py`
- Allows **ALL authenticated users** to access Firebase features
- Works for both Google OAuth and email/password users
- User-specific Firebase configuration

#### **3. Updated Dependencies**
- Added Google Auth libraries to `requirements.txt`
- `google-auth==2.23.4`
- `google-auth-oauthlib==1.1.0`
- `google-auth-httplib2==0.1.1`

### **Railway Environment Variables Needed**

#### **Option 1: Service Account (Recommended)**
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"pawfectpal-ac5d7",...}
```

#### **Option 2: Environment Variables (Fallback)**
```bash
GEMINI_API_KEY=REDACTED_GEMINI_API_KEY
```

### **How to Get Service Account JSON**

1. **Go to Firebase Console** → Project Settings → Service Accounts
2. **Click "Generate new private key"**
3. **Download the JSON file**
4. **Set as Railway environment variable** `FIREBASE_SERVICE_ACCOUNT_JSON`

### **What's Fixed**

✅ **Firebase Remote Config Authentication** - Now uses proper OAuth 2
✅ **All Users Can Access Firebase** - Not just Google OAuth users
✅ **Railway Compatibility** - Works in containerized environment
✅ **Fallback Support** - Environment variables as backup
✅ **User-Specific Config** - Each user gets their own Firebase access

### **Testing**

#### **Test Firebase Config Access**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-railway-app.railway.app/ai/firebase-config
```

#### **Test AI Chat (Now Works for All Users)**
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello","pet_context":{}}' \
     https://your-railway-app.railway.app/ai/chat
```

### **Expected Results**

- ✅ No more 404 errors from Firebase Remote Config
- ✅ AI chat works for email/password users
- ✅ Firebase config accessible to all authenticated users
- ✅ Proper OAuth 2 authentication with Firebase APIs
