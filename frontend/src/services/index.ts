// Core API utilities - export specific functions to avoid conflicts
export {
  getBaseUrl,
  getToken,
  getAuthHeaders,
  handleApiError,
  apiRequest
} from './api';

// Auth services
export * from './auth/authService';

// Pet services - export specific functions to avoid conflicts
export {
  getPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
  uploadPetImage,
  updatePetLocation,
  getPetLocationHistory,
  getPetLastLocation,
  getPetsNearLocation
} from './pets/petService';

// Task services
export * from './tasks/taskService';

// Vaccine services - export specific functions to avoid conflicts
export {
  getAllVaccinations,
  getPetVaccinations,
  getVaccinationSummary,
  getVaccinationsDueSoon,
  getOverdueVaccinations,
  createVaccination,
  updateVaccination,
  deleteVaccination
} from './vaccines/vaccineService';

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

// Weight services
export * from './weight/weightService';
export * from './weight/weightMonitoringService';

// External API services
export * from './external/externalApiService';

// AI services
export * from './ai/aiService';

// Config services
export * from './config/firebaseConfigService';

// Notification services
export * from './notifications/notificationService';

// Reference services
export * from './references/referencesService';
