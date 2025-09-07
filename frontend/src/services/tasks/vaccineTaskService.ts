import { getTasks, createTask, updateTask, deleteTask } from './taskService';
import type { Task } from '../../types/tasks/task';
import type { Pet } from '../../types/pets/pet';

export interface VaccineSchedule {
  name: string;
  description: string;
  initialAge: number; // in weeks
  repeatInterval: number; // in weeks
  maxAge?: number; // in weeks, optional
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface VaccineTask extends Task {
  vaccineName: string;
  vaccineType: 'vaccination';
  isOverdue: boolean;
  nextDueDate: string;
  veterinarian?: string;
  clinic?: string;
  vaccineNotes?: string;
}

// Default vaccine schedules for dogs and cats
export const DOG_VACCINE_SCHEDULES: VaccineSchedule[] = [
  {
    name: 'חיסון משושה ראשון',
    description: 'חיסון משושה בסיסי לכלבים צעירים',
    initialAge: 6, // 6 weeks
    repeatInterval: 3, // every 3 weeks
    maxAge: 16, // until 16 weeks
    priority: 'high'
  },
  {
    name: 'חיסון משושה שני',
    description: 'חיסון משושה שני לכלבים צעירים',
    initialAge: 9, // 9 weeks
    repeatInterval: 3, // every 3 weeks
    maxAge: 16, // until 16 weeks
    priority: 'high'
  },
  {
    name: 'חיסון משושה שלישי',
    description: 'חיסון משושה שלישי לכלבים צעירים',
    initialAge: 12, // 12 weeks
    repeatInterval: 3, // every 3 weeks
    maxAge: 16, // until 16 weeks
    priority: 'high'
  },
  {
    name: 'חיסון כלבת',
    description: 'חיסון כלבת - חובה בישראל',
    initialAge: 12, // 12 weeks
    repeatInterval: 52, // every year
    priority: 'urgent'
  },
  {
    name: 'חיסון משושה שנתי',
    description: 'חיסון משושה שנתי לכלבים בוגרים',
    initialAge: 52, // 1 year
    repeatInterval: 52, // every year
    priority: 'medium'
  }
];

export const CAT_VACCINE_SCHEDULES: VaccineSchedule[] = [
  {
    name: 'חיסון מרובע ראשון',
    description: 'חיסון מרובע לחתולים צעירים',
    initialAge: 8, // 8 weeks
    repeatInterval: 4, // every 4 weeks
    maxAge: 16, // until 16 weeks
    priority: 'high'
  },
  {
    name: 'חיסון מרובע שני',
    description: 'חיסון מרובע שני לחתולים צעירים',
    initialAge: 12, // 12 weeks
    repeatInterval: 4, // every 4 weeks
    maxAge: 16, // until 16 weeks
    priority: 'high'
  },
  {
    name: 'חיסון כלבת',
    description: 'חיסון כלבת - חובה בישראל',
    initialAge: 12, // 12 weeks
    repeatInterval: 52, // every year
    priority: 'urgent'
  },
  {
    name: 'חיסון מרובע שנתי',
    description: 'חיסון מרובע שנתי לחתולים בוגרים',
    initialAge: 52, // 1 year
    repeatInterval: 52, // every year
    priority: 'medium'
  }
];

export class VaccineTaskService {
  /**
   * Generate COMPLETE vaccine schedule for a pet - all vaccines they'll ever need
   */
  static generateVaccineTasks(pet: Pet): VaccineTask[] {
    const schedules = pet.type === 'dog' ? DOG_VACCINE_SCHEDULES : CAT_VACCINE_SCHEDULES;
    const tasks: VaccineTask[] = [];
    
    // Calculate pet's age in weeks
    const petAgeInWeeks = this.calculatePetAgeInWeeks(pet);
    const petBirthDate = pet.birthDate ? new Date(pet.birthDate) : new Date();
    
    console.log(`🐕 Generating complete vaccine schedule for ${pet.name} (${pet.type}, ${petAgeInWeeks} weeks old)`);
    
    schedules.forEach(schedule => {
      // Generate ALL instances of this vaccine that the pet will need
      const vaccineInstances = this.generateVaccineInstances(pet, schedule, petBirthDate, petAgeInWeeks);
      tasks.push(...vaccineInstances);
    });
    
    // Sort by due date
    tasks.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    
    console.log(`🐕 Generated ${tasks.length} vaccine tasks for ${pet.name}:`, tasks.map(t => `${t.vaccineName} - ${new Date(t.dateTime).toLocaleDateString()}`));
    
    return tasks;
  }

