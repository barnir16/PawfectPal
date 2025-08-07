import type { Pet } from '../../types/pets';
import type { LocationHistory } from '../../types/location';
import type { UploadResponse } from '../../types/common';
import { BASE_URL, getToken, handleApiError } from './../../api';
import { apiRequest } from '../api';
/**
 * Get all pets for the current user
 */
export const getPets = async (): Promise<Pet[]> => {
  return apiRequest<Pet[]>('/pets');
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
  formData.append('image', file);
  
  const token = await getToken();
  const response = await fetch(`${BASE_URL}/pets/${petId}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    return handleApiError(response);
  }

  return response.json();
};
