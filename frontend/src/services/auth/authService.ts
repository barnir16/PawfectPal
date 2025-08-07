import { apiRequest } from '../api';
import type { LoginResponse, User } from '../../types/auth';
import { StorageHelper } from './../../utils/StorageHelper';
/**
 * Login with username and password
 */
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
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
    body: JSON.stringify({ username, password, email, fullName })
  });
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  // Clear the auth token from storage
  await StorageHelper.removeItem('authToken');
};
