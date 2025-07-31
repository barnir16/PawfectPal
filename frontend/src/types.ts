/**
 * Core pet care management types for PawfectPal
 */

// Service types and status enums
export enum ServiceType {
  WALKING = "walking",
  SITTING = "sitting", 
  BOARDING = "boarding",
  GROOMING = "grooming",
  VETERINARY = "veterinary"
}

export enum ServiceStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

// Core entity interfaces
export interface Pet {
  id?: number;
  name: string;
  breedType: string;
  breed: string;
  birthDate?: string; // ISO date string
  age?: number;
  isBirthdayGiven: boolean;
  weightKg?: number;
  photoUri?: string; // Image URL/path
  healthIssues: string[];
  behaviorIssues: string[];
  
  // GPS tracking fields
  lastKnownLatitude?: number;
  lastKnownLongitude?: number;
  lastLocationUpdate?: string; // ISO datetime string
  isTrackingEnabled: boolean;
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  dateTime: string; // ISO datetime string
  repeatInterval?: number;
  repeatUnit?: string;
  petIds: number[];
  attachments: string[]; // Image URLs
}

export interface Service {
  id?: number;
  pet_id: number;
  service_type: ServiceType;
  status: ServiceStatus;
  start_datetime: string; // ISO datetime string
  end_datetime?: string; // ISO datetime string
  duration_hours?: number;
  price?: number;
  currency: string;
  
  // Location information
  pickup_address?: string;
  dropoff_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  
  // Provider information
  provider_id?: number;
  provider_notes?: string;
  customer_notes?: string;
  
  // Images and documentation
  before_images: string[];
  after_images: string[];
  service_report?: string;
}

export interface LocationHistory {
  id?: number;
  pet_id: number;
  latitude: number;
  longitude: number;
  timestamp: string; // ISO datetime string
  accuracy?: number; // GPS accuracy in meters
  speed?: number; // Speed in m/s
  altitude?: number; // Altitude in meters
}

// Vaccine and health management
export interface AgeRestriction {
  minWeeks?: number;
  maxYears?: number;
}

export interface Vaccine {
  name: string;
  frequency: string;
  firstDoseAge?: string;
  kittenSchedule?: string[];
  puppySchedule?: string[];
  description: string;
  sideEffects?: string[];
  ageRestriction?: AgeRestriction;
  lastUpdated: string;
  commonTreatments?: string[];
}

// User management
export interface User {
  id: number;
  username: string;
  is_active: boolean;
  email?: string;
  phone?: string;
  full_name?: string;
  profile_image?: string;
  is_provider: boolean;
  provider_services?: string[];
  provider_rating?: number;
  provider_bio?: string;
  provider_hourly_rate?: number;
}

export interface UserCreate {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// External API responses
export interface BreedInfoResponse {
  id: number;
  name: string;
  lifeSpan?: string;
  temperament?: string;
  weight?: Weight;
  bredFor?: string;
  breedGroup?: string;
}

export interface CatBreedInfoResponse {
  id: number;
  name: string;
  lifeSpan?: string;
  temperament?: string;
  weight?: Weight;
  bredFor?: string;
  breedGroup?: string;
}

export interface Weight {
  metric?: string;
}

// AI Assistant
export interface ChatMessage {
  text: string;
  isUser: boolean;
}

// Settings and configuration
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface AppSettings {
  language: string;
  darkMode: boolean;
  notifications: NotificationSettings;
}

// GPS and location types
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
}

export interface LocationUpdate {
  pet_id: number;
  coordinates: Coordinates;
  timestamp: string; // ISO datetime string
}

// Image upload types
export interface ImageUpload {
  file: File;
  type: 'pet' | 'task' | 'service';
  entity_id: number;
}

export interface UploadResponse {
  message: string;
  file_path: string;
}

// Service provider types
export interface ServiceProvider {
  id: number;
  username: string;
  full_name?: string;
  provider_services: ServiceType[];
  provider_rating?: number;
  provider_bio?: string;
  provider_hourly_rate?: number;
  location?: Coordinates;
}

// Search and filter types
export interface PetSearchFilters {
  breedType?: string;
  ageRange?: { min: number; max: number };
  hasTracking?: boolean;
}

export interface ServiceSearchFilters {
  service_type?: ServiceType;
  status?: ServiceStatus;
  dateRange?: { start: string; end: string };
  priceRange?: { min: number; max: number };
}

// API response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  detail: string;
  status_code: number;
  timestamp: string;
}

// Real-time tracking types
export interface TrackingSession {
  id: string;
  pet_id: number;
  start_time: string;
  end_time?: string;
  locations: LocationHistory[];
  total_distance?: number; // in meters
  average_speed?: number; // in m/s
}

// Notification types
export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
}

// Analytics and reporting types
export interface PetActivity {
  pet_id: number;
  date: string;
  tasks_completed: number;
  services_booked: number;
  distance_traveled?: number;
  time_spent_outside?: number; // in minutes
}

export interface ServiceAnalytics {
  total_services: number;
  completed_services: number;
  total_revenue: number;
  average_rating: number;
  popular_services: ServiceType[];
  monthly_trends: Array<{
    month: string;
    services: number;
    revenue: number;
  }>;
} 