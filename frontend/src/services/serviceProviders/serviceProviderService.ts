import { api } from '../../api';

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
    const response = await api.get(`/providers/${providerId}`);
    return response.data;
  }

  static async getProviders(): Promise<ServiceProvider[]> {
    const response = await api.get('/providers');
    return response.data;
  }

  static async getProvidersByService(serviceType: string): Promise<ServiceProvider[]> {
    const response = await api.get(`/providers?service_type=${serviceType}`);
    return response.data;
  }

  static async updateProvider(providerId: number, data: Partial<ServiceProvider>): Promise<ServiceProvider> {
    const response = await api.put(`/providers/${providerId}`, data);
    return response.data;
  }

  static async createProviderProfile(data: Partial<ServiceProvider>): Promise<ServiceProvider> {
    const response = await api.post('/providers', data);
    return response.data;
  }
}
