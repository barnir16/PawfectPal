
/**
 * Represents a notification channel
 */
export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';

/**
 * Represents the priority of a notification
 */
export type NotificationPriority = 'low' | 'normal' | 'high';

/**
 * Represents the status of a notification
 */
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Represents a notification in the system
 */
export interface Notification {
  id: string;
  user_id: number;
  title: string;
  message: string;
  data?: Record<string, any>;
  
  // Type and category
  type: string;
  category?: string;
  
  // Status and tracking
  status: NotificationStatus;
  priority: NotificationPriority;
  is_read: boolean;
  is_archived: boolean;
  
  // Delivery information
  channels: NotificationChannel[];
  sent_at?: string;  // ISO date string
  delivered_at?: string;  // ISO date string
  read_at?: string;  // ISO date string
  
  // Metadata
  created_at: string;  // ISO date string
  updated_at: string;  // ISO date string
  expires_at?: string;  // ISO date string
  
  // Related entities
  related_entity_type?: string;  // e.g., 'task', 'service', 'pet'
  related_entity_id?: string;
  
  // User who triggered the notification (if applicable)
  triggered_by_user_id?: number;
  
  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * Represents a notification template
 */
export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  
  // Content
  subject: string;
  message: string;
  html_template?: string;
  sms_template?: string;
  push_template?: string;
  
  // Default settings
  default_channels: NotificationChannel[];
  default_priority: NotificationPriority;
  is_active: boolean;
  
  // Variables that can be used in templates
  variables: string[];
  
  // Metadata
  created_at: string;  // ISO date string
  updated_at: string;  // ISO date string
  created_by: number;
  updated_by: number;
}

/**
 * Represents user notification preferences
 */
export interface NotificationPreferences {
  user_id: number;
  
  // Channel preferences
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  
  // Notification type preferences
  preferences: {
    [key: string]: {
      email: boolean;
      push: boolean;
      sms: boolean;
      in_app: boolean;
    };
  };
  
  // Quiet hours
  quiet_hours: {
    enabled: boolean;
    start_time: string;  // HH:MM
    end_time: string;    // HH:MM
    timezone: string;
  };
  
  // Do not disturb settings
  do_not_disturb: {
    enabled: boolean;
    start_time?: string;  // ISO date string
    end_time?: string;    // ISO date string
  };
  
  // Notification grouping
  group_notifications: boolean;
  
  // Sound settings
  sound_enabled: boolean;
  sound_volume: number;  // 0-100
  
  // Vibration settings
  vibration_enabled: boolean;
  
  // Metadata
  updated_at: string;  // ISO date string
}

/**
 * Represents a notification subscription
 */
export interface NotificationSubscription {
  id: string;
  user_id: number;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expiration_time?: number;
  user_agent?: string;
  ip_address?: string;
  created_at: string;  // ISO date string
  updated_at: string;  // ISO date string
}

/**
 * Represents a notification event
 */
export interface NotificationEvent {
  id: string;
  name: string;
  description?: string;
  default_channels: NotificationChannel[];
  default_priority: NotificationPriority;
  template_id: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;  // ISO date string
  updated_at: string;  // ISO date string
}

/**
 * Represents a notification log entry
 */
export interface NotificationLog {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;  // ISO date string
  updated_at: string;  // ISO date string
}

/**
 * Represents a batch of notifications
 */
export interface NotificationBatch {
  id: string;
  name: string;
  description?: string;
  template_id: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduled_at?: string;  // ISO date string
  started_at?: string;    // ISO date string
  completed_at?: string;  // ISO date string
  total_recipients: number;
  success_count: number;
  failure_count: number;
  created_by: number;
  created_at: string;     // ISO date string
  updated_at: string;     // ISO date string
  metadata?: Record<string, any>;
}
