import type { Coordinates } from '../location';

/**
 * Types of services available in PawfectPal
 */
export type ServiceType =
  | 'walking'
  | 'sitting'
  | 'boarding'
  | 'grooming'
  | 'veterinary'
  | 'training'
  | 'daycare'
  | 'pet_taxi'
  | 'pet_sitting'
  | 'pet_hotel'
  | 'other';

/**
 * Possible statuses for a service
 */
export type ServiceStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

/**
 * Represents a service booking in the PawfectPal application
 */
export interface Service {
  id?: number;
  pet_id: number;
  service_type: ServiceType;
  status: ServiceStatus;
  start_datetime: string; // ISO date string
  end_datetime?: string;  // ISO date string
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
  
  // Media
  before_images: string[];
  after_images: string[];
  
  // Additional details
  service_report?: string;
  rating?: number;
  review?: string;
  
  // Timestamps
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
  cancelled_at?: string; // ISO date string
  completed_at?: string; // ISO date string
}

/**
 * Service provider information
 */
export interface ServiceProvider {
  id: number;
  username: string;
  full_name?: string;
  provider_services: ServiceType[];
  provider_rating?: number;
  provider_bio?: string;
  provider_hourly_rate?: number;
  location?: Coordinates;
  distance_km?: number;
  is_available: boolean;
  languages?: string[];
  experience_years?: number;
  response_time_minutes?: number;
  completed_bookings?: number;
  last_online?: string; // ISO date string
  profile_image?: string;
  verified: boolean;
  reviews_count?: number;
  average_rating?: number;
}

/**
 * Service search filters
 */
export interface ServiceSearchFilters {
  service_type?: ServiceType;
  status?: ServiceStatus;
  date_range?: {
    start: string; // ISO date string
    end: string;   // ISO date string
  };
  price_range?: {
    min: number;
    max: number;
  };
  provider_id?: number;
  pet_id?: number;
  location?: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  sort_by?: 'price' | 'rating' | 'distance' | 'date';
  sort_order?: 'asc' | 'desc';
  min_rating?: number;
  keywords?: string;
  is_recurring?: boolean;
  availability?: {
    days_of_week: number[]; // 0-6 (Sunday-Saturday)
    time_slots: string[]; // e.g., ['09:00-12:00', '14:00-18:00']
  };
}

/**
 * Service analytics data
 */
export interface ServiceAnalytics {
  total_services: number;
  completed_services: number;
  cancelled_services: number;
  total_revenue: number;
  average_rating: number;
  popular_services: Array<{
    service_type: ServiceType;
    count: number;
    revenue: number;
  }>;
  monthly_trends: Array<{
    month: string; // YYYY-MM
    services: number;
    revenue: number;
    average_rating: number;
  }>;
  provider_performance: Array<{
    provider_id: number;
    provider_name: string;
    completed_services: number;
    average_rating: number;
    total_revenue: number;
  }>;
  service_type_distribution: Array<{
    service_type: ServiceType;
    percentage: number;
    count: number;
  }>;
  status_distribution: Array<{
    status: ServiceStatus;
    count: number;
    percentage: number;
  }>;
}
