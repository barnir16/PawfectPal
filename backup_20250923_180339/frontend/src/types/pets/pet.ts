// src/types/pets/pet.ts

import type { Coordinates } from '../common';

/**
 * Types of pets supported in the application
 */
export type PetType = 'dog' | 'cat' | 'bird' | 'fish' | 'reptile' | 'small_animal' | 'other';

/**
 * Gender of the pet
 */
export type PetGender = 'male' | 'female' | 'other' | 'unknown';

/**
 * Size category of the pet
 */
export type PetSize = 'xs' | 'small' | 'medium' | 'large' | 'xl';

/**
 * Activity level of the pet
 */
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'very_high';

/**
 * Pet health status
 */
export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

/**
 * Represents a pet in the PawfectPal application
 * Updated to match backend database schema
 */
export interface Pet {
  // Basic information
  id?: number;
  name: string;
  type?: PetType; // Frontend field
  breedType?: string; // Backend field - maps to 'type'
  breed: string;
  
  // Physical attributes
  age?: number;
  ageUnit?: 'days' | 'weeks' | 'months' | 'years';
  birthDate?: string; // ISO date string - frontend field
  birth_date?: string; // Backend field
  gender: PetGender;
  color?: string;
  size?: PetSize;
  weightKg?: number; // Frontend field
  weight_kg?: number; // Backend field
  weightUnit: 'kg' | 'lb';
  
  // Health information
  isNeutered: boolean;
  isVaccinated: boolean;
  isMicrochipped: boolean;
  healthStatus?: HealthStatus;
  healthIssues: string[]; // Simplified to just array
  behaviorIssues: string[]; // Simplified to just array
  allergies?: string[];
  medications?: string[];
  
  // Medical records
  lastVetVisit?: string; // Frontend field
  last_vet_visit?: string; // Backend field
  nextVetVisit?: string; // Frontend field
  next_vet_visit?: string; // Backend field
  vetName?: string;
  vet_name?: string;
  vetPhone?: string;
  vet_phone?: string;
  vetAddress?: string;
  vet_address?: string;
  medicalNotes?: string;
  medical_notes?: string;
  
  // Tracking and location
  isTrackingEnabled: boolean;
  is_tracking_enabled?: boolean;
  lastLocation?: Coordinates;
  lastKnownLatitude?: number;
  last_known_latitude?: number;
  lastKnownLongitude?: number;
  last_known_longitude?: number;
  lastSeen?: string; // ISO datetime string
  last_location_update?: string;
  isLost: boolean;
  is_lost?: boolean;
  
  // Additional information
  description?: string;
  notes?: string;
  imageUrl?: string; // Frontend field
  photo_uri?: string; // Backend field
  microchipNumber?: string;
  microchip_number?: string;
  tattooNumber?: string;
  
  // Ownership and metadata
  ownerId: number;
  user_id?: number; // Backend field
  isActive: boolean;
  is_active?: boolean;
  isBirthdayGiven: boolean;
  is_birthday_given?: boolean;
  activityLevel?: ActivityLevel;
  favoriteActivities?: string[];
  
  // Timestamps
  createdAt?: string; // ISO datetime string
  created_at?: string; // Backend field
  updatedAt?: string; // ISO datetime string
  updated_at?: string; // Backend field
}

/**
 * Represents a pet's medical record
 */
export interface MedicalRecord {
  id?: number;
  petId: number;
  date: string; // ISO date string
  type: 'vaccination' | 'checkup' | 'surgery' | 'illness' | 'injury' | 'medication' | 'other';
  title: string;
  description?: string;
  veterinarian?: string;
  clinic?: string;
  notes?: string;
  attachments: string[]; // URLs to documents/images
  followUpDate?: string; // ISO date string
  isCompleted: boolean;
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

/**
 * Represents a pet's daily activity
 */
export interface PetActivity {
  id?: number;
  petId: number;
  date: string; // ISO date string
  activityType: 'walk' | 'feeding' | 'medication' | 'grooming' | 'play' | 'training' | 'other';
  durationMinutes?: number;
  distanceMeters?: number;
  caloriesBurned?: number;
  notes?: string;
  location?: string;
  coordinates?: Coordinates;
  weather?: {
    temperatureC?: number;
    condition?: string;
    humidity?: number;
  };
  createdAt?: string; // ISO datetime string
}

/**
 * Represents a pet's weight record
 */
export interface WeightRecord {
  id?: number;
  petId: number;
  date: string; // ISO date string
  weight: number; // in kg
  weightUnit: 'kg' | 'lb';
  notes?: string;
  measuredBy?: string;
  createdAt?: string; // ISO datetime string
}

/**
 * Represents a pet's feeding schedule
 */
export interface FeedingSchedule {
  id?: number;
  petId: number;
  foodType: string;
  foodBrand?: string;
  portionSize: number;
  portionUnit: 'g' | 'ml' | 'cups' | 'pieces';
  timesPerDay: number;
  schedule: string[]; // e.g., ['08:00', '13:00', '18:00']
  notes?: string;
  isActive: boolean;
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

/**
 * Represents search filters for pets
 */
export interface PetSearchFilters {
  name?: string;
  type?: PetType | PetType[];
  breed?: string | string[];
  gender?: PetGender | PetGender[];
  ageRange?: { min?: number; max?: number };
  size?: PetSize | PetSize[];
  isNeutered?: boolean;
  isVaccinated?: boolean;
  isMicrochipped?: boolean;
  healthStatus?: HealthStatus | HealthStatus[];
  ownerId?: number;
  isActive?: boolean;
  isLost?: boolean;
  searchQuery?: string;
  sortBy?: 'name' | 'age' | 'createdAt' | 'lastVetVisit';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Represents statistics about a pet's activities
 */
export interface PetStats {
  petId: number;
  totalActivities: number;
  activitiesByType: Record<string, number>;
  totalDistance: number; // in meters
  totalDuration: number; // in minutes
  averageDailyActivities: number;
  weeklyTrend: Array<{
    week: string; // YYYY-WW format
    count: number;
    distance: number;
    duration: number;
  }>;
  favoriteActivities: string[];
  lastUpdated: string; // ISO datetime string
}