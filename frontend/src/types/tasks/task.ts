// src/types/tasks/task.ts

import type { Coordinates } from '../common';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskCategory = 
  | 'feeding' 
  | 'medication' 
  | 'grooming' 
  | 'exercise' 
  | 'training' 
  | 'vet' 
  | 'vaccination' 
  | 'deworming' 
  | 'other';

export interface Task {
  id?: number;
  title: string;
  description: string;
  dateTime: string; // ISO date string
  isCompleted: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  repeatInterval?: number;
  repeatUnit?: 'day' | 'week' | 'month' | 'year';
  lastCompleted?: string; // ISO date string
  nextDueDate?: string;  // ISO date string
  petIds: number[];
  attachments: string[];
  notes?: string;
  createdBy: number; // User ID
  assignedTo?: number; // User ID
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  reminderTime?: number; // Minutes before
  location?: string;
  coordinates?: Coordinates;
  isRecurring: boolean;
  recurrenceRule?: string; // iCal RRULE string
  completionHistory?: {
    date: string; // ISO date string
    completedBy: number; // User ID
    notes?: string;
  }[];
}

export interface TaskStats {
  total: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  byCategory: Record<TaskCategory, number>;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  completionRate: number;
  averageCompletionTime?: number; // in minutes
}

export interface TaskFilterOptions {
  status?: 'all' | 'completed' | 'pending' | 'overdue';
  priority?: TaskPriority[];
  category?: TaskCategory[];
  petIds?: number[];
  dateRange?: {
    start: string; // ISO date string
    end: string;   // ISO date string
  };
  searchQuery?: string;
  assignedTo?: number[]; // User IDs
  createdBy?: number[];  // User IDs
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}