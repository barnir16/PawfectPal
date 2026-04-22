import { apiRequest } from "../../services/api";
import type { Service, ServiceProvider, ServiceType } from "../../types/services";
import { MockProviderService } from "../../services/providers/mockProviderService";
import { SHARED_CONFIG } from "../../config/shared";

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
  return apiRequest<Service[]>("/service_booking/", {
    params: { status },
  });
}

// Transform backend UserRead to frontend ServiceProvider
function transformUserToServiceProvider(user: BackendUserRead): ServiceProvider {
  // Parse provider_services if it's a JSON string and narrow to ServiceType[]
  const allowed: ServiceType[] = ["walking", "sitting", "boarding", "grooming", "veterinary"];

  // Map backend service names to frontend service types
  const serviceNameMap: { [key: string]: ServiceType } = {
    "Dog Walking": "walking",
    "Pet Sitting": "sitting",
    Boarding: "boarding",
    Grooming: "grooming",
    Veterinary: "veterinary",
    walking: "walking",
    sitting: "sitting",
    boarding: "boarding",
    grooming: "grooming",
    veterinary: "veterinary",
  };

  let provider_services: ServiceType[] = [];
  if (user.provider_services) {
    let raw: string[] = [];
    if (typeof user.provider_services === "string") {
      try {
        const parsed = JSON.parse(user.provider_services);
        raw = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        raw = [user.provider_services];
      }
    } else if (Array.isArray(user.provider_services)) {
      raw = user.provider_services as string[];
    } else {
      raw = [];
    }

    // Map service names to service types
    provider_services = raw
      .map((serviceName) => serviceNameMap[serviceName])
      .filter(
        (serviceType): serviceType is ServiceType =>
          serviceType !== undefined && allowed.includes(serviceType)
      );
  }
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    provider_services: provider_services,
    provider_rating: user.provider_rating,
    provider_bio: user.provider_bio,
    provider_hourly_rate: user.provider_hourly_rate,
    location:
      user.latitude && user.longitude
        ? {
            latitude: user.latitude,
            longitude: user.longitude,
          }
        : undefined,
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
async function fetchBackendProviders(filter?: string[]): Promise<ServiceProvider[]> {
  const data = await apiRequest<BackendUserRead[]>("/providers/", {
    params: filter && filter.length ? { filter } : undefined,
  });
  return data.map(transformUserToServiceProvider);
}

export async function getProviders(filter?: string[]): Promise<ServiceProvider[]> {
  const serviceType = filter && filter.length > 0 ? filter[0] : undefined;
  const isLocalDevelopment =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const shouldUseMockFallback =
    SHARED_CONFIG.development.enableMockData && isLocalDevelopment;

  try {
    const backendProviders = await fetchBackendProviders(filter);
    if (backendProviders.length > 0 || !shouldUseMockFallback) {
      return backendProviders;
    }
  } catch (error) {
    if (!shouldUseMockFallback) {
      throw error;
    }
    console.warn("Backend providers unavailable, falling back to mock data locally:", error);
  }

  return MockProviderService.getProviders(serviceType);
}
// [HYBRID_PROVIDER_FETCH - END]

// Create a provider review (rating with optional comment)
export async function createProviderReview(providerId: number, rating: number, comment?: string) {
  return apiRequest(`/providers/${providerId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  });
}

// Get provider reviews (paginated)
export async function getProviderReviews(providerId: number, limit = 20, offset = 0) {
  return apiRequest(`/providers/${providerId}/reviews`, {
    params: { limit, offset },
  });
}

// Check if current user is eligible to review a provider
export async function getProviderReviewEligibility(
  providerId: number
): Promise<{ eligible: boolean; reason?: string }> {
  return apiRequest<{ eligible: boolean; reason?: string }>(
    `/providers/${providerId}/review-eligibility`
  );
}
