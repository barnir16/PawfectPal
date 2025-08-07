/**
 * Common types used across multiple features
 */

/**
 * Represents geographical coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

/**
 * Represents a generic key-value pair
 */
export interface KeyValuePair<T = any> {
  key: string;
  value: T;
}

/**
 * Represents a generic select option
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  [key: string]: any;
}

/**
 * Represents a paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Represents a sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Represents a sort configuration
 */
export interface SortConfig<T> {
  field: keyof T | string;
  direction: SortDirection;
}

/**
 * Represents a filter configuration
 */
export interface FilterConfig<T> {
  field: keyof T | string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'notIn' | 'isNull' | 'isNotNull';
  value: any;
}

/**
 * Represents a query configuration
 */
export interface QueryConfig<T> {
  page?: number;
  pageSize?: number;
  sort?: SortConfig<T>[];
  filters?: FilterConfig<T>[];
  search?: string;
  includes?: string[];
}

/**
 * Represents an API error response
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

/**
 * Represents an API success response
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Represents a response from a file upload operation
 */
export interface UploadResponse {
  /**
   * The unique identifier for the uploaded file
   */
  id: string;
  
  /**
   * The original filename
   */
  filename: string;
  
  /**
   * The MIME type of the file
   */
  mimetype: string;
  
  /**
   * The size of the file in bytes
   */
  size: number;
  
  /**
   * The URL where the file can be accessed
   */
  url: string;
  
  /**
   * A thumbnail URL for the file (if applicable)
   */
  thumbnailUrl?: string;
  
  /**
   * The width of the uploaded image (if applicable)
   */
  width?: number;
  
  /**
   * The height of the uploaded image (if applicable)
   */
  height?: number;
  
  /**
   * Additional metadata about the upload
   */
  metadata?: Record<string, any>;
  
  /**
   * The date and time when the file was uploaded
   */
  uploadedAt: string; // ISO date string
}

/**
 * Represents a file upload
 */
export interface FileUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a date range
 */
export interface DateRange {
  start: string | Date;
  end: string | Date;
}

/**
 * Represents a time range
 */
export interface TimeRange {
  start: string; // HH:MM
  end: string;   // HH:MM
}

/**
 * Represents a day of the week
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Represents a month
 */
export type Month = 'january' | 'february' | 'march' | 'april' | 'may' | 'june' | 'july' | 'august' | 'september' | 'october' | 'november' | 'december';

/**
 * Represents a season
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * Represents a timezone
 */
export interface Timezone {
  value: string;
  label: string;
  offset: string;
  abbrev: string;
  altName: string;
}

/**
 * Represents a currency
 */
export interface Currency {
  code: string; // ISO 4217 currency code
  name: string;
  symbol: string;
  decimal_digits: number;
  rounding: number;
  name_plural: string;
  symbol_native: string;
  decimal_separator: string;
  thousands_separator: string;
}

/**
 * Represents a language
 */
export interface Language {
  code: string; // ISO 639-1 language code
  name: string;
  native_name: string;
  rtl: boolean; // Right-to-left
}

/**
 * Represents a country
 */
export interface Country {
  code: string; // ISO 3166-1 alpha-2 country code
  name: string;
  native_name: string;
  phone_code: string;
  currency: string;
  languages: string[];
  emoji: string;
  emojiU: string;
}

/**
 * Represents a generic dictionary/map
 */
export type Dictionary<T = any> = Record<string, T>;

/**
 * Represents a generic callback function
 */
export type Callback<T = void> = (arg: T) => void;

/**
 * Represents a function that can be used to unsubscribe/clean up
 */
export type Unsubscribe = () => void;

/**
 * Represents a function that can be used to refresh data
 */
export type RefreshFunction = () => Promise<void>;

/**
 * Represents a function that can be used to handle errors
 */
export type ErrorHandler = (error: Error | unknown) => void;
