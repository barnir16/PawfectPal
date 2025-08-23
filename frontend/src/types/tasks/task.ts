// Task types for PawfectPal

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RepeatUnit = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Represents a task/reminder in the PawfectPal application
 */
export interface Task {
  id?: number;
  title: string;
  description: string;
  dateTime: string; // ISO datetime string
  repeatInterval?: number;
  repeatUnit?: RepeatUnit;
  repeatEndDate?: string; // ISO date string for when repetition should end
  petIds: number[]; // Array of pet IDs this task applies to
  attachments: string[]; // Array of image URLs
  priority?: TaskPriority;
  status?: TaskStatus;
  isCompleted?: boolean;
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
  ownerId?: number;
}

/**
 * Task creation data
 */
export type TaskCreateData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>;

/**
 * Task update data
 */
export type TaskUpdateData = Partial<TaskCreateData>;

/**
 * Task filters for searching/filtering
 */
export interface TaskFilters {
  priority?: TaskPriority | TaskPriority[];
  status?: TaskStatus | TaskStatus[];
  petId?: number;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  isCompleted?: boolean;
  searchQuery?: string;
  sortBy?: 'dateTime' | 'priority' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Task statistics
 */
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  upcomingToday: number;
  upcomingWeek: number;
}