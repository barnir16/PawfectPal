import { apiClient } from '../api';

export interface ServiceProvider {
  id: number;
  username: string;
  full_name: string;
  email: string;
  profile_image?: string;
  location?: string;
  provider_bio?: string;
  provider_hourly_rate?: number;
  provider_services: string[];
  is_available: boolean;
  rating?: number;
  review_count?: number;
  completed_bookings?: number;
  experience_years?: number;
  languages?: string[];
  certifications?: string[];
  service_radius?: number;
  verified?: boolean;
  created_at: string;
  updated_at: string;
}

export class ServiceProviderService {
  static async getProvider(providerId: number): Promise<ServiceProvider> {
    return await apiClient.get<ServiceProvider>(`/providers/${providerId}`);
  }

  static async getProviders(): Promise<ServiceProvider[]> {
    return await apiClient.get<ServiceProvider[]>('/providers');
  }

  static async getProvidersByService(serviceType: string): Promise<ServiceProvider[]> {
    return await apiClient.get<ServiceProvider[]>(`/providers?service_type=${serviceType}`);
  }

  static async updateProvider(providerId: number, data: Partial<ServiceProvider>): Promise<ServiceProvider> {
    return await apiClient.put<ServiceProvider>(`/providers/${providerId}`, data);
  }

  static async createProviderProfile(data: Partial<ServiceProvider>): Promise<ServiceProvider> {
    return await apiClient.post<ServiceProvider>('/providers', data);
  }
}
