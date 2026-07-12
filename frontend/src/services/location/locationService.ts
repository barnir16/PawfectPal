import { apiClient } from '../api';
import type { Coordinates, LocationHistory } from '../../types/location';

/**
 * Calculate distance between two coordinates in kilometers
 * using the Haversine formula
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

/**
 * Get the current device location using the browser's Geolocation API
 */
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied by the user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
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
};

let watchId: number | null = null;

/**
 * Watch the device's location and call the callback with updates
 */
export const watchLocation = (
  onLocationUpdate: (coordinates: Coordinates) => void,
  onError: (error: Error) => void
): void => {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by your browser'));
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    },
    (error) => {
      let errorMessage = 'Unable to retrieve your location';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access was denied by the user';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get user location timed out';
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
};

/**
 * Stop watching the device's location
 */
export const clearLocationWatch = (): void => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
};

/**
 * Persist a pet location update to the backend.
 */
export const savePetLocation = async (
  petId: number,
  coordinates: Coordinates
): Promise<LocationHistory> => {
  return apiClient.post<LocationHistory>(`/gps/pets/${petId}/location`, {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    accuracy: coordinates.accuracy,
    speed: coordinates.speed,
    altitude: coordinates.altitude,
    timestamp: new Date(coordinates.timestamp ?? Date.now()).toISOString(),
  });
};

/**
 * Fetch recent location history entries for a pet.
 */
export const getPetLocationHistory = async (
  petId: number,
  limit: number = 20
): Promise<LocationHistory[]> => {
  return apiClient.get<LocationHistory[]>(`/gps/pets/${petId}/location-history`, {
    params: { limit },
  });
};

/**
 * Build a Google Maps URL from coordinates.
 */
export const createMapsUrl = (
  coordinates: Coordinates,
  label?: string
): string => {
  const query = label
    ? `${coordinates.latitude},${coordinates.longitude} (${label})`
    : `${coordinates.latitude},${coordinates.longitude}`;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
