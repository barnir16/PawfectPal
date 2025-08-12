import { StorageHelper } from '../utils/StorageHelper';
import { getApiUrl } from '../config';

export const BASE_URL = getApiUrl();

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
  
  const errorMessage = errorData?.detail || errorData?.message || `HTTP error! status: ${response.status}`;
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
  // Create headers with proper type
  const headers = new Headers(options.headers);
  const authHeaders = await getAuthHeaders();
  
  // Add auth headers
  Object.entries(authHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });

  // Remove Content-Type for FormData to let the browser set it with the correct boundary
  if (options.body instanceof FormData) {
    headers.delete('Content-Type');
  }

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

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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
