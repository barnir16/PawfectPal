// Vaccination Types for PawfectPal

export interface Vaccination {
  id?: number;
  petId: number;
  vaccineName: string;
  dateAdministered: string; // ISO date string
  nextDueDate?: string; // ISO date string
  batchNumber?: string;
  manufacturer?: string;
  veterinarian: string;
  clinic: string;
  doseNumber?: number;
  notes?: string;
  isCompleted: boolean;
  reminderSent: boolean;
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

export interface VaccinationCreate {
  petId: number;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate?: string;
  batchNumber?: string;
  manufacturer?: string;
  veterinarian: string;
  clinic: string;
  doseNumber?: number;
  notes?: string;
  isCompleted?: boolean;
  reminderSent?: boolean;
}

export interface VaccinationUpdate {
  vaccineName: string;
  dateAdministered: string;
  nextDueDate?: string;
  batchNumber?: string;
  manufacturer?: string;
  veterinarian: string;
  clinic: string;
  doseNumber?: number;
  notes?: string;
  isCompleted: boolean;
  reminderSent: boolean;
}

export interface VaccinationListResponse {
  vaccinations: Vaccination[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VaccinationSummary {
  petId: number;
  totalVaccinations: number;
  upToDate: boolean;
  nextDueDate?: string; // ISO date string
  overdueCount: number;
  completedSeries: string[];
}

export interface VaccinationReminder {
  vaccinationId: number;
  petId: number;
  petName: string;
  vaccineName: string;
  dueDate: string; // ISO date string
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface VaccinationFilters {
  vaccineName?: string;
  dateFrom?: string;
  dateTo?: string;
  veterinarian?: string;
  clinic?: string;
  isCompleted?: boolean;
  isOverdue?: boolean;
  page?: number;
  pageSize?: number;
}

// Common vaccine schedules
export interface VaccineScheduleItem {
  name: string;
  ageWeeks: number[];
  boosterInterval?: number; // months
  required: boolean;
  description?: string;
}

export interface VaccineSchedule {
  petType: 'dog' | 'cat' | 'other';
  vaccines: VaccineScheduleItem[];
}

// Standard vaccination schedules
export const DOG_VACCINE_SCHEDULE: VaccineSchedule = {
  petType: 'dog',
  vaccines: [
    {
      name: 'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
      ageWeeks: [6, 9, 12, 16],
      boosterInterval: 12,
      required: true,
      description: 'Core vaccine series for puppies'
    },
    {
      name: 'Rabies',
      ageWeeks: [12],
      boosterInterval: 12,
      required: true,
      description: 'Required by law in most areas'
    },
    {
      name: 'Bordetella',
      ageWeeks: [8, 12],
      boosterInterval: 12,
      required: false,
      description: 'Kennel cough prevention'
    }
  ]
};

export const CAT_VACCINE_SCHEDULE: VaccineSchedule = {
  petType: 'cat',
  vaccines: [
    {
      name: 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)',
      ageWeeks: [6, 9, 12, 16],
      boosterInterval: 12,
      required: true,
      description: 'Core vaccine series for kittens'
    },
    {
      name: 'Rabies',
      ageWeeks: [12],
      boosterInterval: 12,
      required: true,
      description: 'Required by law in most areas'
    },
    {
      name: 'FeLV (Feline Leukemia)',
      ageWeeks: [8, 12],
      boosterInterval: 12,
      required: false,
      description: 'For outdoor cats'
    }
  ]
};

