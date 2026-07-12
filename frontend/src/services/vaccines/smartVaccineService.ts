import { israeliVaccineSchemas, type VaccineSchema, type Vaccine } from '../../data/vaccines/israeliVaccines';
import type { Pet } from '../../types/pets/pet';

export interface VaccinationHistoryRecord {
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string | null;
  is_completed: boolean;
}

export interface VaccineSuggestion {
  vaccine: Vaccine;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  isOverdue: boolean;
  category: 'mandatory' | 'recommended' | 'preventative';
}

export interface SmartVaccineSchedule {
  petId: number;
  petName: string;
  petType: 'dog' | 'cat';
  petAge: number; // in weeks
  suggestions: VaccineSuggestion[];
  nextDueDate?: Date;
  overdueCount: number;
  upcomingCount: number;
}

export class SmartVaccineService {
  /**
   * Get smart vaccine suggestions for a pet based on local guidance and the pet's recorded history.
   */
  static getVaccineSuggestions(
    pet: Pet,
    vaccinationHistory: VaccinationHistoryRecord[] = []
  ): VaccineSuggestion[] {
    const suggestions: VaccineSuggestion[] = [];
    const petAgeWeeks = this.calculatePetAgeInWeeks(pet);
    const vaccineSchema = this.getVaccineSchemaForPet(pet, petAgeWeeks);

    if (!vaccineSchema) {
      return suggestions;
    }

    vaccineSchema.mandatory.forEach(vaccine => {
      const suggestion = this.createVaccineSuggestion(
        vaccine, 
        pet,
        vaccinationHistory,
        'mandatory', 
        'high', 
        petAgeWeeks
      );
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    vaccineSchema.recommended.forEach(vaccine => {
      const suggestion = this.createVaccineSuggestion(
        vaccine, 
        pet,
        vaccinationHistory,
        'recommended', 
        'medium', 
        petAgeWeeks
      );
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    vaccineSchema.preventative_treatments.forEach(treatment => {
      const suggestion = this.createPreventativeSuggestion(
        treatment, 
        'preventative', 
        'low', 
        'Preventive care for long-term health',
        petAgeWeeks
      );
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });
    
    return suggestions.sort((a, b) => {
      // Sort by priority: high > medium > low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Get vaccine schema based on pet type and age
   */
  private static getVaccineSchemaForPet(pet: Pet, ageWeeks: number): VaccineSchema | null {
    const isPuppy = pet.type === 'dog' && ageWeeks > 0 && ageWeeks <= 16;
    const isKitten = pet.type === 'cat' && ageWeeks > 0 && ageWeeks <= 16;

    if (isPuppy) {
      return israeliVaccineSchemas.puppies;
    } else if (isKitten) {
      return israeliVaccineSchemas.kittens;
    } else if (pet.type === 'dog') {
      return israeliVaccineSchemas.adultDogs;
    } else if (pet.type === 'cat') {
      return israeliVaccineSchemas.adultCats;
    }
    
    return null;
  }
  
  /**
   * Calculate pet age in weeks
   */
  private static calculatePetAgeInWeeks(pet: Pet): number {
    if (pet.birthDate) {
      const birthDate = new Date(pet.birthDate);
      const now = new Date();

      if (birthDate > now) {
        return 0;
      }

      const diffTime = now.getTime() - birthDate.getTime();
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      return Math.max(0, diffWeeks);
    }

    if (typeof pet.age === 'number' && Number.isFinite(pet.age) && pet.age > 0) {
      return Math.floor(pet.age * 52);
    }

    return 0;
  }

  private static createVaccineSuggestion(
    vaccine: Vaccine, 
    pet: Pet,
    vaccinationHistory: VaccinationHistoryRecord[],
    category: 'mandatory' | 'recommended', 
    priority: 'high' | 'medium' | 'low',
    petAgeWeeks: number
  ): VaccineSuggestion | null {
    if (!vaccine.age_restriction) {
      console.warn('Vaccine missing age_restriction:', vaccine.name);
      return null;
    }

    if (petAgeWeeks < vaccine.age_restriction.min_weeks) {
      return null;
    }

    if (vaccine.age_restriction.max_years !== null) {
      const maxWeeks = vaccine.age_restriction.max_years * 52;
      if (petAgeWeeks > maxWeeks) {
        return null;
      }
    }

    const matchingRecord = this.getMostRelevantHistoryRecord(vaccine, vaccinationHistory);
    const nextDueDate = this.resolveDueDate(vaccine, pet, matchingRecord);
    const reason = this.getVaccineReason(vaccine, pet, category, matchingRecord);

    return {
      vaccine,
      reason,
      priority,
      dueDate: nextDueDate,
      isOverdue: nextDueDate ? nextDueDate < new Date() : false,
      category
    };
  }

  private static createPreventativeSuggestion(
    treatment: any, 
    category: 'preventative', 
    priority: 'low', 
    reason: string,
    _petAgeWeeks: number
  ): VaccineSuggestion | null {
    // For now, treat preventative treatments like vaccines
    // In the future, this could be more sophisticated
    return {
      vaccine: {
        name: treatment.name,
        frequency: treatment.frequency,
        description: treatment.description,
        side_effects: [],
        age_restriction: { min_weeks: 0, max_years: null },
        last_updated: treatment.last_updated
      },
      reason,
      priority,
      dueDate: this.calculateNextDueDate(treatment.frequency),
      isOverdue: false,
      category
    };
  }

  private static getMostRelevantHistoryRecord(
    vaccine: Vaccine,
    vaccinationHistory: VaccinationHistoryRecord[]
  ): VaccinationHistoryRecord | undefined {
    const normalizedVaccineName = this.normalizeVaccineName(vaccine.name);
    const matchingRecords = vaccinationHistory
      .filter((record) =>
        this.normalizeVaccineName(record.vaccine_name) === normalizedVaccineName
      )
      .sort(
        (a, b) =>
          new Date(b.date_administered).getTime() -
          new Date(a.date_administered).getTime()
      );

    return matchingRecords[0];
  }

  private static resolveDueDate(
    vaccine: Vaccine,
    pet: Pet,
    matchingRecord?: VaccinationHistoryRecord
  ): Date | undefined {
    if (matchingRecord?.next_due_date) {
      return new Date(matchingRecord.next_due_date);
    }

    if (matchingRecord?.is_completed && matchingRecord.date_administered) {
      const administeredDate = new Date(matchingRecord.date_administered);
      return this.addFrequencyToDate(administeredDate, vaccine.frequency);
    }

    const firstDoseWeeks = this.parseAgeToWeeks(vaccine.first_dose_age);
    if (pet.birthDate && firstDoseWeeks !== undefined) {
      const dueDate = new Date(pet.birthDate);
      dueDate.setDate(dueDate.getDate() + firstDoseWeeks * 7);
      return dueDate;
    }

    return undefined;
  }

  private static getVaccineReason(
    vaccine: Vaccine,
    pet: Pet,
    category: 'mandatory' | 'recommended',
    matchingRecord?: VaccinationHistoryRecord
  ): string {
    if (matchingRecord?.next_due_date) {
      return 'Based on a recorded vaccination entry for this pet.';
    }

    if (matchingRecord?.is_completed) {
      return 'Based on the last recorded dose and the typical booster interval.';
    }

    const normalizedName = this.normalizeVaccineName(vaccine.name);

    if (pet.type === 'dog' && normalizedName === this.normalizeVaccineName('Rabies')) {
      return 'Required for dogs under local rabies regulations and municipal licensing workflows.';
    }

    if (category === 'mandatory') {
      return 'Core protection commonly recommended for pets of this type and age.';
    }

    return 'Recommended according to common risk-based preventive care guidance. Confirm with your veterinarian.';
  }

  private static addFrequencyToDate(baseDate: Date, frequency: string): Date | undefined {
    const now = new Date(baseDate);
    const normalizedFrequency = frequency.toLowerCase();

    if (normalizedFrequency.includes('3 weeks')) {
      now.setDate(now.getDate() + 21);
      return now;
    }

    if (normalizedFrequency.includes('2 weeks')) {
      now.setDate(now.getDate() + 14);
      return now;
    }

    if (normalizedFrequency.includes('6 months')) {
      now.setMonth(now.getMonth() + 6);
      return now;
    }

    if (normalizedFrequency.includes('3 months')) {
      now.setMonth(now.getMonth() + 3);
      return now;
    }

    if (normalizedFrequency.includes('monthly') || normalizedFrequency.includes('1 month') || normalizedFrequency.includes('month')) {
      now.setMonth(now.getMonth() + 1);
      return now;
    }

    if (normalizedFrequency.includes('2 year')) {
      now.setFullYear(now.getFullYear() + 2);
      return now;
    }

    if (normalizedFrequency.includes('annual') || normalizedFrequency.includes('yearly') || normalizedFrequency.includes('1 year') || normalizedFrequency.includes('year')) {
      now.setFullYear(now.getFullYear() + 1);
      return now;
    }

    return undefined;
  }

  private static calculateNextDueDate(frequency: string): Date | undefined {
    return this.addFrequencyToDate(new Date(), frequency);
  }

  private static parseAgeToWeeks(ageLabel?: string): number | undefined {
    if (!ageLabel) {
      return undefined;
    }

    const normalized = ageLabel.trim().toLowerCase();
    const match = normalized.match(/(\d+(?:\.\d+)?)/);
    if (!match) {
      return undefined;
    }

    const value = Number.parseFloat(match[1]);
    if (normalized.includes('month')) {
      return Math.round(value * 4.345);
    }

    if (normalized.includes('year')) {
      return Math.round(value * 52);
    }

    return Math.round(value);
  }

  private static normalizeVaccineName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  static getVaccineSchedule(
    pet: Pet,
    vaccinationHistory: VaccinationHistoryRecord[] = []
  ): SmartVaccineSchedule {
    const suggestions = this.getVaccineSuggestions(pet, vaccinationHistory);
    const petAgeWeeks = this.calculatePetAgeInWeeks(pet);
    
    const overdueCount = suggestions.filter(s => s.isOverdue).length;
    const upcomingCount = suggestions.filter(s => !s.isOverdue && s.dueDate).length;
    
    // Find next due date
    const nextDueDate = suggestions
      .filter(s => s.dueDate && !s.isOverdue)
      .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))[0]?.dueDate;
    
    return {
      petId: pet.id || 0,
      petName: pet.name,
      petType: pet.type as 'dog' | 'cat',
      petAge: petAgeWeeks,
      suggestions,
      nextDueDate,
      overdueCount,
      upcomingCount
    };
  }
  
  /**
   * Get vaccine suggestions for all pets
   */
  static getVaccineSuggestionsForAllPets(
    pets: Pet[],
    vaccinationHistoryByPet: Record<number, VaccinationHistoryRecord[]> = {}
  ): SmartVaccineSchedule[] {
    return pets.map((pet) => this.getVaccineSchedule(pet, vaccinationHistoryByPet[pet.id] || []));
  }
  
  /**
   * Get overdue vaccines across all pets
   */
  static getOverdueVaccines(
    pets: Pet[],
    vaccinationHistoryByPet: Record<number, VaccinationHistoryRecord[]> = {}
  ): VaccineSuggestion[] {
    const allSuggestions: VaccineSuggestion[] = [];
    
    pets.forEach(pet => {
      const suggestions = this.getVaccineSuggestions(pet, vaccinationHistoryByPet[pet.id] || []);
      const overdueSuggestions = suggestions.filter(s => s.isOverdue);
      allSuggestions.push(...overdueSuggestions);
    });
    
    return allSuggestions.sort((a, b) => {
      // Sort by priority and then by due date
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by due date (most overdue first)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      
      return 0;
    });
  }
  
  /**
   * Get upcoming vaccines across all pets
   */
  static getUpcomingVaccines(
    pets: Pet[],
    daysAhead: number = 30,
    vaccinationHistoryByPet: Record<number, VaccinationHistoryRecord[]> = {}
  ): VaccineSuggestion[] {
    const allSuggestions: VaccineSuggestion[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    pets.forEach(pet => {
      const suggestions = this.getVaccineSuggestions(pet, vaccinationHistoryByPet[pet.id] || []);
      const upcomingSuggestions = suggestions.filter(s => 
        s.dueDate && 
        !s.isOverdue && 
        s.dueDate <= cutoffDate
      );
      allSuggestions.push(...upcomingSuggestions);
    });
    
    return allSuggestions.sort((a, b) => {
      // Sort by due date (earliest first)
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });
  }
}

export default SmartVaccineService;
