import type { Pet } from '../pets';
import type { User } from '../auth';

export type ServiceRequestStatus = 'open' | 'in_progress' | 'completed' | 'closed';

export interface ServiceRequest {
  id: number;
  user_id: number;
  assigned_provider_id?: number;
  service_type: string;
  title: string;
  description: string;
  pet_ids: number[];
  location?: string;
  preferred_dates?: string[];
  budget_min?: number;
  budget_max?: number;
  experience_years_min?: number;
  languages?: string[];
  special_requirements?: string;
  status: ServiceRequestStatus;
  is_urgent: boolean;
  views_count: number;
  responses_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  
  // Relationships
  user?: User;
  assigned_provider?: User;
  pets?: Pet[];
}

export interface ServiceRequestCreate {
  service_type: string;
  title: string;
  description: string;
  pet_ids: number[];
  location?: string;
  preferred_dates?: string[];
  budget_min?: number;
  budget_max?: number;
  experience_years_min?: number;
  languages?: string[];
  special_requirements?: string;
  is_urgent?: boolean;
}

export interface ServiceRequestUpdate {
  title?: string;
  description?: string;
  location?: string;
  preferred_dates?: string[];
  budget_min?: number;
  budget_max?: number;
  experience_years_min?: number;
  languages?: string[];
  special_requirements?: string;
  is_urgent?: boolean;
  status?: ServiceRequestStatus;
}

export interface ServiceRequestSummary {
  id: number;
  title: string;
  service_type: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  is_urgent: boolean;
  created_at: string;
  views_count: number;
  responses_count: number;
  user: User;
  pets: Pet[];
}

export interface ServiceRequestFilters {
  service_type?: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  is_urgent?: boolean;
  limit?: number;
  offset?: number;
}