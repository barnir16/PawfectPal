import { 
  Pet, Task, Vaccine, AgeRestriction, User, UserCreate, LoginResponse, 
  BreedInfoResponse, CatBreedInfoResponse, Service, LocationHistory,
  ServiceType, ServiceStatus, Coordinates, ImageUpload, UploadResponse
} from './types';
import { StorageHelper } from './utils/StorageHelper';
import { getApiUrl } from './config';

const BASE_URL = getApiUrl();

/**
 * Get stored authentication token
 */
const getToken = async (): Promise<string | null> => {
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
const handleApiError = async (response: Response): Promise<never> => {
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

/**
 * Login user with username and password
 */
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

/**
 * Register a new user
 */
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

/**
 * Get all pets for the authenticated user
 */
export async function getPets(): Promise<Pet[]> {
  const res = await fetch(`${BASE_URL}/pets`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Create a new pet
 */
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

/**
 * Update an existing pet
 */
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

/**
 * Delete a pet
 */
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

/**
 * Update pet's GPS location
 */
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

/**
 * Get pet's location history
 */
export async function getPetLocationHistory(petId: number, limit: number = 100): Promise<LocationHistory[]> {
  const res = await fetch(`${BASE_URL}/pets/${petId}/location-history?limit=${limit}`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Calculate distance between two coordinates using Haversine formula
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

  return R * c; // Distance in meters
}

// ===== IMAGE UPLOAD API =====

/**
 * Upload pet image using React Native image picker
 */
export async function uploadPetImage(petId: number, imageUri: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'pet_image.jpg'
  } as any);
  
  const res = await fetch(`${BASE_URL}/upload/pet-image/${petId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getToken()}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Upload task attachment using React Native image picker
 */
export async function uploadTaskAttachment(taskId: number, imageUri: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'task_attachment.jpg'
  } as any);
  
  const res = await fetch(`${BASE_URL}/upload/task-attachment/${taskId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getToken()}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

// ===== SERVICE BOOKING API =====

/**
 * Get all services for the authenticated user
 */
export async function getServices(): Promise<Service[]> {
  const res = await fetch(`${BASE_URL}/services`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Create a new service booking
 */
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

/**
 * Update service status
 */
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

/**
 * Get all tasks for the authenticated user
 */
export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE_URL}/tasks`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Create a new task
 */
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

/**
 * Update an existing task
 */
export async function updateTask(taskId: number, task: Omit<Task, 'id'>): Promise<Task> {
  const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(task),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Delete a task
 */
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

/**
 * Get all vaccines
 */
export async function getVaccines(): Promise<Vaccine[]> {
  const res = await fetch(`${BASE_URL}/vaccines`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Create a new vaccine
 */
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

/**
 * Get all age restrictions
 */
export async function getAgeRestrictions(): Promise<AgeRestriction[]> {
  const res = await fetch(`${BASE_URL}/age_restrictions`, {
    headers: await getAuthHeaders(),
  });
  
  if (!res.ok) {
    await handleApiError(res);
  }
  
  return res.json();
}

/**
 * Create a new age restriction
 */
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

/**
 * Get dog breed information from The Dog API
 */
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

/**
 * Get cat breed information from The Cat API
 */
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

// ===== REACT NATIVE LOCATION SERVICES =====

/**
 * Get current user's location using expo-location
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  try {
    // This requires expo-location to be installed
    // import * as Location from 'expo-location';
    
    // In a real implementation, you would use:
    // const { status } = await Location.requestForegroundPermissionsAsync();
    // if (status !== 'granted') {
    //   throw new Error('Location permission denied');
    // }
    
    // const location = await Location.getCurrentPositionAsync({
    //   accuracy: Location.Accuracy.High,
    // });
    
    // return {
    //   latitude: location.coords.latitude,
    //   longitude: location.coords.longitude,
    //   accuracy: location.coords.accuracy,
    //   altitude: location.coords.altitude || undefined,
    //   speed: location.coords.speed || undefined,
    // };
    
    // Placeholder implementation
    throw new Error('Location services not implemented. Install expo-location and implement location services.');
  } catch (error) {
    throw new Error(`Location error: ${(error as Error).message}`);
  }
}

/**
 * Watch user's location for real-time tracking
 */
export function watchLocation(
  onLocationUpdate: (coordinates: Coordinates) => void,
  onError: (error: Error) => void
): number {
  try {
    // This requires expo-location to be installed
    // import * as Location from 'expo-location';
    
    // In a real implementation, you would use:
    // return Location.watchPositionAsync(
    //   {
    //     accuracy: Location.Accuracy.High,
    //     timeInterval: 5000,
    //     distanceInterval: 10,
    //   },
    //   (location) => {
    //     onLocationUpdate({
    //       latitude: location.coords.latitude,
    //       longitude: location.coords.longitude,
    //       accuracy: location.coords.accuracy,
    //       altitude: location.coords.altitude || undefined,
    //       speed: location.coords.speed || undefined,
    //     });
    //   }
    // );
    
    // Placeholder implementation
    onError(new Error('Location watching not implemented. Install expo-location and implement location services.'));
    return -1;
  } catch (error) {
    onError(new Error(`Location watching error: ${(error as Error).message}`));
    return -1;
  }
}

/**
 * Clear location watching
 */
export function clearLocationWatch(watchId: number): void {
  try {
    // This requires expo-location to be installed
    // import * as Location from 'expo-location';
    
    // In a real implementation, you would use:
    // Location.removeLocationUpdatesAsync(watchId);
    
    if (watchId !== -1) {
      console.log('Location watching cleared');
    }
  } catch (error) {
    console.error('Error clearing location watch:', error);
  }
} 