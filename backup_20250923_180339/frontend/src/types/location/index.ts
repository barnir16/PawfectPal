// Re-export all location-related types
export * from './location';

// Export all types with explicit names for better IDE support
export type {
  // Core location types
  Coordinates,
  
  // Location history and tracking
  LocationHistory,
  TrackingSession,
  
  // Geofencing
  Geofence,
  GeofenceEvent,
  
  // Alerts and monitoring
  LocationAlert,
  
  // Filters and queries
  LocationHistoryFilter,
} from './location';
