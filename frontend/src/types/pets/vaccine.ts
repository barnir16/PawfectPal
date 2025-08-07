/**
 * Represents age restrictions for vaccines
 */
export interface AgeRestriction {
  minWeeks?: number;
  maxYears?: number;
}

/**
 * Represents a vaccine record for a pet
 */
export interface Vaccine {
  id?: number;
  petId: number;
  name: string;
  description: string;
  manufacturer?: string;
  batchNumber?: string;
  administeredDate: string; // ISO date string
  expirationDate?: string;  // ISO date string
  administeringVet?: string;
  location?: string;
  nextDueDate?: string;     // ISO date string
  isBooster: boolean;
  boosterNumber?: number;
  sideEffects?: string[];
  notes?: string;
  createdAt?: string;       // ISO date string
  updatedAt?: string;       // ISO date string
  
  // Vaccine schedule information
  frequency?: string;
  firstDoseAge?: string;
  kittenSchedule?: string[];
  puppySchedule?: string[];
  ageRestriction?: AgeRestriction;
  commonTreatments?: string[];
  isRequired: boolean;
  
  // Metadata
  lastUpdated: string;     // ISO date string
}

/**
 * Represents a vaccine template for different species/breeds
 */
export interface VaccineTemplate {
  id: string;
  name: string;
  species: string[];
  description: string;
  frequency: string;
  firstDoseAge: string;
  isBoosterRequired: boolean;
  boosterFrequency?: string;
  isCoreVaccine: boolean;
  ageRestriction?: AgeRestriction;
  commonSideEffects?: string[];
  notes?: string;
}
