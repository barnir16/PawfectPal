/**
 * Represents geographic coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;  // in meters
  altitude?: number | null;  // in meters
  altitudeAccuracy?: number | null;  // in meters
  heading?: number | null;  // in degrees (0-360)
  speed?: number | null;  // in meters per second
  timestamp?: number;  // Unix timestamp in milliseconds
}

/**
 * Represents a location history entry
 */
export interface LocationHistory {
  id?: number;
  pet_id: number;
  latitude: number;
  longitude: number;
  timestamp: string;  // ISO date string
  accuracy?: number;
  speed?: number | null;
  altitude?: number | null;
  altitude_accuracy?: number | null;
  heading?: number | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_home?: boolean;
  is_safe_zone?: boolean;
  battery_level?: number | null;
  is_charging?: boolean | null;
  provider?: 'gps' | 'network' | 'fused' | 'passive';
  is_mock?: boolean;
  created_at?: string;  // ISO date string
}

/**
 * Represents a tracking session for a pet
 */
export interface TrackingSession {
  id: string;
  pet_id: number;
  start_time: string;  // ISO date string
  end_time?: string;   // ISO date string
  start_location: Coordinates;
  end_location?: Coordinates;
  distance_meters: number;
  duration_seconds: number;
  average_speed_mps?: number;
  max_speed_mps?: number;
  path: Coordinates[];
  is_active: boolean;
  battery_usage_percent?: number;
  weather_conditions?: {
    temperature_c?: number;
    weather_code?: number;
    wind_speed_kph?: number;
    precipitation_mm?: number;
    humidity_percent?: number;
  };
  calories_burned?: number;
  notes?: string;
  created_at?: string;  // ISO date string
  updated_at?: string;  // ISO date string
}

/**
 * Represents a geofence (safe zone)
 */
export interface Geofence {
  id: string;
  pet_id: number;
  name: string;
  description?: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;  // in meters
  is_active: boolean;
  notify_on_entry: boolean;
  notify_on_exit: boolean;
  created_at: string;  // ISO date string
  updated_at: string;  // ISO date string
}

/**
 * Represents a geofence event
 */
export interface GeofenceEvent {
  id: string;
  geofence_id: string;
  pet_id: number;
  event_type: 'enter' | 'exit';
  location: Coordinates;
  timestamp: string;  // ISO date string
  is_notified: boolean;
  notification_sent_at?: string;  // ISO date string
  created_at: string;  // ISO date string
}

/**
 * Represents a location-based alert
 */
export interface LocationAlert {
  id: string;
  pet_id: number;
  type: 'proximity' | 'geofence' | 'speed' | 'battery';
  title: string;
  message: string;
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;  // ISO date string
  read_at?: string;    // ISO date string
}

/**
 * Represents a location history filter
 */
export interface LocationHistoryFilter {
  start_date?: string;  // ISO date string
  end_date?: string;    // ISO date string
  min_accuracy?: number;
  max_speed?: number;   // in m/s
  min_speed?: number;   // in m/s
  bounding_box?: {
    min_latitude: number;
    min_longitude: number;
    max_latitude: number;
    max_longitude: number;
  };
  sort_by?: 'timestamp' | 'speed' | 'altitude';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
