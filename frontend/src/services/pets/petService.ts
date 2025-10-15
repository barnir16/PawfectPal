import { apiRequest } from '../api';
import type { Pet, PetType, PetGender } from '../../types/pets';
import type { LocationHistory } from '../../types/location';
import type { UploadResponse } from '../../types/common';

/**
 * Backend API interface that matches the backend PetCreate schema
 */
export interface BackendPetCreate {
  name: string;
  breed_type: string;  // Maps to frontend 'type'
  breed: string;
  birth_date?: string; // ISO date string
  age?: number;
  is_birthday_given?: boolean;
  weight_kg?: number;
  weight_unit?: string;
  gender?: string;
  color?: string;
  microchip_number?: string;
  is_neutered?: boolean;
  is_vaccinated?: boolean;
  is_microchipped?: boolean;
  health_issues?: string; // Comma-separated string
  behavior_issues?: string; // Comma-separated string
  notes?: string;
  photo_uri?: string;
  last_known_latitude?: number;
  last_known_longitude?: number;
  last_location_update?: string;
  is_tracking_enabled?: boolean;
}

/**
 * Transform frontend Pet data to backend format
 */
export const transformPetToBackend = (pet: Omit<Pet, 'id'>): BackendPetCreate => {
  return {
    name: pet.name,
    breed_type: pet.type || 'other',
    breed: pet.breed,
    birth_date: pet.birthDate ? new Date(pet.birthDate).toISOString().split('T')[0] : undefined,
    age: pet.age,
    is_birthday_given: pet.isBirthdayGiven || false,
    weight_kg: pet.weightKg,
    weight_unit: pet.weightUnit || 'kg',
    gender: pet.gender || 'unknown',
    color: pet.color,
    microchip_number: pet.microchipNumber,
    is_neutered: pet.isNeutered || false,
    is_vaccinated: pet.isVaccinated || false,
    is_microchipped: pet.isMicrochipped || false,
    health_issues: Array.isArray(pet.healthIssues) ? pet.healthIssues.join(', ') : '',
    behavior_issues: Array.isArray(pet.behaviorIssues) ? pet.behaviorIssues.join(', ') : '',
    notes: pet.notes,
    photo_uri: pet.imageUrl,
    last_known_latitude: pet.lastLocation?.latitude,
    last_known_longitude: pet.lastLocation?.longitude,
    last_location_update: pet.lastSeen,
    is_tracking_enabled: pet.isTrackingEnabled || false,
  };
};

/**
 * Transform backend pet data to frontend Pet format
 */
const transformPetFromBackend = (backendPet: any): Pet => {
  console.log('🔄 Transforming pet from backend:', backendPet);
  
  const transformedPet = {
    // Basic information
    id: backendPet.id,
    name: backendPet.name,
    type: (backendPet.breed_type || backendPet.type || 'other') as PetType,
    breed: backendPet.breed || 'Unknown',
    
    // Physical attributes
    age: backendPet.age,
    birthDate: backendPet.birth_date || backendPet.birthDate,
    gender: (backendPet.gender || 'unknown') as PetGender,
    color: backendPet.color,
    weightKg: backendPet.weight_kg || backendPet.weightKg,
    weightUnit: (backendPet.weight_unit || backendPet.weightUnit || 'kg') as 'kg' | 'lb',
    
    // Health information
    isNeutered: Boolean(backendPet.is_neutered || backendPet.isNeutered),
    isVaccinated: Boolean(backendPet.is_vaccinated || backendPet.isVaccinated),
    isMicrochipped: Boolean(backendPet.is_microchipped || backendPet.isMicrochipped),
    healthIssues: Array.isArray(backendPet.health_issues) 
      ? backendPet.health_issues 
      : (backendPet.health_issues ? backendPet.health_issues.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    behaviorIssues: Array.isArray(backendPet.behavior_issues) 
      ? backendPet.behavior_issues 
      : (backendPet.behavior_issues ? backendPet.behavior_issues.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    microchipNumber: backendPet.microchip_number || backendPet.microchipNumber,
    
    // Medical records
    lastVetVisit: backendPet.last_vet_visit || backendPet.lastVetVisit,
    nextVetVisit: backendPet.next_vet_visit || backendPet.nextVetVisit,
    vetName: backendPet.vet_name || backendPet.vetName,
    vetPhone: backendPet.vet_phone || backendPet.vetPhone,
    vetAddress: backendPet.vet_address || backendPet.vetAddress,
    medicalNotes: backendPet.medical_notes || backendPet.medicalNotes,
    
    // Media and notes
    imageUrl: backendPet.photo_uri || backendPet.imageUrl,
    notes: backendPet.notes,
    
    // Tracking and location
    isTrackingEnabled: Boolean(backendPet.is_tracking_enabled || backendPet.isTrackingEnabled),
    lastLocation: backendPet.last_known_latitude && backendPet.last_known_longitude ? {
      latitude: backendPet.last_known_latitude,
      longitude: backendPet.last_known_longitude
    } : undefined,
    lastSeen: backendPet.last_location_update || backendPet.lastSeen,
    isLost: Boolean(backendPet.is_lost || backendPet.isLost),
    
    // Metadata
    isActive: Boolean(backendPet.is_active !== undefined ? backendPet.is_active : true),
    isBirthdayGiven: Boolean(backendPet.is_birthday_given || backendPet.isBirthdayGiven),
    ownerId: backendPet.user_id || backendPet.ownerId || 1,
    createdAt: backendPet.created_at || backendPet.createdAt,
    updatedAt: backendPet.updated_at || backendPet.updatedAt,
  };
  
  console.log('✅ Transformed pet:', transformedPet);
  return transformedPet;
};

/**
 * Get all pets for the current user
 */
export const getPets = async (): Promise<Pet[]> => {
  const backendPets = await apiRequest<any[]>('/pets/');
  return backendPets.map(transformPetFromBackend);
};

/**
 * Get a single pet by ID
 */
export const getPet = async (petId: number): Promise<Pet> => {
  const backendPet = await apiRequest<any>(`/pets/${petId}/`);
  return transformPetFromBackend(backendPet);
};

/**
 * Create a new pet
 */
export const createPet = async (pet: Omit<Pet, 'id'>): Promise<Pet> => {
  const backendPet = transformPetToBackend(pet);
  const createdPet = await apiRequest<any>('/pets/', {
    method: 'POST',
    body: JSON.stringify(backendPet)
  });
  return transformPetFromBackend(createdPet);
};

/**
 * Update an existing pet
 */
export const updatePet = async (petId: number, pet: Omit<Pet, 'id'>): Promise<Pet> => {
  const backendPet = transformPetToBackend(pet);
  const updatedPet = await apiRequest<any>(`/pets/${petId}/`, {
    method: 'PUT',
    body: JSON.stringify(backendPet)
  });
  return transformPetFromBackend(updatedPet);
};

/**
 * Partially update a pet
 */
export const patchPet = async (petId: number, updates: Partial<Pet>): Promise<Pet> => {
  return apiRequest<Pet>(`/pets/${petId}/`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
};

/**
 * Delete a pet
 */
export const deletePet = async (petId: number): Promise<void> => {
  return apiRequest(`/pets/${petId}/`, {
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
  return apiRequest<LocationHistory>(`/pets/${petId}/location/`, {
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
  return apiRequest<LocationHistory[]>(`/pets/${petId}/location/?limit=${limit}`);
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
  
  return apiRequest<UploadResponse>(`/image_upload/pet-image/${petId}/`, {
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
    `/pets/nearby/?lat=${latitude}&lng=${longitude}&radius=${radius}`
  );
};
