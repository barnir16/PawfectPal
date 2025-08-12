import { apiRequest } from '../api';
import type { Pet } from '../../types/pets';
import type { LocationHistory, Coordinates } from '../../types/location';
import type { UploadResponse } from '../../types/common';

/**
 * Get all pets for the current user
 */
export const getPets = async (): Promise<Pet[]> => {
  return apiRequest<Pet[]>('/pets');
};

/**
 * Get a single pet by ID
 */
export const getPet = async (petId: number): Promise<Pet> => {
  return apiRequest<Pet>(`/pets/${petId}`);
};

/**
 * Create a new pet
 */
export const createPet = async (pet: Omit<Pet, 'id'>): Promise<Pet> => {
  return apiRequest<Pet>('/pets', {
    method: 'POST',
    body: JSON.stringify(pet)
  });
};

/**
 * Update an existing pet
 */
export const updatePet = async (petId: number, pet: Omit<Pet, 'id'>): Promise<Pet> => {
  return apiRequest<Pet>(`/pets/${petId}`, {
    method: 'PUT',
    body: JSON.stringify(pet)
  });
};

/**
 * Partially update a pet
 */
export const patchPet = async (petId: number, updates: Partial<Pet>): Promise<Pet> => {
  return apiRequest<Pet>(`/pets/${petId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
};

/**
 * Delete a pet
 */
export const deletePet = async (petId: number): Promise<void> => {
  return apiRequest(`/pets/${petId}`, {
    method: 'DELETE'
  });
};

/**
 * Update a pet's location
 */
export const updatePetLocation = async (
  petId: number, 
  location: Omit<LocationHistory, 'id'>
): Promise<LocationHistory> => {
  return apiRequest<LocationHistory>(`/pets/${petId}/location`, {
    method: 'POST',
    body: JSON.stringify(location)
  });
};

/**
 * Get location history for a pet
 */
export const getPetLocationHistory = async (
  petId: number, 
  limit: number = 100
): Promise<LocationHistory[]> => {
  return apiRequest<LocationHistory[]>(`/pets/${petId}/location?limit=${limit}`);
};

/**
 * Upload a pet image
 */
export const uploadPetImage = async (
  petId: number, 
  file: File
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiRequest<UploadResponse>(`/pets/${petId}/image`, {
    method: 'POST',
    body: formData
  });
};

/**
 * Calculate distance between two coordinates in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Get the last known location of a pet
 */
export const getPetLastLocation = async (petId: number): Promise<LocationHistory | null> => {
  try {
    const history = await getPetLocationHistory(petId, 1);
    return history.length > 0 ? history[0] : null;
  } catch (error) {
    console.error('Error fetching pet location:', error);
    return null;
  }
};

/**
 * Get pets near a specific location
 */
export const getPetsNearLocation = async (
  latitude: number,
  longitude: number,
  radius: number = 1000 // in meters
): Promise<Pet[]> => {
  return apiRequest<Pet[]>(
    `/pets/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
  );
};
