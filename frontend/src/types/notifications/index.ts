// Re-export all notification-related types
export * from './notification';

// Export all types with explicit names for better IDE support
export type {
  // Core notification types
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  
  // Notification preferences
  NotificationPreferences,
  
  // Templates and events
  NotificationTemplate,
  NotificationEvent,
  
  // Subscriptions and delivery
  NotificationSubscription,
  NotificationLog,
  
  // Batch operations
  NotificationBatch,
} from './notification';