  /**
   * Generate all instances of a specific vaccine for a pet
   */
  private static generateVaccineInstances(pet: Pet, schedule: VaccineSchedule, petBirthDate: Date, petAgeInWeeks: number): VaccineTask[] {
    const instances: VaccineTask[] = [];
    const now = new Date();
    
    // Calculate when this vaccine series should start
    const startDate = new Date(petBirthDate);
    startDate.setDate(startDate.getDate() + (schedule.initialAge * 7));
    
    // If pet is already past the initial age, start from now
    if (startDate < now) {
      startDate.setTime(now.getTime());
    }
    
    // Generate the first vaccine in the series
    const firstVaccine: VaccineTask = {
      id: 0, // Will be set by backend
      title: schedule.name,
      description: `${schedule.description} - חיסון אוטומטי עבור ${pet.name}`,
      dateTime: startDate.toISOString(),
      priority: schedule.priority,
      petIds: [pet.id || 0],
      isCompleted: false,
      repeatInterval: schedule.repeatInterval,
      repeatUnit: 'weeks',
      vaccineName: schedule.name,
      vaccineType: 'vaccination',
      isOverdue: startDate < now,
      nextDueDate: startDate.toISOString(),
      veterinarian: '',
      clinic: '',
      vaccineNotes: ''
    };
    
    instances.push(firstVaccine);
    
    // Generate recurring vaccines for the next 3 years
    let currentDate = new Date(startDate);
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 3); // Plan 3 years ahead
    
