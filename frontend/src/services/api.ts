import { StorageHelper } from '../utils/StorageHelper';
import { configService } from './config/firebaseConfigService';

type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, QueryParamValue>;
}

const DEFAULT_LOCAL_API = "http://localhost:8000";

const sanitizeApiBaseUrl = (url: string): string => {
  if (!url) {
    return url;
  }

  const trimmedUrl = url.trim();

  // Railway should always be accessed over HTTPS in production to avoid mixed-content errors.
  if (/^http:\/\/.*railway\.app/i.test(trimmedUrl)) {
    return trimmedUrl.replace(/^http:/i, "https:");
  }

  return trimmedUrl;
};

// Get API URL from public Vite config with local fallback.
export const getBaseUrl = (): string => {
  const isBrowser = typeof window !== "undefined";
  const protocol = isBrowser ? window.location.protocol : "";

  try {
    const apiConfig = configService.getApiConfig();
    const baseUrl = sanitizeApiBaseUrl(apiConfig.baseUrl || "");

    // If we're served over HTTPS, do not allow an HTTP API URL in browser context.
    if (protocol === "https:" && /^http:\/\//i.test(baseUrl)) {
      return baseUrl.replace(/^http:/i, "https:");
    }

    return baseUrl || DEFAULT_LOCAL_API;
  } catch (error) {
    console.warn("Error getting API config, using fallback backend URL:", error);
    return DEFAULT_LOCAL_API;
  }
};

// Don't set BASE_URL at module load time - get it dynamically
export const BASE_URL = DEFAULT_LOCAL_API;

const buildApiUrl = (
  endpoint: string,
  params?: Record<string, QueryParamValue>
): string => {
  const normalizedBaseUrl = getBaseUrl().replace(/\/+$/, '');
  const url = new URL(`${normalizedBaseUrl}${endpoint}`);

  if (!params) {
    return url.toString();
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        url.searchParams.append(key, String(item));
      });
      return;
    }

    url.searchParams.append(key, String(value));
  });

  return url.toString();
};

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
 * Build a human-readable message for a single FastAPI/Pydantic validation
 * error entry, e.g. {loc: ["body", "weight_kg"], msg: "..."} -> "weight kg: ...".
 */
const describeValidationError = (err: any): string => {
  const path = Array.isArray(err?.loc)
    ? err.loc.filter((segment: unknown) => segment !== 'body' && segment !== 'query')
    : [];
  const field = path.length ? path.join('.') : 'value';
  const message = err?.msg || 'is invalid';
  return `${field}: ${message}`;
};

/**
 * Handle API errors consistently. Every branch produces a message that
 * tells the user what happened and, where possible, what to do about it -
 * never a bare "couldn't fetch" / "error" string.
 */
export const handleApiError = async (response: Response): Promise<never> => {
  let errorData: any = {};
  let bodyWasParsed = true;

  try {
    const errorText = await response.text();
    errorData = errorText ? JSON.parse(errorText) : {};
  } catch (e) {
    bodyWasParsed = false;
  }

  const fail = (message: string, extra?: Record<string, unknown>): never => {
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).data = errorData;
    if (extra) {
      Object.assign(error, extra);
    }
    throw error;
  };

  const detail = typeof errorData?.detail === 'string' ? errorData.detail : undefined;

  switch (response.status) {
    case 401: {
      const message =
        !detail || detail === 'Could not validate credentials'
          ? 'Your login session has expired. Please log in again.'
          : detail;
      return fail(message, { isAuthError: true });
    }

    case 403:
      return fail(
        detail || "You don't have permission to do that with this account."
      );

    case 404:
      return fail(
        detail ||
          "We couldn't find what you were looking for. It may have been moved, deleted, or never existed."
      );

    case 409:
      return fail(
        detail ||
          'This conflicts with existing data - it may already exist or have been changed by someone else. Please refresh and try again.'
      );

    case 422: {
      if (Array.isArray(errorData?.detail)) {
        const fieldErrors = errorData.detail.map(describeValidationError).join('; ');
        return fail(`Please check the following and try again: ${fieldErrors}`);
      }
      return fail(`Please check your input: ${detail || 'one or more fields are invalid.'}`);
    }

    case 429:
      return fail("You're doing that a bit too quickly. Please wait a moment and try again.");

    case 400:
      return fail(
        detail ||
          "That request couldn't be processed - please check the information you entered and try again."
      );

    case 502:
    case 503:
    case 504:
      return fail('The server is temporarily unavailable. Please try again in a few moments.');
  }

  if (response.status >= 500) {
    return fail(
      "Something went wrong on our end, not yours. Please try again in a moment - if this keeps happening, let us know."
    );
  }

  if (!bodyWasParsed) {
    return fail(
      `The server returned an unexpected response (status ${response.status}${
        response.statusText ? ` ${response.statusText}` : ''
      }). Please try again.`
    );
  }

  return fail(detail || `Something went wrong (status ${response.status}). Please try again.`);
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
  options: ApiRequestOptions = {},
  retryCount: number = 0
): Promise<T> => {
  const { params, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  const authHeaders = await getAuthHeaders();

  Object.entries(authHeaders).forEach(([key, value]) => {
    if (value) {
      headers.set(key, value);
    }
  });

  if (requestOptions.body instanceof FormData) {
    headers.delete('Content-Type');
  }

  const fullUrl = buildApiUrl(endpoint, params);

  // Without an explicit timeout, a hung connection (bad wifi, server not
  // responding) would leave the caller waiting forever with no feedback at
  // all - worse than a vague error message. Abort and surface a clear
  // "timed out" error instead.
  let timeoutMs = 15000;
  try {
    const configuredTimeout = configService.getApiConfig().timeout;
    if (typeof configuredTimeout === 'number' && configuredTimeout > 0) {
      timeoutMs = configuredTimeout;
    }
  } catch {
    // fall back to the default above
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(fullUrl, {
      ...requestOptions,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    console.error('API request failed:', error);

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        'That request took too long and timed out. Please check your connection and try again.'
      );
    }

    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const networkError = new Error(
      isOffline
        ? "You appear to be offline. Please check your internet connection and try again."
        : "We couldn't reach the server. Please check your connection and try again in a moment."
    );
    (networkError as any).isNetworkError = true;
    (networkError as any).cause = error;
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
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

  try {
    return await response.json();
  } catch (error) {
    console.error('Failed to parse API response as JSON:', error);
    throw new Error("The server's response couldn't be read. Please try again.");
  }
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
  get: <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined)
    }),

  put: <T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),

  patch: <T>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
