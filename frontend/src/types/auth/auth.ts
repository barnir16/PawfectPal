/**
 * Represents a user in the PawfectPal application
 */
export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  profile_image?: string;
  is_active: boolean;
  is_provider: boolean;
  provider_services?: string[];
  provider_rating?: number;
  provider_bio?: string;
  provider_hourly_rate?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  date_joined: string; // ISO date string
  last_login?: string; // ISO date string
  preferences?: UserPreferences;
  settings?: UserSettings;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  timezone?: string;
  language?: string;
  notification_preferences?: NotificationPreferences;
}

/**
 * Data required to create a new user
 */
export interface UserCreate {
  username: string;
  email?: string;
  password: string;
  full_name?: string;
  phone?: string;
  is_provider?: boolean;
  provider_services?: string[];
  provider_bio?: string;
  provider_hourly_rate?: number;
}

/**
 * Response from login endpoint
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

/**
 * Authentication tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing_emails: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'friends' | 'private';
    show_email: boolean;
    show_phone: boolean;
  };
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
}

/**
 * User settings
 */
export interface UserSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  two_factor_auth: boolean;
  security_alerts: boolean;
  activity_status: 'online' | 'away' | 'invisible';
  message_privacy: 'everyone' | 'friends' | 'none';
  profile_visibility: 'public' | 'friends' | 'private';
  show_online_status: boolean;
  show_last_seen: boolean;
  show_profile_photo: 'everyone' | 'friends' | 'none';
  show_email: 'everyone' | 'friends' | 'none';
  show_phone: 'everyone' | 'friends' | 'none';
  show_birthday: boolean;
  show_location: boolean;
  sync_contacts: boolean;
  auto_save_media: boolean;
  download_media_quality: 'low' | 'medium' | 'high';
  data_saver_mode: boolean;
  clear_search_history: boolean;
  delete_account_after: '30d' | '90d' | '1y' | 'never';
  export_data: boolean;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  messages: {
    email: boolean;
    push: boolean;
    sound: boolean;
    preview: boolean;
  };
  reminders: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  bookings: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  promotions: {
    email: boolean;
    push: boolean;
  };
  security: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  marketing: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  do_not_disturb: {
    enabled: boolean;
    start_time: string; // HH:MM
    end_time: string;   // HH:MM
  };
}
