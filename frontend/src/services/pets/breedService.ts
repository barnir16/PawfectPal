

/**
 * Comprehensive breed information interface
 */
export interface BreedInfo {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'other';
  description?: string;
  lifeSpan?: string;
  weight?: {
    min: number;
    max: number;
    unit: string;
  };
  height?: {
    min: number;
    max: number;
    unit: string;
  };
  temperament?: string[];
  healthIssues?: string[];
  groomingNeeds?: string;
  exerciseNeeds?: string;
  goodWith?: string[];
  imageUrl?: string;
}

/**
 * Get breed suggestions based on search term (local data only for now)
 */
export const searchBreeds = async (
  query: string,
  type: 'dog' | 'cat' | 'all' = 'all',
  limit: number = 10
): Promise<BreedInfo[]> => {
  try {
    // For now, we'll use local data since the backend doesn't have breed search endpoints
    return getLocalBreedSuggestions(query, type, limit);
  } catch (error) {
    console.error('Error searching breeds:', error);
    return [];
  }
};

/**
 * Get popular breeds for a specific pet type (local data only for now)
 */
export const getPopularBreeds = async (
  type: 'dog' | 'cat',
  limit: number = 20
): Promise<BreedInfo[]> => {
  try {
    return getLocalPopularBreeds(type, limit);
  } catch (error) {
    console.error('Error fetching popular breeds:', error);
    return [];
  }
};

/**
 * Get breed recommendations based on user preferences (local data only for now)
 */
export const getBreedRecommendations = async (
  preferences: {
    size?: 'small' | 'medium' | 'large';
    energy?: 'low' | 'medium' | 'high';
    grooming?: 'low' | 'medium' | 'high';
    goodWith?: string[];
    type: 'dog' | 'cat';
  }
): Promise<BreedInfo[]> => {
  try {
    return getLocalBreedRecommendations(preferences);
  } catch (error) {
    console.error('Error fetching breed recommendations:', error);
    return [];
  }
};

/**
 * Get all available breeds for a pet type
 */
export const getAllBreeds = (type: 'dog' | 'cat' | 'all'): string[] => {
  if (type === 'dog') {
    return [...dogBreeds];
  } else if (type === 'cat') {
    return [...catBreeds];
  } else {
    return [...dogBreeds, ...catBreeds];
  }
};

// Local breed data functions
const getLocalBreedSuggestions = (
  query: string,
  type: 'dog' | 'cat' | 'all',
  limit: number
): BreedInfo[] => {
  const allBreeds = [...dogBreeds, ...catBreeds];
  const filtered = allBreeds
    .filter(breed => 
      breed.toLowerCase().includes(query.toLowerCase()) &&
      (type === 'all' || 
       (type === 'dog' && dogBreeds.includes(breed)) ||
       (type === 'cat' && catBreeds.includes(breed)))
    )
    .slice(0, limit);
  
  return filtered.map(breed => ({
    id: breed.toLowerCase().replace(/\s+/g, '-'),
    name: breed,
    type: dogBreeds.includes(breed) ? 'dog' : 'cat',
    description: `Information about ${breed} breed`
  }));
};

const getLocalPopularBreeds = (type: 'dog' | 'cat', limit: number): BreedInfo[] => {
  const breeds = type === 'dog' ? dogBreeds : catBreeds;
  return breeds.slice(0, limit).map(breed => ({
    id: breed.toLowerCase().replace(/\s+/g, '-'),
    name: breed,
    type,
    description: `Popular ${breed} breed`
  }));
};

const getLocalBreedRecommendations = (preferences: any): BreedInfo[] => {
  // Simple local recommendation logic
  const breeds = preferences.type === 'dog' ? dogBreeds : catBreeds;
  return breeds.slice(0, 5).map(breed => ({
    id: breed.toLowerCase().replace(/\s+/g, '-'),
    name: breed,
    type: preferences.type,
    description: `Recommended ${breed} based on your preferences`
  }));
};

// Local breed data as fallback - these match what's available in the backend
const dogBreeds = [
  "Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog",
  "Bulldog", "Poodle", "Beagle", "Rottweiler", "Yorkshire Terrier", "Boxer",
  "Dachshund", "Great Dane", "Siberian Husky", "Doberman", "Shih Tzu",
  "Pomeranian", "Chihuahua", "Border Collie", "Bernese Mountain Dog", "Other"
];

const catBreeds = [
  "Siamese", "Persian", "Maine Coon", "Ragdoll", "Bengal", "Sphynx",
  "British Shorthair", "Russian Blue", "Abyssinian", "American Shorthair",
  "Norwegian Forest", "Scottish Fold", "Exotic Shorthair", "Oriental Shorthair",
  "Burmese", "Himalayan", "Other"
];
