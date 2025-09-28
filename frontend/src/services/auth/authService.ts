import { apiRequest } from '../api';
import type { LoginResponse, User } from '../../types/auth';
import { StorageHelper } from '../../utils/StorageHelper';
import { configService } from '../config/firebaseConfigService';

// Google Sign-In types - removed unused interface

/**
 * Login with username and password using OAuth2 password grant
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  return apiRequest<LoginResponse>('/auth/token', {
    method: 'POST',
    body: formData
  });
};

/**
 * Register a new user
 */
export const register = async (
  username: string, 
  password: string, 
  email?: string, 
  fullName?: string
): Promise<User> => {
  return apiRequest<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ 
      username, 
      password, 
      email, 
      full_name: fullName,
      is_active: true 
    })
  });
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  // Clear the auth token from storage
  await StorageHelper.removeItem('authToken');
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    return await apiRequest<User>('/users/me');
  } catch (error) {
    // If not authenticated or token expired, return null
    if ((error as any)?.status === 401) {
      return null;
    }
    throw error;
  }
};

/**
 * Refresh the access token
 */
export const refreshToken = async (refreshToken: string): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append('grant_type', 'refresh_token');
  formData.append('refresh_token', refreshToken);
  
  return apiRequest<LoginResponse>('/auth/token', {
    method: 'POST',
    body: formData
  });
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  await apiRequest('/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string, 
  newPassword: string
): Promise<void> => {
  await apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword })
  });
};

/**
 * Initialize Google Sign-In
 */
export const initializeGoogleAuth = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const oauthConfig = configService.getOAuthConfig();
    
    console.log('🔍 OAuth Config:', oauthConfig);
    console.log('🔍 Google Client ID:', oauthConfig.googleClientId);
    console.log('🔍 Is Google Auth Enabled:', oauthConfig.isGoogleAuthEnabled);
    
    // Fallback to hardcoded values if config service fails
    const googleClientId = oauthConfig.googleClientId || '204752166323-r69volulegreitj2nflcoag0eae3iggk.apps.googleusercontent.com';
    const isGoogleAuthEnabled = oauthConfig.isGoogleAuthEnabled !== false; // Default to true
    
    console.log('🔧 Using Google Client ID:', googleClientId);
    console.log('🔧 Using Google Auth Enabled:', isGoogleAuthEnabled);
    
    if (!googleClientId || !isGoogleAuthEnabled) {
      reject(new Error("Google OAuth not configured or disabled"));
      return;
    }

    // Load Google Identity Services script
    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: () => {}, // Will be set per sign-in attempt
          });
          resolve();
        } else {
          reject(new Error('Google API not properly loaded'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Sign-In script'));
      };
      
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
};

/**
 * Sign in with Google using popup flow
 */
export const signInWithGoogle = (): Promise<LoginResponse> => {
  return new Promise((resolve, reject) => {
    const oauthConfig = configService.getOAuthConfig();
    
    // Fallback to hardcoded values if config service fails
    const googleClientId = oauthConfig.googleClientId || '204752166323-r69volulegreitj2nflcoag0eae3iggk.apps.googleusercontent.com';
    const isGoogleAuthEnabled = oauthConfig.isGoogleAuthEnabled !== false; // Default to true
    
    if (!googleClientId || !isGoogleAuthEnabled) {
      reject(new Error('Google Sign-In is not available. Please configure Google OAuth in Firebase Remote Config.'));
      return;
    }
    
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Sign-In not initialized'));
      return;
    }

    // Use the popup-based OAuth2 flow which is more reliable
    console.log('🚀 Initializing Google OAuth2 with client ID:', googleClientId);
    console.log('🚀 Current domain:', window.location.origin);
    
    // Use OAuth2 flow properly
    try {
      console.log('🔄 Using OAuth2 flow...');
      
      window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        callback: async (response: any) => {
          console.log('🎯 OAuth2 callback received:', response);
          
          if (response.error) {
            console.error('❌ OAuth2 error:', response.error);
            reject(new Error(response.error));
            return;
          }

          try {
            // Get user info using the access token
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                'Authorization': `Bearer ${response.access_token}`
              }
            });
            
            if (!userInfoResponse.ok) {
              throw new Error('Failed to get user info from Google');
            }
            
            const userInfo = await userInfoResponse.json();
            console.log('📋 User info:', userInfo);
            
            // Create a JWT-like credential for the backend
            const credential = btoa(JSON.stringify({
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
              sub: userInfo.id,
              access_token: response.access_token
            }));

            // Send to backend
            const loginResponse = await apiRequest<LoginResponse>('/auth/google', {
              method: 'POST',
              body: JSON.stringify({ credential })
            });
            
            resolve(loginResponse);
          } catch (error) {
            console.error('❌ Error processing OAuth2:', error);
            reject(error);
          }
        },
      }).requestAccessToken();
      
    } catch (error) {
      console.error('❌ Failed to initialize OAuth2:', error);
      reject(error);
    }
  });
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = (): void => {
  if (window.google?.accounts?.id) {
    window.google.accounts.id.disableAutoSelect();
  }
};
