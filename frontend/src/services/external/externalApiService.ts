/**
 * External API service for integrating with third-party APIs
 */

// Enhanced breed information interface
export interface BreedInfo {
  name: string;
  temperament?: string;
  origin?: string;
  lifeSpan?: string;
  weight?: {
    imperial: string;
    metric: string;
  };
  // Enhanced medical information
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

// Cache for breed information to avoid repeated API calls
const breedInfoCache = new Map<string, BreedInfo>();
const breedSearchCache = new Map<string, string[]>(); // Cache breed search results

// Debounce function to limit API calls
function debounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeout: NodeJS.Timeout;
  let pendingPromise: Promise<Awaited<ReturnType<T>>> | null = null;
  
  return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    if (pendingPromise) {
      clearTimeout(timeout);
    }
    
    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
}

// Check if breed name has enough characters for meaningful search
function shouldSearchBreed(breedName: string): boolean {
  return breedName.trim().length >= 3;
}

// Get cache key for breed info
function getBreedCacheKey(petType: string, breedName: string): string {
  return `${petType.toLowerCase()}_${breedName.toLowerCase().trim()}`;
}

// Get cache key for breed search
function getBreedSearchCacheKey(petType: string, searchTerm: string): string {
  return `${petType.toLowerCase()}_search_${searchTerm.toLowerCase().trim()}`;
}

/**
 * Test function to verify breed info API is working
 */
export const testBreedInfoAPI = async (): Promise<void> => {
  console.log('🧪 Testing breed info API...');
  
  try {
    // Test dog breed info
    console.log('🧪 Testing dog breed info...');
    const dogInfo = await fetchDogBreedInfo('labrador');
    console.log('🧪 Dog breed info result:', dogInfo);
    
    // Test cat breed info
    console.log('🧪 Testing cat breed info...');
    const catInfo = await fetchCatBreedInfo('persian');
    console.log('🧪 Cat breed info result:', catInfo);
    
    // Test with empty string
    console.log('🧪 Testing with empty string...');
    const emptyInfo = await fetchDogBreedInfo('');
    console.log('🧪 Empty string result:', emptyInfo);
    
    // Test with undefined
    console.log('🧪 Testing with undefined...');
    const undefinedInfo = await fetchDogBreedInfo(undefined as any);
    console.log('🧪 Undefined result:', undefinedInfo);
    
    // Test network connectivity
    console.log('🧪 Testing network connectivity...');
    try {
      const response = await fetch('https://api.thedogapi.com/v1/breeds/search?q=labrador');
      console.log('🧪 Network test response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🧪 Network test data sample:', data.slice(0, 2));
      }
    } catch (networkError) {
      console.error('🧪 Network test failed:', networkError);
    }
    
    console.log('🧪 Breed info API test completed');
  } catch (error) {
    console.error('🧪 Breed info API test failed:', error);
  }
};

/**
 * Fetch detailed dog breed information with caching
 */
