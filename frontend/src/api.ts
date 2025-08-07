import type { Pet } from './types/pets';
import type { Task } from './types/tasks';
import type { Vaccine, AgeRestriction } from './types/vaccines';
import type { User, LoginResponse } from './types/auth';
import type { BreedInfoResponse, CatBreedInfoResponse } from './types/external';
import type { Service, ServiceStatus } from './types/services';
import type { LocationHistory, Coordinates } from './types/location';
import type { UploadResponse } from './types/common';
import { StorageHelper } from './utils/StorageHelper';
import { getApiUrl } from './config';

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
const getAuthHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Handle API errors consistently
 */
export const handleApiError = async (response: Response): Promise<never> => {
  const errorText = await response.text();
  let errorMessage: string;
  
  try {
    const errorData = JSON.parse(errorText);
    errorMessage = errorData.detail || errorData.message || 'API request failed';
  } catch {
    errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
  }
  
  throw new Error(errorMessage);
};

// ===== AUTHENTICATION API =====

export async function login(username: string, password: string): Promise<LoginResponse> {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function register(username: string, password: string, email?: string, fullName?: string): Promise<User> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, full_name: fullName }),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

// ===== PET MANAGEMENT API =====

export async function getPets(): Promise<Pet[]> {
  const res = await fetch(`${BASE_URL}/pets`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function createPet(pet: Omit<Pet, 'id'>): Promise<Pet> {
  const res = await fetch(`${BASE_URL}/pets`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(pet),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function updatePet(petId: number, pet: Omit<Pet, 'id'>): Promise<Pet> {
  const res = await fetch(`${BASE_URL}/pets/${petId}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(pet),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function deletePet(petId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/pets/${petId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
}

// ===== GPS TRACKING API =====

export async function updatePetLocation(petId: number, location: Omit<LocationHistory, 'id'>): Promise<LocationHistory> {
  const res = await fetch(`${BASE_URL}/pets/${petId}/location`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(location),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function getPetLocationHistory(petId: number, limit: number = 100): Promise<LocationHistory[]> {
  const res = await fetch(`${BASE_URL}/pets/${petId}/location-history?limit=${limit}`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
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

// ===== IMAGE UPLOAD API =====

/**
 * Upload pet image using browser File input
 */
export async function uploadPetImage(petId: number, file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${BASE_URL}/upload/pet-image/${petId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getToken()}`,
      // DO NOT set Content-Type when sending FormData — browser sets it automatically including boundaries
    },
    body: formData,
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Upload task attachment using browser File input
 */
export async function uploadTaskAttachment(taskId: number, file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${BASE_URL}/upload/task-attachment/${taskId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getToken()}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

// ===== SERVICE BOOKING API =====

export async function getServices(): Promise<Service[]> {
  const res = await fetch(`${BASE_URL}/services`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function createService(service: Omit<Service, 'id'>): Promise<Service> {
  const res = await fetch(`${BASE_URL}/services`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(service),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function updateServiceStatus(serviceId: number, status: ServiceStatus): Promise<Service> {
  const res = await fetch(`${BASE_URL}/services/${serviceId}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

// ===== TASK MANAGEMENT API =====

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(task),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function updateTask(taskId: number, task: Omit<Task, 'id'>): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'PUT', // Changed from POST to PUT for update
    headers: await getAuthHeaders(),
    body: JSON.stringify(task),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function deleteTask(taskId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
}

// ===== VACCINE MANAGEMENT API =====

export async function getVaccines(): Promise<Vaccine[]> {
  const res = await fetch(`${BASE_URL}/vaccines`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function createVaccine(vaccine: Omit<Vaccine, 'id'>): Promise<Vaccine> {
  const res = await fetch(`${BASE_URL}/vaccines`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(vaccine),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

// ===== AGE RESTRICTION API =====

export async function getAgeRestrictions(): Promise<AgeRestriction[]> {
  const res = await fetch(`${BASE_URL}/age_restrictions`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

export async function createAgeRestriction(restriction: AgeRestriction): Promise<AgeRestriction> {
  const res = await fetch(`${BASE_URL}/age_restrictions`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(restriction),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

// ===== EXTERNAL API INTEGRATIONS =====

export async function getDogBreedInfo(breedName: string, apiKey: string): Promise<BreedInfoResponse> {
  const res = await fetch(`https://api.thedogapi.com/v1/breeds/search?q=${encodeURIComponent(breedName)}`, {
    headers: {
      'x-api-key': apiKey,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch dog breed info');
  }
  
  const breeds = await res.json();
  return breeds[0];
}

export async function getCatBreedInfo(breedName: string, apiKey: string): Promise<CatBreedInfoResponse> {
  const res = await fetch(`https://api.thecatapi.com/v1/breeds/search?q=${encodeURIComponent(breedName)}`, {
    headers: {
      'x-api-key': apiKey,
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch cat breed info');
  }
  
  const breeds = await res.json();
  return breeds[0];
}

// ===== BROWSER LOCATION SERVICES =====

export async function getCurrentLocation(): Promise<Coordinates> {
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
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude ?? undefined,
          speed: position.coords.speed ?? undefined,
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
      }
    );
  });
}

let watchId: number | null = null;

export function watchLocation(
  onLocationUpdate: (coordinates: Coordinates) => void,
  onError: (error: Error) => void
): void {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by your browser'));
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude ?? undefined,
        speed: position.coords.speed ?? undefined,
      });
    },
    (error) => {
      onError(new Error(`Location error: ${error.message}`));
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );
}

export function clearLocationWatch(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}
