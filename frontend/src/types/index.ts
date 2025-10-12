// Re-export all types from feature modules
export * from './auth';
export * from './external';
export * from './location';
export * from './notifications';
export * from './pets';
export * from './services';
export * from './tasks';
export * from './vaccines';

// Common types that don't belong to a specific feature
export * from './common';

// Export common types with explicit names for better IDE support
export type {
  // Common types
  Coordinates,
  KeyValuePair,
  SelectOption,
  PaginatedResponse,
  SortDirection,
  SortConfig,
  FilterConfig,
  QueryConfig,
  ApiError,
  ApiResponse,
  UploadResponse,
  FileUpload,
  DateRange,
  TimeRange,
  DayOfWeek,
  Month,
  Season,
  Timezone,
  Currency,
  Language,
  Country,
  Dictionary,
  Callback,
  Unsubscribe,
  RefreshFunction,
  ErrorHandler,
} from './common';

// Re-export specific types with explicit paths to resolve conflicts
export type { NotificationPreferences } from './auth';
export type { AgeRestriction, Vaccine } from './pets';