export const fetchDogBreedInfo = async (breedName: string): Promise<BreedInfo | null> => {
  if (!breedName || typeof breedName !== 'string') {
    console.warn('🐕 Invalid breed name provided:', breedName);
    return null;
  }

  console.log('🐕 fetchDogBreedInfo called with:', breedName);
  const cacheKey = getBreedCacheKey('dog', breedName);
  
  // Check cache first
  if (breedInfoCache.has(cacheKey)) {
    console.log('🐕 Using cached dog breed info for:', breedName);
    return breedInfoCache.get(cacheKey)!;
  }

  try {
    console.log('🐕 Fetching dog breed info for:', breedName);
    
    // Try to get from our enhanced database first
    const enhancedInfo = DOG_BREED_DATABASE[breedName.toLowerCase()];
    if (enhancedInfo) {
      console.log('🐕 Found enhanced breed info in database for:', breedName);
      const completeInfo: BreedInfo = {
        name: breedName,
        ...enhancedInfo
      };
      breedInfoCache.set(cacheKey, completeInfo);
      return completeInfo;
    }

    console.log('🐕 Not found in local database, trying external API...');
    
    // Try to get detailed info from The Dog API
    try {
      console.log('🐕 Calling The Dog API for breed info:', breedName);
      const breedResponse = await fetch(`https://api.thedogapi.com/v1/breeds/search?q=${encodeURIComponent(breedName)}`);
      
      if (breedResponse.ok) {
        const breedData = await breedResponse.json();
        console.log('🐕 The Dog API response:', breedData);
        
        if (breedData && breedData.length > 0) {
          const breed = breedData[0];
          console.log('🐕 Found breed data:', breed);
          
          // Create enhanced breed info from external API
          const enhancedInfo: BreedInfo = {
            name: breedName,
            averageWeight: parseWeightRange(breed.weight?.metric || '20-30 kg'),
            lifeExpectancy: parseLifeSpan(breed.life_span || '10-15 years'),
            characteristics: {
              energyLevel: getEnergyLevel(breed.energy_level || 3),
              groomingNeeds: getGroomingNeeds(breed.grooming || 3),
              trainability: getTrainability(breed.intelligence || 3),
              goodWithChildren: breed.child_friendly > 3,
              goodWithOtherPets: breed.other_pets_friendly > 3,
            },
            healthConsiderations: breed.health_issues ? [breed.health_issues] : ['General breed health considerations'],
            exerciseNeeds: getExerciseNeeds(breed.energy_level || 3),
            dietRecommendations: getDietRecommendations(breed.weight?.metric),
            origin: breed.origin || 'Various origins',
            temperament: breed.temperament || 'Friendly and loyal companion',
          };
          
          console.log('🐕 Created enhanced dog breed info from external API for:', breedName);
          console.log('🐕 Enhanced info:', enhancedInfo);
          breedInfoCache.set(cacheKey, enhancedInfo);
          return enhancedInfo;
        } else {
          console.log('🐕 No breed data found in API response for:', breedName);
        }
      } else {
        console.log('🐕 The Dog API request failed with status:', breedResponse.status);
      }
    } catch (apiError) {
      console.log('🐕 External dog API failed:', apiError);
    }
    
    // Fallback to basic breed info if external API fails
    console.log('🐕 Using fallback basic breed info for:', breedName);
    const basicInfo: BreedInfo = {
      name: breedName,
      averageWeight: { min: 20, max: 30, unit: 'kg' as const },
      lifeExpectancy: { min: 10, max: 15, unit: 'years' as const },
      characteristics: {
        energyLevel: 'moderate' as const,
        groomingNeeds: 'moderate' as const,
        trainability: 'moderate' as const,
      },
      healthConsiderations: ['General breed health considerations'],
      exerciseNeeds: 'Regular daily exercise recommended',
      dietRecommendations: 'High-quality dog food appropriate for size and age',
      origin: 'Various origins',
      temperament: 'Friendly and loyal companion',
    };
    
    console.log('🐕 Created basic breed info from fallback for:', breedName);
    breedInfoCache.set(cacheKey, basicInfo);
    return basicInfo;
  } catch (error) {
    console.error('❌ Error fetching dog breed info:', error);
    return null;
  }
};

/**
 * Fetch detailed cat breed information with caching
 */
