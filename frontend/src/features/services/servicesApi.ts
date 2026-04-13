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
  provider_rating_count?: number;
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
  // Parse provider_services if it's a JSON string and narrow to ServiceType[]
  const allowed: ServiceType[] = ['walking', 'sitting', 'boarding', 'grooming', 'veterinary'];

  // Map backend service names to frontend service types
  const serviceNameMap: { [key: string]: ServiceType } = {
    'Dog Walking': 'walking',
    'Pet Sitting': 'sitting',
    'Boarding': 'boarding',
    'Grooming': 'grooming',
    'Veterinary': 'veterinary',
    'walking': 'walking',
    'sitting': 'sitting',
    'boarding': 'boarding',
    'grooming': 'grooming',
    'veterinary': 'veterinary',
  };

  let provider_services: ServiceType[] = [];
  if (user.provider_services) {
    let raw: string[] = [];
    if (typeof user.provider_services === 'string') {
      try {
        const parsed = JSON.parse(user.provider_services);
        raw = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        raw = [user.provider_services];
      }
    } else if (Array.isArray(user.provider_services)) {
      raw = user.provider_services as string[];
    } else {
      raw = [];
    }

    // Map service names to service types
    provider_services = raw
      .map(serviceName => serviceNameMap[serviceName])
      .filter((serviceType): serviceType is ServiceType => serviceType !== undefined && allowed.includes(serviceType));
  }

  console.log('🔍 Service transformation:', {
    original: user.provider_services,
    mapped: provider_services,
    userId: user.id
  });

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
    languages: ["English", "Hebrew"], // Default language
    experience_years: undefined,
    response_time_minutes: undefined,
    completed_bookings: undefined,
    last_online: undefined,
    profile_image: user.profile_image,
    verified: true, // Default to verified
    reviews_count: user.provider_rating_count,
    average_rating: user.provider_rating,
  };
}

// [HYBRID_PROVIDER_FETCH - START]
// New system: fetch providers from backend and mock simultaneously, merge results.
async function fetchBackendProviders(filter?: string[]): Promise<ServiceProvider[]> {
  const token = await getToken();
  const params = new URLSearchParams();
  if (filter && filter.length) {
    // Backend expects repeated query params or a single param; we’ll append all values
    for (const f of filter) params.append('filter', f);
  }

  const url = `${getBaseUrl()}/providers/?${params.toString()}`;
  console.log(' Fetching backend providers:', {
    url,
    hasToken: !!token,
    filter
  });

  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
  });

  console.log(' Backend response:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    url: res.url
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(' Backend providers fetch failed:', {
      status: res.status,
      errorText,
      url
    });
    throw new Error(`Failed to fetch backend providers (${res.status})`);
  }

  const data: BackendUserRead[] = await res.json();
  console.log(' Backend providers loaded:', data.length);
  return data.map(transformUserToServiceProvider);
}

export async function getProviders(filter?: string[]): Promise<ServiceProvider[]> {
  // Old mock-only implementation preserved for future reference:
  // console.log('📊 Using mock provider data');
  // try {
  //   const serviceType = filter && filter.length > 0 ? filter[0] : undefined;
  //   const providers = await MockProviderService.getProviders(serviceType);
  //   console.log(`📊 Loaded ${providers.length} mock providers`);
  //   return providers;
  // } catch (mockError) {
  //   console.error('Error loading mock providers:', mockError);
  //   return [];
  // }

  const serviceType = filter && filter.length > 0 ? filter[0] : undefined;
  const mockPromise = MockProviderService.getProviders(serviceType).catch((e) => {
    console.warn('Mock providers failed:', e);
    return [] as ServiceProvider[];
  });
  const backendPromise = fetchBackendProviders(filter).catch((e) => {
    console.warn('Backend providers failed:', e);
    return [] as ServiceProvider[];
  });

  const [mockProviders, backendProviders] = await Promise.all([mockPromise, backendPromise]);

  // Merge by provider id; prefer backend data when duplicate ids exist
  const byId = new Map<number, ServiceProvider>();
  for (const p of mockProviders) byId.set(p.id, p);
  for (const p of backendProviders) byId.set(p.id, p); // backend overrides

  const merged = Array.from(byId.values());
  console.log(`📊 Providers merged: mock=${mockProviders.length}, backend=${backendProviders.length}, merged=${merged.length}`);
  return merged;
}
// [HYBRID_PROVIDER_FETCH - END]


// Create a provider review (rating with optional comment)
export async function createProviderReview(providerId: number, rating: number, comment?: string) {
  const token = await getToken();
  const res = await fetch(`${getBaseUrl()}/providers/${providerId}/reviews`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rating, comment }),
  });
  if (!res.ok) throw new Error(`Failed to create review (${res.status})`);
  return await res.json();
}

// Get provider reviews (paginated)
export async function getProviderReviews(providerId: number, limit = 20, offset = 0) {
  const res = await fetch(`${getBaseUrl()}/providers/${providerId}/reviews?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to load reviews (${res.status})`);
  return await res.json();
}

// Check if current user is eligible to review a provider
export async function getProviderReviewEligibility(providerId: number): Promise<{ eligible: boolean; reason?: string }> {
  const token = await getToken();
  const res = await fetch(`${getBaseUrl()}/providers/${providerId}/review-eligibility`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
  });
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error(`Failed to check eligibility (${res.status})`);
  return await res.json();
}
