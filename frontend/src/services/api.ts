import { StorageHelper } from '../utils/StorageHelper';
import { configService } from './config/firebaseConfigService';

// Get API URL from Firebase config with fallback
export const getBaseUrl = (): string => {
  try {
    const apiConfig = configService.getApiConfig();
    const baseUrl = apiConfig.baseUrl;

    const isProduction = window.location.hostname.includes('railway.app');

    if (isProduction) {
      return "https://pawfectpal-production.up.railway.app";
    }

    return baseUrl || "http://localhost:8000";
  } catch (error) {
    console.warn('Error getting API config, using local dev backend:', error);
    return "http://localhost:8000";
  }
};

// Don't set BASE_URL at module load time - get it dynamically
export const BASE_URL = "https://pawfectpal-production.up.railway.app";

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
    const errorText = await response.text();
    errorData = errorText ? JSON.parse(errorText) : {};
  } catch (e) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (response.status === 401) {
    let authError = "Authentication failed";
    if (errorData?.detail) {
      if (errorData.detail === "Could not validate credentials") {
        authError = "Your login session has expired. Please log in again.";
      } else {
        authError = errorData.detail;
      }
    }
    const error = new Error(authError);
    (error as any).status = response.status;
    (error as any).isAuthError = true;
    (error as any).data = errorData;
    throw error;
  }

  if (response.status === 422 && errorData?.detail) {
    if (Array.isArray(errorData.detail)) {
      const fieldErrors = errorData.detail
        .map((err: any) => `${err.loc?.join('.')}: ${err.msg}`)
        .join(', ');
      const error = new Error(`Please check the following fields:\n${fieldErrors}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    } else {
      const error = new Error(`Please check your input: ${errorData.detail}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }
  }

  let errorMessage = "Something went wrong";
  if (errorData?.detail) {
    if (response.status === 403) {
      errorMessage = "You don't have permission to perform this action";
    } else if (response.status === 404) {
      errorMessage = "The requested resource was not found";
    } else if (response.status === 500) {
      errorMessage = "Server error. Please try again later";
    } else {
      errorMessage = errorData.detail;
    }
  } else if (response.status === 403) {
    errorMessage = "Access denied. Please check your permissions.";
  } else if (response.status === 404) {
    errorMessage = "Resource not found. Please check the URL.";
  } else if (response.status === 500) {
    errorMessage = "Server error. Please try again later.";
  }

  const error = new Error(errorMessage);
  (error as any).status = response.status;
  (error as any).data = errorData;
  throw error;
};

/**
 * Handle 401 errors with automatic token refresh and retry
 */
const handleAuthError = async (): Promise<void> => {
  await StorageHelper.removeItem('authToken');

  window.dispatchEvent(new CustomEvent('auth:token-expired', {
    detail: { reason: 'Token expired, please log in again' }
  }));
};

/**
 * Make an API request with proper error handling and retry logic
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<T> => {
  const headers = new Headers(options.headers);
  const authHeaders = await getAuthHeaders();

  Object.entries(authHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });

  if (options.body instanceof FormData) {
    headers.delete('Content-Type');
  }

  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${endpoint}`;

  let response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers
    });
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401) {
      await handleAuthError();
      return handleApiError(response);
    }

    if (retryCount < 2 && response.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return apiRequest<T>(endpoint, options, retryCount + 1);
    }

    return handleApiError(response);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return await response.json();
};

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get current geolocation
 */
export function getCurrentLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

let watchId: number | null = null;

/**
 * Watch for location changes
 */
export function watchLocation(
  onLocationUpdate: (coordinates: GeolocationCoordinates) => void,
  onError: (error: Error) => void
): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }

  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by your browser'));
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => onLocationUpdate(position.coords),
    (error) => {
      let errorMessage = 'Unable to retrieve your location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access was denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }
      onError(new Error(errorMessage));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

/**
 * Clear location watch
 */
export function clearLocationWatch(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

/**
 * API Client object for easy HTTP requests
 */
export const apiClient = {
  get: <T>(endpoint: string, options: RequestInit = {}): Promise<T> =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined)
    }),

  put: <T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),

  patch: <T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: <T>(endpoint: string, options: RequestInit = {}): Promise<T> =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