export const fetchCatBreedInfo = async (breedName: string): Promise<BreedInfo | null> => {
  if (!breedName || typeof breedName !== 'string') {
    console.warn('🐱 Invalid breed name provided:', breedName);
    return null;
  }

  const cacheKey = getBreedCacheKey('cat', breedName);
  
  // Check cache first
  if (breedInfoCache.has(cacheKey)) {
    console.log('🐱 Using cached cat breed info for:', breedName);
    return breedInfoCache.get(cacheKey)!;
  }

  try {
    console.log('🐱 Fetching cat breed info for:', breedName);
    
    // Try to get from our enhanced database first
    const enhancedInfo = CAT_BREED_DATABASE[breedName.toLowerCase()];
    if (enhancedInfo) {
      console.log('🐱 Found enhanced breed info in database for:', breedName);
      const completeInfo: BreedInfo = {
        name: breedName,
        ...enhancedInfo
      };
      breedInfoCache.set(cacheKey, completeInfo);
      return completeInfo;
    }

    // Fallback to external API if not in our database
    const response = await fetch(`https://api.thecatapi.com/v1/breeds/search?q=${encodeURIComponent(breedName)}`);
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.length > 0) {
        const breedData = data[0];
        
        // Create enhanced breed info from external API
        const enhancedInfo: BreedInfo = {
          name: breedName,
          averageWeight: parseWeightRange(breedData.weight),
          lifeExpectancy: parseLifeSpan(breedData.life_span),
          characteristics: {
            energyLevel: getEnergyLevel(breedData.energy_level),
            groomingNeeds: getGroomingNeeds(breedData.grooming),
            trainability: getTrainability(breedData.intelligence),
            goodWithChildren: breedData.child_friendly > 3,
            goodWithOtherPets: breedData.dog_friendly > 3,
          },
          healthConsiderations: breedData.health_issues ? [breedData.health_issues] : [],
          exerciseNeeds: getExerciseNeeds(breedData.energy_level),
          dietRecommendations: getDietRecommendations(breedData.energy_level),
          origin: breedData.origin || 'Various origins',
          temperament: breedData.temperament || 'Friendly and independent',
        };
        
        console.log('🐱 Created enhanced breed info from external API for:', breedName);
        breedInfoCache.set(cacheKey, enhancedInfo);
        return enhancedInfo;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching cat breed info:', error);
    return null;
  }
};

/**
 * Parse weight range from string (e.g., "20 - 30 kg")
 */
function parseWeightRange(weightStr: string): { min: number; max: number; unit: 'kg' | 'lb' } | undefined {
  const match = weightStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(kg|lb)/i);
  if (match) {
    return {
      min: parseFloat(match[1]),
      max: parseFloat(match[2]),
      unit: match[3].toLowerCase() as 'kg' | 'lb'
    };
  }
  return undefined;
}

/**
 * Parse life span from string (e.g., "12 - 15 years")
 */
function parseLifeSpan(lifeSpanStr: string): { min: number; max: number; unit: 'years' } | undefined {
  const match = lifeSpanStr.match(/(\d+)\s*-\s*(\d+)\s*years?/i);
  if (match) {
    return {
      min: parseInt(match[1]),
      max: parseInt(match[2]),
      unit: 'years'
    };
  }
  return undefined;
}

/**
 * Helper functions for characteristics
 */
function getEnergyLevel(level: number): 'low' | 'moderate' | 'high' {
  if (level <= 2) return 'low';
  if (level <= 4) return 'moderate';
  return 'high';
}

function getGroomingNeeds(grooming: number): 'low' | 'moderate' | 'high' {
  if (grooming <= 2) return 'low';
  if (grooming <= 4) return 'moderate';
  return 'high';
}

function getTrainability(intelligence: number): 'low' | 'moderate' | 'high' {
  if (intelligence <= 2) return 'low';
  if (intelligence <= 4) return 'moderate';
  return 'high';
}

function getExerciseNeeds(energyLevel: number): string {
  if (energyLevel <= 2) return 'Low exercise needs, gentle playtime';
  if (energyLevel <= 4) return 'Moderate exercise, daily walks/playtime';
  return 'High exercise needs, vigorous daily activity required';
}

function getDietRecommendations(weightOrEnergy?: string | number): string {
  if (!weightOrEnergy) return 'Consult veterinarian for specific dietary needs';
  
  // If it's a string, treat it as weight
  if (typeof weightOrEnergy === 'string') {
    const weightRange = parseWeightRange(weightOrEnergy);
    if (!weightRange) return 'Consult veterinarian for specific dietary needs';
    
    if (weightRange.unit === 'kg') {
      if (weightRange.max < 5) return 'Small breed diet, frequent small meals';
      if (weightRange.max < 20) return 'Medium breed diet, balanced nutrition';
      return 'Large breed diet, joint health support';
    }
  }
  
  // If it's a number, treat it as energy level
  if (typeof weightOrEnergy === 'number') {
    if (weightOrEnergy <= 2) return 'Low-calorie diet, portion control important';
    if (weightOrEnergy <= 4) return 'Balanced diet, moderate portions';
    return 'High-energy diet, increased protein and fat content';
  }
  
  return 'Consult veterinarian for specific dietary needs';
}