    while (currentDate < endDate) {
      // Calculate next due date
      currentDate.setDate(currentDate.getDate() + (schedule.repeatInterval * 7));
      
      // Check if we've reached max age for this vaccine type
      const weeksFromBirth = Math.floor((currentDate.getTime() - petBirthDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      if (schedule.maxAge && weeksFromBirth > schedule.maxAge) {
        break; // Stop generating this vaccine type
      }
      
      const recurringVaccine: VaccineTask = {
        id: 0, // Will be set by backend
        title: schedule.name,
        description: `${schedule.description} - חיסון חוזר עבור ${pet.name}`,
        dateTime: currentDate.toISOString(),
        priority: schedule.priority,
        petIds: [pet.id || 0],
        isCompleted: false,
        repeatInterval: schedule.repeatInterval,
        repeatUnit: 'weeks',
        vaccineName: schedule.name,
        vaccineType: 'vaccination',
        isOverdue: currentDate < now,
        nextDueDate: currentDate.toISOString(),
        veterinarian: '',
        clinic: '',
        vaccineNotes: ''
      };
      
      instances.push(recurringVaccine);
    }
    
    return instances;
  }

  /**
   * Calculate pet's age in weeks
   */
  private static calculatePetAgeInWeeks(pet: Pet): number {
    if (!pet.birthDate) {
      // If no birth date, estimate based on age field
      if (pet.age && pet.age > 0) {
        // Assume age is in years, convert to weeks
        return pet.age * 52;
      }
      // Default to 8 weeks if no age information
      return 8;
    }
    
    const birthDate = new Date(pet.birthDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birthDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    
    return diffWeeks;
  }

  /**
   * Calculate next due date for a vaccine
   */
  private static calculateNextDueDate(pet: Pet, schedule: VaccineSchedule): string {
    const now = new Date();
    let nextDate = new Date();
    
    if (schedule.initialAge > this.calculatePetAgeInWeeks(pet)) {
      // Pet is too young, schedule for when they reach the age
      const weeksUntilReady = schedule.initialAge - this.calculatePetAgeInWeeks(pet);
      nextDate.setDate(nextDate.getDate() + (weeksUntilReady * 7));
    } else {
      // Pet is old enough, schedule based on repeat interval
      const lastVaccineDate = this.getLastVaccineDate(pet, schedule.name);
      if (lastVaccineDate) {
        // Schedule next vaccine based on repeat interval
        nextDate = new Date(lastVaccineDate);
        nextDate.setDate(nextDate.getDate() + (schedule.repeatInterval * 7));
      } else {
        // First time vaccine, schedule for now
        nextDate = now;
      }
    }
    
    return nextDate.toISOString();
  }

  /**
   * Get the last vaccine date for a specific vaccine type
   */
  private static getLastVaccineDate(pet: Pet, vaccineName: string): string | null {
    // This would typically query the database for completed vaccine tasks
    // For now, return null to indicate first time
    return null;
  }

  /**
   * Mark a vaccine task as completed and schedule the next one
   */
  static async completeVaccineTask(taskId: number, completionData: {
    completedDate: string;
    veterinarian?: string;
    clinic?: string;
    notes?: string;
  }): Promise<void> {
    try {
      // Mark current task as completed
      await updateTask(taskId, {
        isCompleted: true,
        description: `הושלם בתאריך: ${completionData.completedDate}\nוטרינר: ${completionData.veterinarian || 'לא צוין'}\nמרפאה: ${completionData.clinic || 'לא צוין'}\nהערות: ${completionData.notes || 'אין'}`,
        dateTime: completionData.completedDate
      });

      // Get the completed task to create the next one
      const completedTask = await getTasks().then(tasks => 
        tasks.find(t => t.id === taskId)
      );

      if (completedTask && completedTask.repeatInterval) {
        // Calculate next due date
        const nextDueDate = new Date(completionData.completedDate);
        nextDueDate.setDate(nextDueDate.getDate() + (completedTask.repeatInterval * 7));

        // Create next vaccine task
        const nextTask: Partial<Task> = {
          title: completedTask.title,
          description: `חיסון חוזר עבור ${completedTask.title}`,
          dateTime: nextDueDate.toISOString(),
          priority: completedTask.priority,
          petIds: completedTask.petIds,
          isCompleted: false,
          repeatInterval: completedTask.repeatInterval,
          repeatUnit: completedTask.repeatUnit
        };

        await createTask(nextTask);
      }
    } catch (error) {
      console.error('Error completing vaccine task:', error);
      throw error;
    }
  }

  /**
   * Get all vaccine tasks for a pet
   */
  static async getVaccineTasks(petId: number): Promise<VaccineTask[]> {
    try {
      const allTasks = await getTasks();
      return allTasks
        .filter(task => 
          task.petIds.includes(petId) && 
          task.description?.includes('חיסון')
        )
        .map(task => ({
          ...task,
          vaccineName: task.title,
          vaccineType: 'vaccination' as const,
          isOverdue: new Date(task.dateTime) < new Date(),
          nextDueDate: task.dateTime,
          veterinarian: '',
          clinic: '',
          vaccineNotes: task.description || ''
        }));
    } catch (error) {
      console.error('Error getting vaccine tasks:', error);
      throw error;
    }
  }

  /**
   * Get overdue vaccine tasks for all pets
   */
  static async getOverdueVaccineTasks(): Promise<VaccineTask[]> {
    try {
      const allTasks = await getTasks();
      const now = new Date();
      
      return allTasks
        .filter(task => 
          !task.isCompleted && 
          task.description?.includes('חיסון') &&
          new Date(task.dateTime) < now
        )
        .map(task => ({
          ...task,
          vaccineName: task.title,
          vaccineType: 'vaccination' as const,
          isOverdue: true,
          nextDueDate: task.dateTime,
          veterinarian: '',
          clinic: '',
          vaccineNotes: task.description || ''
        }));
    } catch (error) {
      console.error('Error getting overdue vaccine tasks:', error);
      throw error;
    }
  }

  /**
   * Get upcoming vaccine tasks for all pets
   */
  static async getUpcomingVaccineTasks(daysAhead: number = 30): Promise<VaccineTask[]> {
    try {
      const allTasks = await getTasks();
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      return allTasks
        .filter(task => 
          !task.isCompleted && 
          task.description?.includes('חיסון') &&
          new Date(task.dateTime) >= now &&
          new Date(task.dateTime) <= futureDate
        )
        .map(task => ({
          ...task,
          vaccineName: task.title,
          vaccineType: 'vaccination' as const,
          isOverdue: false,
          nextDueDate: task.dateTime,
          veterinarian: '',
          clinic: '',
          vaccineNotes: task.description || ''
        }));
    } catch (error) {
      console.error('Error getting upcoming vaccine tasks:', error);
      throw error;
    }
  }

  /**
   * Create a new vaccine task
   */
  static async createVaccineTask(vaccineData: {
    vaccineName: string;
    vaccineType: 'vaccination';
    nextDueDate: string;
    veterinarian?: string;
    clinic?: string;
    vaccineNotes?: string;
    petIds: number[];
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dateTime: string;
    title: string;
    description: string;
    isCompleted: boolean;
  }): Promise<VaccineTask> {
    try {
      const taskData: Partial<Task> = {
        title: vaccineData.title,
        description: vaccineData.description,
        dateTime: vaccineData.dateTime,
        priority: vaccineData.priority,
        petIds: vaccineData.petIds,
        isCompleted: vaccineData.isCompleted,
        repeatInterval: 52, // Default yearly
        repeatUnit: 'weeks'
      };

      const createdTask = await createTask(taskData);
      
      return {
        ...createdTask,
        vaccineName: vaccineData.vaccineName,
        vaccineType: vaccineData.vaccineType,
        isOverdue: new Date(vaccineData.nextDueDate) < new Date(),
        nextDueDate: vaccineData.nextDueDate,
        veterinarian: vaccineData.veterinarian || '',
        clinic: vaccineData.clinic || '',
        vaccineNotes: vaccineData.vaccineNotes || ''
      };
    } catch (error) {
      console.error('Error creating vaccine task:', error);
      throw error;
    }
  }

  /**
   * Update an existing vaccine task
   */
  static async updateVaccineTask(taskId: number, updates: {
    vaccineName?: string;
    vaccineType?: 'vaccination';
    nextDueDate?: string;
    veterinarian?: string;
    clinic?: string;
    vaccineNotes?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<VaccineTask> {
    try {
      const taskUpdates: Partial<Task> = {
        title: updates.vaccineName,
        description: updates.vaccineNotes,
        priority: updates.priority,
        dateTime: updates.nextDueDate
      };

      const updatedTask = await updateTask(taskId, taskUpdates);
      
      return {
        ...updatedTask,
        vaccineName: updates.vaccineName || updatedTask.title,
        vaccineType: updates.vaccineType || 'vaccination',
        isOverdue: updates.nextDueDate ? new Date(updates.nextDueDate) < new Date() : false,
        nextDueDate: updates.nextDueDate || updatedTask.dateTime,
        veterinarian: updates.veterinarian || '',
        clinic: updates.clinic || '',
        vaccineNotes: updates.vaccineNotes || updatedTask.description || ''
      };
    } catch (error) {
      console.error('Error updating vaccine task:', error);
      throw error;
    }
  }

  /**
   * Delete a vaccine task
   */
  static async deleteVaccineTask(taskId: number): Promise<void> {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting vaccine task:', error);
      throw error;
    }
  }

  /**
   * Complete a vaccine task (alias for completeVaccineTask)
   */
  static async completeVaccine(vaccineTask: VaccineTask): Promise<void> {
    if (!vaccineTask.id) {
      throw new Error('Vaccine task ID is required');
    }
    
    return this.completeVaccineTask(vaccineTask.id, {
      completedDate: new Date().toISOString(),
      veterinarian: vaccineTask.veterinarian,
      clinic: vaccineTask.clinic,
      notes: vaccineTask.vaccineNotes
    });
  }
}

export default VaccineTaskService;
