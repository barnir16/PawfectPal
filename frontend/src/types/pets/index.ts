// Re-export all pet-related types
export * from './pet';
export * from './vaccine';

// Export all types with explicit names for better IDE support
export type {
  // Pet types
  Pet,
  PetType,
  PetGender,
  PetSize,
  ActivityLevel,
  HealthStatus,
  
  // Medical records
  MedicalRecord,
  
  // Activity tracking
  PetActivity,
  WeightRecord,
  FeedingSchedule,
  
  // Search and filters
  PetSearchFilters,
  PetStats,
} from './pet';
