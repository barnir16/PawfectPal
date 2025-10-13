import { getBaseUrl, getToken } from '../api';

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
    const response = await fetch(`${getBaseUrl()}/providers/${providerId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch provider');
    return response.json();
  }

  static async getProviders(): Promise<ServiceProvider[]> {
    const response = await fetch(`${getBaseUrl()}/providers`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch providers');
    return response.json();
  }

  static async getProvidersByService(serviceType: string): Promise<ServiceProvider[]> {
    const response = await fetch(`${getBaseUrl()}/providers?service_type=${serviceType}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch providers by service');
    return response.json();
  }

  static async updateProvider(providerId: number, data: Partial<ServiceProvider>): Promise<ServiceProvider> {
    const response = await fetch(`${getBaseUrl()}/providers/${providerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update provider');
    return response.json();
  }

  static async createProviderProfile(data: Partial<ServiceProvider>): Promise<ServiceProvider> {
    const response = await fetch(`${getBaseUrl()}/providers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create provider profile');
    return response.json();
  }
}
