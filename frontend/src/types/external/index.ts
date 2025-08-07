// Re-export all external API-related types
export * from './external';

// Export all types with explicit names for better IDE support
export type {
  // Breed information
  BreedInfoResponse,
  CatBreedInfoResponse,
  
  // Error handling
  ExternalApiError,
} from './external';
