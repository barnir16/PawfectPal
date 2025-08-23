import { apiRequest } from '../api';
import type { 
  Vaccination, 
  VaccinationCreate, 
  VaccinationUpdate,
  VaccinationListResponse,
  VaccinationSummary,
  VaccinationReminder,
  VaccinationFilters
} from '../../types/medical/vaccination';

/**
 * Transform frontend data to backend format
 */
const transformToBackend = (vaccination: VaccinationCreate | VaccinationUpdate) => {
  return {
    vaccine_name: vaccination.vaccineName,
    date_administered: vaccination.dateAdministered,
    next_due_date: vaccination.nextDueDate,
    batch_number: vaccination.batchNumber,
    manufacturer: vaccination.manufacturer,
    veterinarian: vaccination.veterinarian,
    clinic: vaccination.clinic,
    dose_number: vaccination.doseNumber,
    notes: vaccination.notes,
    is_completed: vaccination.isCompleted ?? true,
    reminder_sent: vaccination.reminderSent ?? false,
    ...(('petId' in vaccination) && { pet_id: vaccination.petId })
  };
};

/**
 * Transform backend data to frontend format
 */
const transformFromBackend = (vaccination: any): Vaccination => {
  return {
    id: vaccination.id,
    petId: vaccination.pet_id,
    vaccineName: vaccination.vaccine_name,
    dateAdministered: vaccination.date_administered,
    nextDueDate: vaccination.next_due_date,
    batchNumber: vaccination.batch_number,
    manufacturer: vaccination.manufacturer,
    veterinarian: vaccination.veterinarian,
    clinic: vaccination.clinic,
    doseNumber: vaccination.dose_number,
    notes: vaccination.notes,
    isCompleted: vaccination.is_completed,
    reminderSent: vaccination.reminder_sent,
    createdAt: vaccination.created_at,
    updatedAt: vaccination.updated_at,
  };
};

/**
 * Get vaccinations for a specific pet
 */
export const getPetVaccinations = async (
  petId: number, 
  filters: VaccinationFilters = {}
): Promise<VaccinationListResponse> => {
  const searchParams = new URLSearchParams();
  
  if (filters.page) searchParams.append('page', filters.page.toString());
  if (filters.pageSize) searchParams.append('page_size', filters.pageSize.toString());
  
  const query = searchParams.toString();
  const url = `/vaccinations/pet/${petId}${query ? `?${query}` : ''}`;
  
  const response = await apiRequest<any>(url);
  
  return {
    vaccinations: response.vaccinations.map(transformFromBackend),
    total: response.total,
    page: response.page,
    pageSize: response.page_size,
  };
};

/**
 * Create a new vaccination record
 */
export const createVaccination = async (
  petId: number,
  vaccination: VaccinationCreate
): Promise<Vaccination> => {
  const backendVaccination = transformToBackend(vaccination);
  const response = await apiRequest<any>(`/vaccinations/pet/${petId}`, {
    method: 'POST',
    body: JSON.stringify(backendVaccination)
  });
  
  return transformFromBackend(response);
};

/**
 * Update an existing vaccination record
 */
export const updateVaccination = async (
  vaccinationId: number,
  vaccination: VaccinationUpdate
): Promise<Vaccination> => {
  const backendVaccination = transformToBackend(vaccination);
  const response = await apiRequest<any>(`/vaccinations/${vaccinationId}`, {
    method: 'PUT',
    body: JSON.stringify(backendVaccination)
  });
  
  return transformFromBackend(response);
};

/**
 * Delete a vaccination record
 */
export const deleteVaccination = async (vaccinationId: number): Promise<void> => {
  await apiRequest(`/vaccinations/${vaccinationId}`, {
    method: 'DELETE'
  });
};

/**
 * Get vaccination summary for a pet
 */
export const getPetVaccinationSummary = async (petId: number): Promise<VaccinationSummary> => {
  const response = await apiRequest<any>(`/vaccinations/pet/${petId}/summary`);
  
  return {
    petId: response.pet_id,
    totalVaccinations: response.total_vaccinations,
    upToDate: response.up_to_date,
    nextDueDate: response.next_due_date,
    overdueCount: response.overdue_count,
    completedSeries: response.completed_series,
  };
};

/**
 * Get vaccinations due soon
 */
export const getVaccinationsDueSoon = async (daysAhead: number = 30): Promise<VaccinationReminder[]> => {
  const response = await apiRequest<any>(`/vaccinations/due-soon?days_ahead=${daysAhead}`);
  
  return response.map((reminder: any) => ({
    vaccinationId: reminder.vaccination_id,
    petId: reminder.pet_id,
    petName: reminder.pet_name,
    vaccineName: reminder.vaccine_name,
    dueDate: reminder.due_date,
    daysUntilDue: reminder.days_until_due,
    isOverdue: reminder.is_overdue,
  }));
};

/**
 * Get overdue vaccinations
 */
export const getOverdueVaccinations = async (): Promise<VaccinationReminder[]> => {
  const response = await apiRequest<any>('/vaccinations/overdue');
  
  return response.map((reminder: any) => ({
    vaccinationId: reminder.vaccination_id,
    petId: reminder.pet_id,
    petName: reminder.pet_name,
    vaccineName: reminder.vaccine_name,
    dueDate: reminder.due_date,
    daysUntilDue: reminder.days_until_due,
    isOverdue: reminder.is_overdue,
  }));
};

/**
 * Calculate next vaccination due date based on schedule
 */
export const calculateNextDueDate = (
  lastVaccinationDate: string, 
  boosterIntervalMonths: number = 12
): string => {
  const lastDate = new Date(lastVaccinationDate);
  lastDate.setMonth(lastDate.getMonth() + boosterIntervalMonths);
  return lastDate.toISOString().split('T')[0];
};

