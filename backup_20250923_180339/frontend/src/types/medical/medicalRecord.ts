// Medical Record Types for PawfectPal

export type MedicalRecordType = 
  | 'vaccination' 
  | 'checkup' 
  | 'surgery' 
  | 'illness' 
  | 'injury' 
  | 'medication' 
  | 'other';

export interface MedicalRecord {
  id?: number;
  petId: number;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  date: string; // ISO date string
  veterinarian?: string;
  clinic?: string;
  followUpDate?: string; // ISO date string
  attachments?: string[]; // URLs to documents/images
  notes?: string;
  isCompleted: boolean;
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

export interface MedicalRecordCreate {
  petId: number;
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  date: string;
  veterinarian?: string;
  clinic?: string;
  followUpDate?: string;
  attachments?: string;
  notes?: string;
  isCompleted?: boolean;
}

export interface MedicalRecordUpdate {
  recordType: MedicalRecordType;
  title: string;
  description?: string;
  date: string;
  veterinarian?: string;
  clinic?: string;
  followUpDate?: string;
  attachments?: string;
  notes?: string;
  isCompleted: boolean;
}

export interface MedicalRecordListResponse {
  records: MedicalRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MedicalRecordSummary {
  petId: number;
  totalRecords: number;
  recentCheckup?: string; // ISO date string
  nextFollowup?: string; // ISO date string
  vaccinationCount: number;
  surgeryCount: number;
}

export interface MedicalRecordFilters {
  recordType?: MedicalRecordType;
  dateFrom?: string;
  dateTo?: string;
  veterinarian?: string;
  clinic?: string;
  isCompleted?: boolean;
  page?: number;
  pageSize?: number;
}

