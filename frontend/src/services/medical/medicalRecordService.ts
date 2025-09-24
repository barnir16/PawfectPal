import { apiRequest } from '../api';
import type { 
  MedicalRecord, 
  MedicalRecordCreate, 
  MedicalRecordUpdate,
  MedicalRecordListResponse,
  MedicalRecordSummary,
  MedicalRecordFilters
} from '../../types/medical/medicalRecord';

/**
 * Transform frontend data to backend format
 */
const transformToBackend = (record: MedicalRecordCreate | MedicalRecordUpdate) => {
  return {
    record_type: record.recordType,
    title: record.title,
    description: record.description,
    date: record.date,
    veterinarian: record.veterinarian,
    clinic: record.clinic,
    follow_up_date: record.followUpDate,
    attachments: record.attachments,
    notes: record.notes,
    is_completed: record.isCompleted ?? true,
    ...(('petId' in record) && { pet_id: record.petId })
  };
};

/**
 * Transform backend data to frontend format
 */
const transformFromBackend = (record: any): MedicalRecord => {
  return {
    id: record.id,
    petId: record.pet_id,
    recordType: record.record_type,
    title: record.title,
    description: record.description,
    date: record.date,
    veterinarian: record.veterinarian,
    clinic: record.clinic,
    followUpDate: record.follow_up_date,
    attachments: record.attachments ? JSON.parse(record.attachments) : [],
    notes: record.notes,
    isCompleted: record.is_completed,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
};

/**
 * Get medical records for a specific pet
 */
export const getPetMedicalRecords = async (
  petId: number, 
  filters: MedicalRecordFilters = {}
): Promise<MedicalRecordListResponse> => {
  const searchParams = new URLSearchParams();
  
  if (filters.page) searchParams.append('page', filters.page.toString());
  if (filters.pageSize) searchParams.append('page_size', filters.pageSize.toString());
  if (filters.recordType) searchParams.append('record_type', filters.recordType);
  
  const query = searchParams.toString();
  const url = `/medical-records/pet/${petId}${query ? `?${query}` : ''}`;
  
  const response = await apiRequest<any>(url);
  
  return {
    records: response.records.map(transformFromBackend),
    total: response.total,
    page: response.page,
    pageSize: response.page_size,
  };
};

/**
 * Create a new medical record
 */
export const createMedicalRecord = async (
  petId: number,
  record: MedicalRecordCreate
): Promise<MedicalRecord> => {
  const backendRecord = transformToBackend(record);
  const response = await apiRequest<any>(`/medical-records/pet/${petId}/`, {
    method: 'POST',
    body: JSON.stringify(backendRecord)
  });
  
  return transformFromBackend(response);
};

/**
 * Update an existing medical record
 */
export const updateMedicalRecord = async (
  recordId: number,
  record: MedicalRecordUpdate
): Promise<MedicalRecord> => {
  const backendRecord = transformToBackend(record);
  const response = await apiRequest<any>(`/medical-records/${recordId}/`, {
    method: 'PUT',
    body: JSON.stringify(backendRecord)
  });
  
  return transformFromBackend(response);
};

/**
 * Delete a medical record
 */
export const deleteMedicalRecord = async (recordId: number): Promise<void> => {
  await apiRequest(`/medical-records/${recordId}/`, {
    method: 'DELETE'
  });
};

/**
 * Get medical record summary for a pet
 */
export const getPetMedicalSummary = async (petId: number): Promise<MedicalRecordSummary> => {
  const response = await apiRequest<any>(`/medical-records/pet/${petId}/summary/`);
  
  return {
    petId: response.pet_id,
    totalRecords: response.total_records,
    recentCheckup: response.recent_checkup,
    nextFollowup: response.next_followup,
    vaccinationCount: response.vaccination_count,
    surgeryCount: response.surgery_count,
  };
};

/**
 * Get upcoming medical events (follow-ups, checkups)
 */
export const getUpcomingMedicalEvents = async (petId?: number): Promise<MedicalRecord[]> => {
  // This would be implemented as a separate endpoint in the future
  // For now, we can filter from the existing records
  const today = new Date().toISOString().split('T')[0];
  
  if (petId) {
    const { records } = await getPetMedicalRecords(petId);
    return records.filter(record => 
      record.followUpDate && record.followUpDate > today
    );
  }
  
  // Return empty array for now - would need a cross-pet endpoint
  return [];
};