/**
 * Comprehensive dog breed database with medical information
 */
const DOG_BREED_DATABASE: Record<string, Partial<BreedInfo>> = {
  'labrador retriever': {
    averageWeight: { min: 25, max: 36, unit: 'kg' },
    lifeExpectancy: { min: 10, max: 14, unit: 'years' },
    characteristics: {
      energyLevel: 'high',
      groomingNeeds: 'moderate',
      trainability: 'high',
      goodWithChildren: true,
      goodWithOtherPets: true,
      barkingLevel: 'moderate'
    },
    healthConsiderations: [
      'Hip dysplasia risk',
      'Elbow dysplasia',
      'Eye conditions',
      'Obesity prone'
    ],
    exerciseNeeds: 'High exercise needs, daily walks and playtime',
    dietRecommendations: 'High-quality large breed diet, watch for overeating'
  },
  'german shepherd': {
    averageWeight: { min: 30, max: 40, unit: 'kg' },
    lifeExpectancy: { min: 7, max: 10, unit: 'years' },
    characteristics: {
      energyLevel: 'high',
      groomingNeeds: 'high',
      trainability: 'high',
      goodWithChildren: true,
      goodWithOtherPets: true,
      barkingLevel: 'high'
    },
    healthConsiderations: [
      'Hip dysplasia',
      'Degenerative myelopathy',
      'Pancreatic insufficiency',
      'Allergies'
    ],
    exerciseNeeds: 'Very high exercise needs, mental and physical stimulation',
    dietRecommendations: 'High-quality large breed diet, joint support supplements'
  },
  'golden retriever': {
    averageWeight: { min: 25, max: 34, unit: 'kg' },
    lifeExpectancy: { min: 10, max: 12, unit: 'years' },
    characteristics: {
      energyLevel: 'high',
      groomingNeeds: 'high',
      trainability: 'high',
      goodWithChildren: true,
      goodWithOtherPets: true,
      barkingLevel: 'low'
    },
    healthConsiderations: [
      'Hip dysplasia',
      'Elbow dysplasia',
      'Cancer risk',
      'Heart conditions'
    ],
    exerciseNeeds: 'High exercise needs, daily walks and playtime',
    dietRecommendations: 'High-quality large breed diet, cancer prevention focus'
  },
  'french bulldog': {
    averageWeight: { min: 9, max: 13, unit: 'kg' },
    lifeExpectancy: { min: 10, max: 12, unit: 'years' },
    characteristics: {
      energyLevel: 'moderate',
      groomingNeeds: 'low',
      trainability: 'moderate',
      goodWithChildren: true,
      goodWithOtherPets: true,
      barkingLevel: 'low'
    },
    healthConsiderations: [
      'Brachycephalic syndrome',
      'Hip dysplasia',
      'Spine issues',
      'Heat sensitivity'
    ],
    exerciseNeeds: 'Moderate exercise, avoid overheating',
    dietRecommendations: 'High-quality small breed diet, weight management'
  },
  'bulldog': {
    averageWeight: { min: 18, max: 23, unit: 'kg' },
    lifeExpectancy: { min: 8, max: 10, unit: 'years' },
    characteristics: {
      energyLevel: 'low',
      groomingNeeds: 'low',
      trainability: 'moderate',
      goodWithChildren: true,
      goodWithOtherPets: true,
      barkingLevel: 'low'
    },
    healthConsiderations: [
      'Brachycephalic syndrome',
      'Hip dysplasia',
      'Skin problems',
      'Respiratory issues'
    ],
    exerciseNeeds: 'Low exercise needs, gentle walks',
    dietRecommendations: 'High-quality diet, avoid overfeeding'
  }
};

/**
 * Comprehensive cat breed database with medical information
 */
