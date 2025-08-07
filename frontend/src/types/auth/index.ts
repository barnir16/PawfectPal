// Re-export all auth-related types
export * from './auth';

// Export all types with explicit names for better IDE support
export type {
  // User types
  User,
  UserCreate,
  
  // Auth response types
  LoginResponse,
  AuthTokens,
  
  // Preference types
  UserPreferences,
  UserSettings,
  NotificationPreferences,
} from './auth';
