import { apiRequest } from '../api';
import type { Vaccine, AgeRestriction, VaccinationSchedule } from '../../types/vaccines';

/**
 * Get all vaccines
 */
export const getVaccines = async (): Promise<Vaccine[]> => {
  return apiRequest<Vaccine[]>('/vaccines');
};

/**
 * Get a single vaccine by ID
 */
export const getVaccine = async (vaccineId: number): Promise<Vaccine> => {
  return apiRequest<Vaccine>(`/vaccines/${vaccineId}`);
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
 * Update an existing vaccine
 */
export const updateVaccine = async (
  vaccineId: number, 
  updates: Partial<Vaccine>
): Promise<Vaccine> => {
  return apiRequest<Vaccine>(`/vaccines/${vaccineId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
};

/**
 * Delete a vaccine
 */
export const deleteVaccine = async (vaccineId: number): Promise<void> => {
  return apiRequest(`/vaccines/${vaccineId}`, {
    method: 'DELETE'
  });
};

/**
 * Get all age restrictions for vaccines
 */
export const getAgeRestrictions = async (): Promise<AgeRestriction[]> => {
  return apiRequest<AgeRestriction[]>('/vaccines/age-restrictions');
};

/**
 * Get a single age restriction by ID
 */
export const getAgeRestriction = async (restrictionId: number): Promise<AgeRestriction> => {
  return apiRequest<AgeRestriction>(`/vaccines/age-restrictions/${restrictionId}`);
};

/**
 * Create a new age restriction
 */
export const createAgeRestriction = async (
  restriction: Omit<AgeRestriction, 'id'>
): Promise<AgeRestriction> => {
  return apiRequest<AgeRestriction>('/vaccines/age-restrictions', {
    method: 'POST',
    body: JSON.stringify(restriction)
  });
};

/**
 * Update an age restriction
 */
export const updateAgeRestriction = async (
  restrictionId: number,
  updates: Partial<AgeRestriction>
): Promise<AgeRestriction> => {
  return apiRequest<AgeRestriction>(`/vaccines/age-restrictions/${restrictionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
};

/**
 * Delete an age restriction
 */
export const deleteAgeRestriction = async (restrictionId: number): Promise<void> => {
  return apiRequest(`/vaccines/age-restrictions/${restrictionId}`, {
    method: 'DELETE'
  });
};

/**
 * Get vaccine schedule for a pet
 */
export const getPetVaccineSchedule = async (petId: number): Promise<VaccinationSchedule[]> => {
  return apiRequest<VaccinationSchedule[]>(`/pets/${petId}/vaccine-schedule`);
};

/**
 * Record a vaccine administration
 */
export const recordVaccineAdministration = async (
  petId: number,
  vaccineId: number,
  data: {
    administeredAt: string;
    nextDueDate?: string;
    veterinarian?: string;
    notes?: string;
  }
): Promise<VaccinationSchedule> => {
  return apiRequest<VaccinationSchedule>(`/pets/${petId}/vaccinations`, {
    method: 'POST',
    body: JSON.stringify({
      vaccine_id: vaccineId,
      ...data
    })
  });
};

/**
 * Update a vaccine administration record
 */
export const updateVaccineAdministration = async (
  petId: number,
  administrationId: number,
  updates: {
    administeredAt?: string;
    nextDueDate?: string | null;
    veterinarian?: string;
    notes?: string;
  }
): Promise<VaccinationSchedule> => {
  return apiRequest<VaccinationSchedule>(`/pets/${petId}/vaccinations/${administrationId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
};

/**
 * Delete a vaccine administration record
 */
export const deleteVaccineAdministration = async (
  petId: number,
  administrationId: number
): Promise<void> => {
  return apiRequest(`/pets/${petId}/vaccinations/${administrationId}`, {
    method: 'DELETE'
  });
};

/**
 * Get upcoming vaccinations for a pet
 */
export const getUpcomingVaccinations = async (
  petId: number,
  daysAhead: number = 30
): Promise<VaccinationSchedule[]> => {
  return apiRequest<VaccinationSchedule[]>(
    `/pets/${petId}/vaccinations/upcoming?days=${daysAhead}`
  );
};

/**
 * Get overdue vaccinations for a pet
 */
export const getOverdueVaccinations = async (petId: number): Promise<VaccinationSchedule[]> => {
  return apiRequest<VaccinationSchedule[]>(
    `/pets/${petId}/vaccinations/overdue`
  );
};
