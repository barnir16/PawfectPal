import { apiRequest } from '../api';
import type { LoginResponse, User } from '../../types/auth';
import { StorageHelper } from '../../utils/StorageHelper';

/**
 * Login with username and password using OAuth2 password grant
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  return apiRequest<LoginResponse>('/token', {
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
  return apiRequest<User>('/register', {
    method: 'POST',
    body: JSON.stringify({ 
      username, 
      password, 
      email, 
      full_name: fullName 
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
  
  return apiRequest<LoginResponse>('/token', {
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
