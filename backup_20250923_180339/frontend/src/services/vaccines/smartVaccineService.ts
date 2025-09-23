import { israeliVaccineSchemas, type VaccineSchema, type Vaccine } from '../../data/vaccines/israeliVaccines';
import type { Pet } from '../../types/pets/pet';

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
   * Get smart vaccine suggestions for a pet based on Israeli standards
   */
  static getVaccineSuggestions(pet: Pet): VaccineSuggestion[] {
    const suggestions: VaccineSuggestion[] = [];
    
    // Determine pet age in weeks
    const petAgeWeeks = this.calculatePetAgeInWeeks(pet);
    
    // Get appropriate vaccine schema based on pet type and age
    const vaccineSchema = this.getVaccineSchemaForPet(pet, petAgeWeeks);
    
    if (!vaccineSchema) {
      return suggestions;
    }
    
    // Process mandatory vaccines
    vaccineSchema.mandatory.forEach(vaccine => {
      const suggestion = this.createVaccineSuggestion(
        vaccine, 
        'mandatory', 
        'high', 
        'Required by Israeli law',
        petAgeWeeks
      );
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });
    
    // Process recommended vaccines
    vaccineSchema.recommended.forEach(vaccine => {
      const suggestion = this.createVaccineSuggestion(
        vaccine, 
        'recommended', 
        'medium', 
        'Recommended for optimal health',
        petAgeWeeks
      );
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });
    
    // Process preventative treatments
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
    const isPuppy = pet.type === 'dog' && ageWeeks < 52; // Less than 1 year
    const isKitten = pet.type === 'cat' && ageWeeks < 52; // Less than 1 year
    
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
    if (!pet.birthDate) {
      return 0; // Unknown age
    }
    
    const birthDate = new Date(pet.birthDate);
    const now = new Date();
    
    // Handle future birthdates (shouldn't happen but just in case)
    if (birthDate > now) {
      return 0;
    }
    
    const diffTime = now.getTime() - birthDate.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return Math.max(0, diffWeeks);
  }
  
  /**
   * Create a vaccine suggestion
   */
  private static createVaccineSuggestion(
    vaccine: Vaccine, 
    category: 'mandatory' | 'recommended', 
    priority: 'high' | 'medium' | 'low',
    reason: string,
    petAgeWeeks: number
  ): VaccineSuggestion | null {
    // Safety check for age_restriction
    if (!vaccine.age_restriction) {
      console.warn('Vaccine missing age_restriction:', vaccine.name);
      return null;
    }
    
    // Check if pet is old enough for this vaccine
    if (petAgeWeeks < vaccine.age_restriction.min_weeks) {
      return null;
    }
    
    // Check if pet is too old for this vaccine
    if (vaccine.age_restriction.max_years !== null) {
      const maxWeeks = vaccine.age_restriction.max_years * 52;
      if (petAgeWeeks > maxWeeks) {
        return null;
      }
    }
    
    // Calculate next due date based on frequency
    const nextDueDate = this.calculateNextDueDate(vaccine.frequency);
    
    return {
      vaccine,
      reason,
      priority,
      dueDate: nextDueDate,
      isOverdue: nextDueDate ? nextDueDate < new Date() : false,
      category
    };
  }
  
  /**
   * Create a preventative treatment suggestion
   */
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
  
  /**
   * Calculate next due date based on frequency string
   */
  private static calculateNextDueDate(frequency: string): Date | undefined {
    const now = new Date();
    
    if (frequency.includes('year') || frequency.includes('Yearly')) {
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    } else if (frequency.includes('month') || frequency.includes('Monthly')) {
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    } else if (frequency.includes('3 months')) {
      return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
    } else if (frequency.includes('6 months')) {
      return new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
    }
    
    return undefined;
  }
  
  /**
   * Get comprehensive vaccine schedule for a pet
   */
  static getVaccineSchedule(pet: Pet): SmartVaccineSchedule {
    const suggestions = this.getVaccineSuggestions(pet);
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
  static getVaccineSuggestionsForAllPets(pets: Pet[]): SmartVaccineSchedule[] {
    return pets.map(pet => this.getVaccineSchedule(pet));
  }
  
  /**
   * Get overdue vaccines across all pets
   */
  static getOverdueVaccines(pets: Pet[]): VaccineSuggestion[] {
    const allSuggestions: VaccineSuggestion[] = [];
    
    pets.forEach(pet => {
      const suggestions = this.getVaccineSuggestions(pet);
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
  static getUpcomingVaccines(pets: Pet[], daysAhead: number = 30): VaccineSuggestion[] {
    const allSuggestions: VaccineSuggestion[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    pets.forEach(pet => {
      const suggestions = this.getVaccineSuggestions(pet);
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
