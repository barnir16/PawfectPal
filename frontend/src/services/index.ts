// Core API utilities
export * from './api';

// Auth services
export * from './auth/authService';

// Pet services
export * from './pets/petService';

// Task services
export * from './tasks/taskService';

// Vaccine services
export * from './vaccines/vaccineService';

// Service booking services
export * from './services/serviceService';

// Location services - export specific functions to avoid conflicts
export { 
  getCurrentLocation,
  watchLocation,
  clearLocationWatch
} from './location/locationService';

// Medical services
export * from './medical/medicalRecordService';
export * from './medical/vaccinationService';

// External API services
export * from './external/externalApiService';