const CAT_BREED_DATABASE: Record<string, Partial<BreedInfo>> = {
  'persian': {
    averageWeight: { min: 3, max: 5, unit: 'kg' },
    lifeExpectancy: { min: 12, max: 16, unit: 'years' },
    characteristics: {
      energyLevel: 'low',
      groomingNeeds: 'high',
      trainability: 'low',
      goodWithChildren: true,
      goodWithOtherPets: true,
      barkingLevel: 'low'
    },
    healthConsiderations: [
      'Brachycephalic syndrome',
      'Polycystic kidney disease',
      'Eye problems',
      'Dental issues'
    ],
    exerciseNeeds: 'Low exercise needs, gentle playtime',
    dietRecommendations: 'High-quality cat food, dental care diet'
  },
  'maine coon': {
    averageWeight: { min: 4, max: 8, unit: 'kg' },
    lifeExpectancy: { min: 12, max: 15, unit: 'years' },
    characteristics: {
      energyLevel: 'moderate',
      groomingNeeds: 'high',
      trainability: 'high',
      goodWithChildren: true,
      goodWithOtherPets: true,
      barkingLevel: 'low'
    },
    healthConsiderations: [
      'Hip dysplasia',
      'Hypertrophic cardiomyopathy',
      'Spinal muscular atrophy',
      'Polycystic kidney disease'
    ],
    exerciseNeeds: 'Moderate exercise, climbing and playtime',
    dietRecommendations: 'High-quality large breed cat food, joint support'
  }
};

/**
 * Fetch dog breeds with caching and debouncing
 */
export const fetchDogBreeds = debounce(async (searchTerm?: string): Promise<string[]> => {
  console.log('🐕 fetchDogBreeds called with searchTerm:', searchTerm);

  // Check cache first
  if (searchTerm) {
    const cacheKey = getBreedSearchCacheKey('dog', searchTerm);
    if (breedSearchCache.has(cacheKey)) {
      console.log('🐕 Using cached dog breeds for:', searchTerm);
      return breedSearchCache.get(cacheKey)!;
    }
    
    // Only search if we have enough characters
    if (!shouldSearchBreed(searchTerm)) {
      console.log('🐕 Search term too short, returning empty array');
      return [];
    }
  }

  try {
    console.log('🐕 Fetching dog breeds from API...');
    // Try the more comprehensive dog breeds API first
    let response = await fetch('https://api.thedogapi.com/v1/breeds');
    let data;
    
    if (response.ok) {
      data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const breeds = data.map((breed: any) => breed.name.toLowerCase());
        console.log('🐕 Using The Dog API - Fetched', breeds.length, 'dog breeds');
        console.log('🐕 Sample breed names:', breeds.slice(0, 10));
        
        // Log all breeds that contain "bull" for debugging
        const bullBreeds = breeds.filter(breed => breed.includes('bull'));
        console.log('🐕 All breeds containing "bull":', bullBreeds);
        
        // Filter breeds if search term provided
        let filteredBreeds = breeds;
        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase().trim();
          console.log('🐕 Searching for breed:', searchTerm, 'normalized to:', lowerSearchTerm);
          
          filteredBreeds = breeds.filter(breed => {
            const matches = breed.includes(lowerSearchTerm);
            if (matches) {
              console.log('🐕 Found match:', breed, 'for search term:', searchTerm);
            }
            return matches;
          });
          
          console.log('🐕 Filtered breeds:', filteredBreeds);
          
          // Cache the filtered results
          const cacheKey = getBreedSearchCacheKey('dog', searchTerm);
          breedSearchCache.set(cacheKey, filteredBreeds);
          console.log('🐕 Cached', filteredBreeds.length, 'filtered dog breeds for:', searchTerm);
        }
        
        // Always cache the full list
        breedSearchCache.set('dog_all', breeds);
        
        console.log('🐕 Returning', filteredBreeds.length, 'formatted dog breeds');
        return filteredBreeds;
      }
    }
    
    // Fallback to dog.ceo API if The Dog API fails
    console.log('🐕 Falling back to dog.ceo API...');
    response = await fetch('https://dog.ceo/api/breeds/list/all');
    data = await response.json();
    
    if (data.status === 'success') {
      const breeds = Object.keys(data.message);
      console.log('🐕 Dog breeds API response (fallback):', data);
      console.log('🐕 Fetched', breeds.length, 'dog breeds from fallback API');
      console.log('🐕 Sample breed names:', breeds.slice(0, 10));
      
      // Log all breeds that contain "bull" for debugging
      const bullBreeds = breeds.filter(breed => breed.toLowerCase().includes('bull'));
      console.log('🐕 All breeds containing "bull" (fallback):', bullBreeds);
      
      // Filter breeds if search term provided
      let filteredBreeds = breeds;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        console.log('🐕 Searching for breed:', searchTerm, 'normalized to:', lowerSearchTerm);
        
        filteredBreeds = breeds.filter(breed => {
          const normalizedBreed = breed.toLowerCase();
          
          // Simple but effective matching: check if search term is contained in breed name
          // This will find "frenchbulldog" when searching for "bull"
          const matches = normalizedBreed.includes(lowerSearchTerm);
          
          if (matches) {
            console.log('🐕 Found match:', breed, 'for search term:', searchTerm);
          }
          
          return matches;
        });
        
        console.log('🐕 Filtered breeds:', filteredBreeds);
        
        // Cache the filtered results
        const cacheKey = getBreedSearchCacheKey('dog', searchTerm);
        breedSearchCache.set(cacheKey, filteredBreeds);
        console.log('🐕 Cached', filteredBreeds.length, 'filtered dog breeds for:', searchTerm);
      }
      
      // Always cache the full list
      breedSearchCache.set('dog_all', breeds);
      
      console.log('🐕 Returning', filteredBreeds.length, 'formatted dog breeds');
      return filteredBreeds;
    } else {
      throw new Error('Failed to fetch dog breeds from both APIs');
    }
  } catch (error) {
    console.error('❌ Error fetching dog breeds:', error);
    
    // Try to return cached results if available
    if (searchTerm) {
      const cacheKey = getBreedSearchCacheKey('dog', searchTerm);
      const cached = breedSearchCache.get(cacheKey);
      if (cached) {
        console.log('🐕 Returning cached results due to error:', cached);
        return cached;
      }
    }
    return [];
  }
}, 150); // 150ms debounce for more responsive search

