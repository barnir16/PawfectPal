import { apiRequest } from '../api';
import type { 
  BreedInfoResponse, 
  CatBreedInfoResponse 
} from '../../types/external';

/**
 * Get dog breed information from an external API
 */
export const getDogBreedInfo = async (
  breedName: string, 
  apiKey: string
): Promise<BreedInfoResponse> => {
  return apiRequest<BreedInfoResponse>(
    `/external/breeds/dog/${encodeURIComponent(breedName)}`,
    {
      headers: {
        'X-API-Key': apiKey
      }
    }
  );
};

/**
 * Get cat breed information from an external API
 */
export const getCatBreedInfo = async (
  breedName: string, 
  apiKey: string
): Promise<CatBreedInfoResponse> => {
  return apiRequest<CatBreedInfoResponse>(
    `/external/breeds/cat/${encodeURIComponent(breedName)}`,
    {
      headers: {
        'X-API-Key': apiKey
      }
    }
  );
};
