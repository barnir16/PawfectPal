import { apiRequest } from '../api';
import type { Vaccine, AgeRestriction } from '../../types/vaccines';

/**
 * Get all vaccines
 */
export const getVaccines = async (): Promise<Vaccine[]> => {
  return apiRequest<Vaccine[]>('/vaccines');
};

/**
 * Create a new vaccine record
 */
export const createVaccine = async (vaccine: Omit<Vaccine, 'id'>): Promise<Vaccine> => {
  return apiRequest<Vaccine>('/vaccines', {
    method: 'POST',
    body: JSON.stringify(vaccine)
  });
};

/**
 * Get all age restrictions for vaccines
 */
export const getAgeRestrictions = async (): Promise<AgeRestriction[]> => {
  return apiRequest<AgeRestriction[]>('/vaccines/age-restrictions');
};

/**
 * Create a new age restriction
 */
export const createAgeRestriction = async (
  restriction: AgeRestriction
): Promise<AgeRestriction> => {
  return apiRequest<AgeRestriction>('/vaccines/age-restrictions', {
    method: 'POST',
    body: JSON.stringify(restriction)
  });
};
