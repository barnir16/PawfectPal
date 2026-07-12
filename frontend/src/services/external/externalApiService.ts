import { apiRequest } from '../api';

/**
 * External API service for public pet/breed data.
 *
 * Browser code must not store private provider keys or call private provider
 * APIs directly. Breed data is requested from the FastAPI backend, where
 * provider credentials can be safely used from server environment variables.
 */

export interface BreedInfo {
  name: string;
  temperament?: string;
  origin?: string;
  lifeSpan?: string;
  weight?: {
    imperial: string;
    metric: string;
  };
  averageWeight?: {
    min: number;
    max: number;
    unit: 'kg' | 'lb';
  };
  lifeExpectancy?: {
    min: number;
    max: number;
    unit: 'years';
  };
  characteristics?: {
    energyLevel?: 'low' | 'moderate' | 'high';
    groomingNeeds?: 'low' | 'moderate' | 'high';
    trainability?: 'low' | 'moderate' | 'high';
    goodWithChildren?: boolean;
    goodWithOtherPets?: boolean;
    barkingLevel?: 'low' | 'moderate' | 'high';
  };
  healthConsiderations?: string[];
  exerciseNeeds?: string;
  dietRecommendations?: string;
}

type SupportedPetType = 'dog' | 'cat';

const breedInfoCache = new Map<string, BreedInfo>();
const breedSearchCache = new Map<string, string[]>();

function debounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> =>
    new Promise((resolve, reject) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          resolve(await func(...args));
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
}

function shouldSearchBreed(breedName: string): boolean {
  return breedName.trim().length >= 2;
}

function getBreedCacheKey(petType: SupportedPetType, breedName: string): string {
  return `${petType}_${breedName.toLowerCase().trim()}`;
}

function getBreedSearchCacheKey(petType: SupportedPetType, searchTerm?: string): string {
  return `${petType}_search_${(searchTerm || '').toLowerCase().trim()}`;
}

async function fetchBreedsFromBackend(
  petType: SupportedPetType,
  searchTerm?: string
): Promise<string[]> {
  const normalizedSearch = searchTerm?.trim();

  if (normalizedSearch && !shouldSearchBreed(normalizedSearch)) {
    return [];
  }

  const cacheKey = getBreedSearchCacheKey(petType, normalizedSearch);
  const cached = breedSearchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const breeds = await apiRequest<string[]>(`/breeds/${petType}`, {
    params: normalizedSearch ? { q: normalizedSearch } : undefined,
  });

  const normalizedBreeds = Array.isArray(breeds) ? breeds : [];
  breedSearchCache.set(cacheKey, normalizedBreeds);
  return normalizedBreeds;
}

async function fetchBreedInfoFromBackend(
  petType: SupportedPetType,
  breedName: string
): Promise<BreedInfo | null> {
  if (!breedName || typeof breedName !== 'string') {
    return null;
  }

  const cacheKey = getBreedCacheKey(petType, breedName);
  const cached = breedInfoCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const breedInfo = await apiRequest<BreedInfo>(`/breeds/${petType}/info`, {
    params: { name: breedName.trim() },
  });

  breedInfoCache.set(cacheKey, breedInfo);
  return breedInfo;
}

export const checkExternalAPIAccessibility = async (): Promise<{
  dogAPI: boolean;
  catAPI: boolean;
  network: boolean;
}> => {
  const result = {
    dogAPI: false,
    catAPI: false,
    network: false,
  };

  try {
    const [dogBreeds, catBreeds] = await Promise.all([
      fetchBreedsFromBackend('dog', 'lab'),
      fetchBreedsFromBackend('cat', 'per'),
    ]);

    result.dogAPI = dogBreeds.length > 0;
    result.catAPI = catBreeds.length > 0;
    result.network = result.dogAPI || result.catAPI;
  } catch (error) {
    console.warn('Backend breed API accessibility check failed:', error);
  }

  return result;
};

export const testBreedInfoAPI = async (): Promise<void> => {
  try {
    const [dogInfo, catInfo] = await Promise.all([
      fetchDogBreedInfo('labrador'),
      fetchCatBreedInfo('persian'),
    ]);

    console.info('Breed info API test completed:', {
      dog: dogInfo?.name,
      cat: catInfo?.name,
    });
  } catch (error) {
    console.error('Breed info API test failed:', error);
  }
};

export const fetchDogBreedInfo = async (breedName: string): Promise<BreedInfo | null> => {
  try {
    return await fetchBreedInfoFromBackend('dog', breedName);
  } catch (error) {
    console.error('Failed to fetch dog breed info from backend:', error);
    return null;
  }
};

export const fetchCatBreedInfo = async (breedName: string): Promise<BreedInfo | null> => {
  try {
    return await fetchBreedInfoFromBackend('cat', breedName);
  } catch (error) {
    console.error('Failed to fetch cat breed info from backend:', error);
    return null;
  }
};

export const fetchDogBreeds = debounce(async (searchTerm?: string): Promise<string[]> => {
  try {
    return await fetchBreedsFromBackend('dog', searchTerm);
  } catch (error) {
    console.error('Error fetching dog breeds from backend:', error);
    return [];
  }
}, 150);

export const fetchCatBreeds = debounce(async (searchTerm?: string): Promise<string[]> => {
  try {
    return await fetchBreedsFromBackend('cat', searchTerm);
  } catch (error) {
    console.error('Error fetching cat breeds from backend:', error);
    return [];
  }
}, 150);

export const searchBreeds = async (petType: string, query: string): Promise<string[]> => {
  if (petType === 'dog') {
    return (await fetchDogBreeds(query)).slice(0, 10);
  }

  if (petType === 'cat') {
    return (await fetchCatBreeds(query)).slice(0, 10);
  }

  return ['Mixed', 'Unknown', 'Other'];
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};
