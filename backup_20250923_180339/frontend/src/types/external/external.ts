/**
 * Represents a response from a dog breed information API
 */
export interface BreedInfoResponse {
  /**
   * The name of the breed
   */
  name: string;
  
  /**
   * Alternative names or spellings for the breed
   */
  alt_names?: string[];
  
  /**
   * The origin country of the breed
   */
  origin?: string;
  
  /**
   * The breed group/category
   */
  group?: string;
  
  /**
   * Brief description of the breed
   */
  description?: string;
  
  /**
   * General temperament and personality traits
   */
  temperament?: string[];
  
  /**
   * Physical characteristics
   */
  physical_attributes?: {
    life_span?: string;
    weight?: {
      imperial: string; // e.g., "50 - 75"
      metric: string;   // e.g., "23 - 34"
    };
    height?: {
      imperial: string; // e.g., "22 - 25"
      metric: string;   // e.g., "56 - 64"
    };
    coat?: string[];    // e.g., ["Short", "Smooth"]
    colors?: string[];
    patterns?: string[];
  };
  
  /**
   * Health information
   */
  health?: {
    common_health_issues?: string[];
    life_expectancy?: string;
    grooming_needs?: string;
    shedding_level?: number; // 1-5 scale
    energy_level?: number;   // 1-5 scale
    exercise_needs?: number; // 1-5 scale
    trainability?: number;   // 1-5 scale
  };
  
  /**
   * Suitability for different living situations
   */
  suitability?: {
    apartment?: number;      // 1-5 scale
    family?: number;         // 1-5 scale
    children?: number;       // 1-5 scale
    other_pets?: number;     // 1-5 scale
    stranger_friendly?: number; // 1-5 scale
    watchdog?: number;       // 1-5 scale
    guard_dog?: number;      // 1-5 scale
    playfulness?: number;    // 1-5 scale
  };
  
  /**
   * Image URLs for the breed
   */
  images?: {
    url: string;
    width: number;
    height: number;
  }[];
  
  /**
   * External references
   */
  reference_image_id?: string;
  wikipedia_url?: string;
  cfa_url?: string;
  vcahospitals_url?: string;
  vetstreet_url?: string;
  
  /**
   * Additional metadata
   */
  metadata?: {
    source: string;
    last_updated: string; // ISO date string
    api_version?: string;
  };
}

/**
 * Represents a response from a cat breed information API
 */
export interface CatBreedInfoResponse {
  /**
   * The name of the breed
   */
  name: string;
  
  /**
   * Alternative names or spellings for the breed
   */
  alt_names?: string[];
  
  /**
   * The origin country of the breed
   */
  origin?: string;
  
  /**
   * The breed group/category
   */
  breed_group?: string;
  
  /**
   * Brief description of the breed
   */
  description?: string;
  
  /**
   * General temperament and personality traits
   */
  temperament?: string[];
  
  /**
   * Physical characteristics
   */
  physical_attributes?: {
    life_span?: string;
    weight?: {
      imperial: string; // e.g., "7 - 12"
      metric: string;   // e.g., "3 - 5"
    };
    height?: {
      imperial: string; // e.g., "9 - 11"
      metric: string;   // e.g., "23 - 28"
    };
    length?: {
      imperial: string;
      metric: string;
    };
    coat?: string;      // e.g., "Short", "Medium", "Long"
    coat_patterns?: string[];
    colors?: string[];
  };
  
  /**
   * Health information
   */
  health?: {
    common_health_issues?: string[];
    life_expectancy?: string;
    grooming_needs?: string;
    shedding_level?: number; // 1-5 scale
    energy_level?: number;   // 1-5 scale
    intelligence?: number;   // 1-5 scale
    vocalization?: number;   // 1-5 scale
    affection_level?: number; // 1-5 scale
    social_needs?: number;   // 1-5 scale
    stranger_friendly?: number; // 1-5 scale
  };
  
  /**
   * Suitability for different living situations
   */
  suitability?: {
    apartment?: number;      // 1-5 scale
    family?: number;         // 1-5 scale
    children?: number;       // 1-5 scale
    other_pets?: number;     // 1-5 scale
    dog_friendly?: number;   // 1-5 scale
  };
  
  /**
   * Image URLs for the breed
   */
  images?: {
    id: string;
    url: string;
    width: number;
    height: number;
  }[];
  
  /**
   * External references
   */
  reference_image_id?: string;
  wikipedia_url?: string;
  cfa_url?: string;
  vcahospitals_url?: string;
  vetstreet_url?: string;
  
  /**
   * Additional metadata
   */
  metadata?: {
    source: string;
    last_updated: string; // ISO date string
    api_version?: string;
  };
}

/**
 * Represents an error from an external API
 */
export interface ExternalApiError {
  /**
   * HTTP status code
   */
  status: number;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code from the external API
   */
  code?: string | number;
  
  /**
   * Additional error details
   */
  details?: Record<string, any>;
  
  /**
   * Timestamp of when the error occurred
   */
  timestamp?: string; // ISO date string
  
  /**
   * The API endpoint that was called
   */
  endpoint?: string;
  
  /**
   * The request parameters that were sent
   */
  request_params?: Record<string, any>;
  
  /**
   * The response headers from the API
   */
  response_headers?: Record<string, string>;
  
  /**
   * The raw response from the API
   */
  raw_response?: any;
}