/**
 * Fetch cat breeds with caching and debouncing
 */
export const fetchCatBreeds = debounce(async (searchTerm?: string): Promise<string[]> => {
  // Check cache first
  if (searchTerm) {
    const cacheKey = getBreedSearchCacheKey('cat', searchTerm);
    if (breedSearchCache.has(cacheKey)) {
      console.log('🐱 Using cached cat breeds for:', searchTerm);
      return breedSearchCache.get(cacheKey)!;
    }
    
    // Only search if we have enough characters
    if (!shouldSearchBreed(searchTerm)) {
      console.log('🐱 Search term too short, returning empty array');
      return [];
    }
  }

  try {
    console.log('🐱 Fetching cat breeds from API...');
    const response = await fetch('https://api.thecatapi.com/v1/breeds');
    const data = await response.json();
    
    if (Array.isArray(data)) {
      const breeds = data.map((breed: any) => breed.name);
      console.log('🐱 Cat breeds API response:', data);
      console.log('🐱 Fetched', breeds.length, 'cat breeds from API');
      
      // Filter breeds if search term provided
      let filteredBreeds = breeds;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        filteredBreeds = breeds.filter(breed => 
          breed.toLowerCase().includes(lowerSearchTerm)
        );
        
        // Cache the filtered results
        const cacheKey = getBreedSearchCacheKey('cat', searchTerm);
        breedSearchCache.set(cacheKey, filteredBreeds);
        console.log('🐱 Cached', filteredBreeds.length, 'filtered cat breeds for:', searchTerm);
      }
      
      // Always cache the full list
      breedSearchCache.set('cat_all', breeds);
      
      console.log('🐱 Returning', filteredBreeds.length, 'formatted cat breeds');
      return filteredBreeds;
    } else {
      throw new Error('Failed to fetch cat breeds');
    }
  } catch (error) {
    console.error('❌ Error fetching cat breeds:', error);
    // Return cached results if available
    if (searchTerm) {
      const cacheKey = getBreedSearchCacheKey('cat', searchTerm);
      const cached = breedSearchCache.get(cacheKey);
      if (cached) {
        console.log('🐱 Returning cached cat breeds due to error');
        return cached;
      }
    }
    return [];
  }
}, 150); // 150ms debounce

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