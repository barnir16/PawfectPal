/**
 * External API service for integrating with third-party APIs
 */

// Dog API for breed information
const DOG_API_BASE = 'https://dog.ceo/api';

// Cat API for breed information  
const CAT_API_BASE = 'https://api.thecatapi.com/v1';

export interface BreedInfo {
  name: string;
  temperament?: string;
  origin?: string;
  lifeSpan?: string;
  weight?: {
    imperial: string;
    metric: string;
  };
}

/**
 * Fetch dog breeds from external API
 */
export const fetchDogBreeds = async (): Promise<string[]> => {
  try {
    console.log('Fetching dog breeds from API...');
    const response = await fetch(`${DOG_API_BASE}/breeds/list/all`, {
      signal: AbortSignal.timeout(10000) // Increased timeout to 10 seconds
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch dog breeds`);
    }
    
    const data = await response.json();
    console.log('Dog breeds API response:', data);
    
    const breeds = Object.keys(data.message || {});
    console.log(`Fetched ${breeds.length} dog breeds from API`);
    
    // Format breed names properly and handle sub-breeds
    const formattedBreeds = breeds.map(breed => {
      const subBreeds = data.message[breed];
      const baseName = breed.charAt(0).toUpperCase() + breed.slice(1).replace(/-/g, ' ');
      
      // If there are sub-breeds, include them
      if (Array.isArray(subBreeds) && subBreeds.length > 0) {
        const subBreedList = subBreeds.map(sub => 
          `${sub.charAt(0).toUpperCase() + sub.slice(1)} ${baseName}`
        );
        return [baseName, ...subBreedList];
      }
      
      return [baseName];
    }).flat();
    
    // Sort alphabetically and remove duplicates
    const uniqueBreeds = [...new Set(formattedBreeds)].sort();
    console.log(`Returning ${uniqueBreeds.length} formatted dog breeds`);
    
    return uniqueBreeds;
  } catch (error) {
    console.error('Failed to fetch dog breeds from external API:', error);
    // Return enhanced fallback list
    return [
      'Labrador Retriever',
      'German Shepherd', 
      'Golden Retriever',
      'French Bulldog',
      'English Bulldog',
      'American Bulldog',
      'Bullmastiff',
      'Staffordshire Bull Terrier',
      'Poodle',
      'Beagle',
      'Rottweiler',
      'Yorkshire Terrier',
      'Dachshund',
      'Border Collie',
      'Australian Shepherd',
      'Siberian Husky'
    ].sort();
  }
};

/**
 * Fetch cat breeds from external API
 */
export const fetchCatBreeds = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${CAT_API_BASE}/breeds`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch cat breeds');
    }
    
    const data = await response.json();
    return data.map((breed: any) => breed.name || 'Unknown');
  } catch (error) {
    console.warn('Failed to fetch cat breeds from external API:', error);
    // Return fallback list
    return [
      'Persian',
      'Maine Coon',
      'Siamese', 
      'British Shorthair',
      'Ragdoll',
      'Abyssinian',
      'Sphynx',
      'Russian Blue',
      'Bengal',
      'American Shorthair'
    ];
  }
};

/**
 * Search breeds by query string
 */
export const searchBreeds = async (petType: string, query: string): Promise<string[]> => {
  let allBreeds: string[] = [];
  
  if (petType === 'dog') {
    allBreeds = await fetchDogBreeds();
  } else if (petType === 'cat') {
    allBreeds = await fetchCatBreeds();
  } else {
    // For other pet types, return generic options
    return ['Mixed', 'Unknown', 'Other'];
  }
  
  if (!query.trim()) {
    return allBreeds.slice(0, 10); // Return first 10 breeds if no query
  }
  
  // Filter breeds by query
  const filtered = allBreeds.filter(breed =>
    breed.toLowerCase().includes(query.toLowerCase())
  );
  
  return filtered.slice(0, 10); // Return max 10 results
};

/**
 * Get weather information for location-based features
 */
export const getWeatherInfo = async (lat: number, lon: number): Promise<any> => {
  // Placeholder for weather API integration
  console.log('Weather API not implemented yet', { lat, lon });
  return null;
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (
  lat1: number,
  lon1: number, 
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
};