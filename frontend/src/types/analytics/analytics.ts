import type {  ServiceType } from '../services';

/**
 * Analytics data for a pet
 */
export interface PetAnalytics {
  pet_id: number;
  pet_name: string;
  species: string;
  breed: string;
  age_months: number;
  
  // Activity metrics
  total_distance_km: number;
  average_daily_steps: number;
  average_daily_active_minutes: number;
  calories_burned: number;
  
  // Health metrics
  weight_history: Array<{
    date: string;  // ISO date string
    weight_kg: number;
    body_condition_score?: number;
  }>;
  
  // Behavior metrics
  activity_level: 'low' | 'moderate' | 'high';
  sleep_patterns: Array<{
    date: string;  // ISO date string
    total_sleep_hours: number;
    deep_sleep_hours: number;
    light_sleep_hours: number;
  }>;
  
  // Location metrics
  frequent_locations: Array<{
    latitude: number;
    longitude: number;
    address: string;
    visit_count: number;
    last_visited: string;  // ISO date string
  }>;
  
  // Task metrics
  task_completion_rate: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  
  // Health alerts
  health_alerts: Array<{
    type: 'weight' | 'activity' | 'behavior' | 'other';
    message: string;
    severity: 'low' | 'medium' | 'high';
    date: string;  // ISO date string
    resolved: boolean;
  }>;
  
  // Trends
  activity_trend: 'increasing' | 'decreasing' | 'stable';
  weight_trend: 'increasing' | 'decreasing' | 'stable';
  sleep_quality_trend: 'improving' | 'declining' | 'stable';
}

/**
 * Analytics data for services
 */
export interface ServiceAnalytics {
  // Summary metrics
  total_services: number;
  completed_services: number;
  cancelled_services: number;
  total_revenue: number;
  average_rating: number;
  
  // Service type distribution
  service_type_distribution: Array<{
    service_type: ServiceType;
    count: number;
    percentage: number;
    revenue: number;
    average_rating: number;
  }>;
  
  // Time-based metrics
  monthly_trends: Array<{
    month: string;  // YYYY-MM
    services: number;
    revenue: number;
    average_rating: number;
    new_customers: number;
    repeat_customers: number;
  }>;
  
  // Provider performance
  provider_performance: Array<{
    provider_id: number;
    provider_name: string;
    completed_services: number;
    cancelled_services: number;
    average_rating: number;
    total_revenue: number;
    average_response_time_minutes: number;
    customer_retention_rate: number;
  }>;
  
  // Customer metrics
  customer_metrics: {
    total_customers: number;
    new_customers: number;
    repeat_customers: number;
    average_services_per_customer: number;
    customer_retention_rate: number;
    top_customers: Array<{
      user_id: number;
      user_name: string;
      total_spent: number;
      services_count: number;
      last_service_date: string;  // ISO date string
    }>;
  };
  
  // Revenue metrics
  revenue_metrics: {
    total_revenue: number;
    revenue_by_service_type: Record<ServiceType, number>;
    revenue_by_month: Record<string, number>;  // YYYY-MM: amount
    average_order_value: number;
    revenue_growth_rate: number;
    refunds: number;
    discounts: number;
    net_revenue: number;
  };
  
  // Service quality metrics
  quality_metrics: {
    average_rating: number;
    rating_distribution: Record<number, number>;  // rating: count
    average_response_time_minutes: number;
    completion_rate: number;
    cancellation_rate: number;
    customer_satisfaction_score: number;
    net_promoter_score: number;
  };
}

/**
 * Analytics data for users
 */
export interface UserAnalytics {
  // User metrics
  total_users: number;
  new_users: number;
  active_users: number;
  inactive_users: number;
  user_growth_rate: number;
  
  // User demographics
  demographics: {
    by_gender: Record<string, number>;
    by_age_group: Record<string, number>;
    by_location: Array<{
      city: string;
      region: string;
      country: string;
      user_count: number;
    }>;
    by_device: Record<string, number>;
    by_platform: Record<string, number>;
  };
  
  // User engagement
  engagement_metrics: {
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    average_session_duration_minutes: number;
    sessions_per_user: number;
    retention_rate: Record<string, number>;  // day N: percentage
    churn_rate: number;
    feature_usage: Record<string, number>;
  };
  
  // User acquisition
  acquisition_metrics: {
    by_source: Record<string, number>;
    by_campaign: Record<string, number>;
    by_referral: Record<string, number>;
    cost_per_acquisition: number;
    return_on_ad_spend: number;
    lifetime_value: number;
  };
  
  // User behavior
  behavior_metrics: {
    average_time_to_first_action: number;
    conversion_rate: number;
    dropoff_points: Array<{
      step: string;
      dropoff_rate: number;
    }>;
    feature_adoption: Record<string, number>;
    user_journey: Array<{
      path: string[];
      count: number;
      conversion_rate: number;
    }>;
  };
}

/**
 * System-wide analytics
 */
export interface SystemAnalytics {
  // System metrics
  total_pets: number;
  total_services: number;
  total_tasks: number;
  total_users: number;
  total_providers: number;
  
  // Performance metrics
  api_response_time_ms: number;
  api_success_rate: number;
  server_uptime: number;
  error_rates: {
    total_errors: number;
    by_endpoint: Record<string, number>;
    by_type: Record<string, number>;
  };
  
  // Usage metrics
  active_sessions: number;
  concurrent_users: number;
  requests_per_minute: number;
  data_usage: {
    storage_used_mb: number;
    bandwidth_used_mb: number;
    images_stored: number;
    documents_stored: number;
  };
  
  // System health
  system_health: {
    cpu_usage_percent: number;
    memory_usage_percent: number;
    disk_usage_percent: number;
    database_connections: number;
    cache_hit_rate: number;
    queue_length: number;
  };
  
  // Maintenance metrics
  maintenance_metrics: {
    last_backup: string;  // ISO date string
    backup_size_mb: number;
    backup_success_rate: number;
    system_updates: Array<{
      version: string;
      date: string;  // ISO date string
      success: boolean;
      duration_minutes: number;
    }>;
  };
}
