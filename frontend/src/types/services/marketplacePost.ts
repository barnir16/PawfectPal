export interface MarketplacePost {
  id: number;
  user_id: number;
  title: string;
  description: string;
  service_type: string;
  pet_ids: number[];
  location?: string;
  preferred_dates?: string[];
  budget_min?: number;
  budget_max?: number;
  experience_years_min?: number;
  languages?: string[];
  special_requirements?: string;
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  is_urgent: boolean;
  views_count: number;
  responses_count: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  
  // Relationships
  user?: {
    id: number;
    username: string;
    full_name?: string;
  };
  pets?: Array<{
    id: number;
    name: string;
    species: string;
    breed?: string;
  }>;
}

export interface MarketplacePostCreate {
  title: string;
  description: string;
  service_type: string;
  pet_ids: number[];
  location?: string;
  preferred_dates?: string[];
  budget_min?: number;
  budget_max?: number;
  experience_years_min?: number;
  languages?: string[];
  special_requirements?: string;
  is_urgent: boolean;
}

export interface MarketplacePostUpdate {
  title?: string;
  description?: string;
  service_type?: string;
  pet_ids?: number[];
  location?: string;
  preferred_dates?: string[];
  budget_min?: number;
  budget_max?: number;
  experience_years_min?: number;
  languages?: string[];
  special_requirements?: string;
  is_urgent?: boolean;
  status?: 'open' | 'in_progress' | 'completed' | 'closed';
}

export interface MarketplacePostSummary {
  id: number;
  title: string;
  description: string;
  service_type: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  is_urgent: boolean;
  views_count: number;
  responses_count: number;
  created_at: string;
  expires_at?: string;
  user?: {
    id: number;
    username: string;
    full_name?: string;
  };
}

