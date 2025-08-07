import { StorageHelper } from '../utils/StorageHelper';
import { getApiUrl } from '../config';

const BASE_URL = getApiUrl();

/**
 * Get stored authentication token
 */
export const getToken = async (): Promise<string | null> => {
  return await StorageHelper.getItem('authToken');
};

/**
 * Add authentication header to requests
 */
export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Handle API errors consistently
 */
export const handleApiError = async (response: Response): Promise<never> => {
  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
  const error = new Error(errorMessage);
  (error as any).status = response.status;
  (error as any).data = errorData;
  throw error;
};

/**
 * Make an API request with proper error handling
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers = {
    ...(options.headers || {}),
    ...(await getAuthHeaders())
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    return handleApiError(response);
  }

  // For DELETE requests that don't return content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
};
