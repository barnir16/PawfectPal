import { getBaseUrl, getToken } from "../../services/api";
import type { Service, ServiceProvider, ServiceType } from "../../types/services";
import { MockProviderService } from "../../services/providers/mockProviderService";

// Backend UserRead type that includes provider information
interface BackendUserRead {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  profile_image?: string;
  is_provider: boolean;
  provider_services?: string | ServiceType[]; // Can be JSON string or array
  provider_rating?: number;
  provider_bio?: string;
  provider_hourly_rate?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

export async function getServices(status: "active" | "history"): Promise<Service[]> {
  const token = await getToken();
  console.log('🔑 Token for services API:', token ? 'Present' : 'Missing');
  
  const response = await fetch(`${getBaseUrl()}/service_booking/?status=${status}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data: Service[] = await response.json();
  return data;
}

// Transform backend UserRead to frontend ServiceProvider
function transformUserToServiceProvider(user: BackendUserRead): ServiceProvider {
  // Parse provider_services if it's a JSON string
  let provider_services: string[] = [];
  if (user.provider_services) {
    if (typeof user.provider_services === 'string') {
      try {
        provider_services = JSON.parse(user.provider_services);
      } catch (e) {
        provider_services = [user.provider_services];
      }
    } else {
      provider_services = user.provider_services;
    }
  }

  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    provider_services: provider_services,
    provider_rating: user.provider_rating,
    provider_bio: user.provider_bio,
    provider_hourly_rate: user.provider_hourly_rate,
    location: (user.latitude && user.longitude) ? {
      latitude: user.latitude,
      longitude: user.longitude,
    } : undefined,
    distance_km: undefined, // Will be calculated on frontend
    is_available: true, // Default to available
    languages: ["עברית"], // Default language
    experience_years: undefined,
    response_time_minutes: undefined,
    completed_bookings: undefined,
    last_online: undefined,
    profile_image: user.profile_image,
    verified: true, // Default to verified
    reviews_count: undefined,
    average_rating: user.provider_rating,
  };
}

export async function getProviders(filter?: string[]): Promise<ServiceProvider[]> {
  // For now, use mock data directly to avoid CORS issues
  console.log('📊 Using mock provider data');
  
  try {
    // If filter is empty array or undefined, get all providers
    const serviceType = filter && filter.length > 0 ? filter[0] : undefined;
    const providers = await MockProviderService.getProviders(serviceType);
    console.log(`📊 Loaded ${providers.length} mock providers`);
    return providers;
  } catch (mockError) {
    console.error('Error loading mock providers:', mockError);
    return [];
  }
}
