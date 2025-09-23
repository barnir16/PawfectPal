import type { Pet } from '../pets';

/**
 * Represents a vaccine record for a pet
 */
export interface Vaccine {
  id: number;
  pet_id: number;
  pet?: Pet; // Optional: Include full pet object if needed
  name: string;
  type: string;
  manufacturer?: string;
  lot_number?: string;
  serial_number?: string;
  administration_date: string; // ISO date string
  expiration_date?: string;     // ISO date string
  next_due_date?: string;       // ISO date string
  administered_by?: string;
  administering_veterinarian?: string;
  veterinarian_license?: string;
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  dosage?: string;
  dosage_unit?: string;
  route?: 'subcutaneous' | 'intramuscular' | 'intranasal' | 'oral' | 'topical' | 'other';
  site?: string;
  notes?: string;
  attachment_urls?: string[];
  is_booster: boolean;
  is_required: boolean;
  is_lifetime: boolean;
  is_approved: boolean;
  approved_by?: number;
  approved_at?: string; // ISO date string
  created_at: string;   // ISO date string
  updated_at: string;   // ISO date string
}

/**
 * Represents age-based vaccination restrictions
 */
export interface AgeRestriction {
  id: number;
  vaccine_type: string;
  species: string;
  min_age_weeks: number;
  max_age_weeks?: number;
  booster_frequency_weeks?: number;
  is_required: boolean;
  is_booster_required: boolean;
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Represents a vaccination schedule for a pet
 */
export interface VaccinationSchedule {
  id: number;
  pet_id: number;
  pet?: Pet; // Optional: Include full pet object if needed
  vaccine_type: string;
  status: 'pending' | 'administered' | 'overdue' | 'not_required';
  due_date: string; // ISO date string
  administered_date?: string; // ISO date string
  vaccine_record_id?: number;
  vaccine_record?: Vaccine; // Optional: Include full vaccine record if needed
  is_booster: boolean;
  is_required: boolean;
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Represents a vaccination reminder
 */
export interface VaccinationReminder {
  id: number;
  pet_id: number;
  vaccine_id: number;
  vaccine?: Vaccine; // Optional: Include full vaccine object if needed
  reminder_date: string; // ISO date string
  reminder_sent: boolean;
  reminder_sent_at?: string; // ISO date string
  reminder_methods: ('email' | 'push' | 'sms')[];
  notes?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Represents a vaccination certificate
 */
export interface VaccinationCertificate {
  id: number;
  pet_id: number;
  vaccine_id: number;
  certificate_number: string;
  issue_date: string; // ISO date string
  expiry_date?: string; // ISO date string
  issuing_veterinarian: string;
  issuing_clinic: string;
  clinic_license_number?: string;
  qr_code_url?: string;
  barcode_url?: string;
  digital_signature?: string;
  notes?: string;
  attachment_urls?: string[];
  is_verified: boolean;
  verified_by?: number;
  verified_at?: string; // ISO date string
  created_at: string;   // ISO date string
  updated_at: string;   // ISO date string
}

/**
 * Represents a vaccination history filter
 */
export interface VaccinationHistoryFilter {
  pet_id?: number;
  vaccine_type?: string;
  status?: 'pending' | 'administered' | 'overdue' | 'not_required';
  start_date?: string; // ISO date string
  end_date?: string;   // ISO date string
  is_booster?: boolean;
  is_required?: boolean;
  sort_by?: 'date' | 'vaccine_type' | 'status';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
