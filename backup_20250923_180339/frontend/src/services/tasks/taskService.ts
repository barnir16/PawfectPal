import { apiRequest } from '../api';
import type { Task, TaskCreateData, TaskUpdateData, TaskFilters } from '../../types/tasks/task';

/**
 * Transform backend task data to frontend Task format
 */
const transformTaskFromBackend = (backendTask: any): Task => {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.description,
    dateTime: backendTask.date_time,
    repeatInterval: backendTask.repeat_interval,
    repeatUnit: backendTask.repeat_unit,
    repeatEndDate: backendTask.repeat_end_date,
    petIds: backendTask.pet_ids || [],
    attachments: backendTask.attachments || [],
    priority: backendTask.priority || 'medium',
    status: backendTask.status || 'pending',
    isCompleted: backendTask.is_completed || false,
    createdAt: backendTask.created_at,
    updatedAt: backendTask.updated_at,
    ownerId: backendTask.user_id,
  };
};

/**
 * Transform frontend task data to backend format
 */
const transformTaskToBackend = (task: TaskCreateData | TaskUpdateData): any => {
  return {
    title: task.title,
    description: task.description,
    date_time: task.dateTime,
    repeat_interval: task.repeatInterval,
    repeat_unit: task.repeatUnit,
    repeat_end_date: task.repeatEndDate,
    pet_ids: task.petIds || [],
    attachments: task.attachments || [],
    priority: task.priority || 'medium',
    status: task.status || 'pending',
    is_completed: task.isCompleted || false,
  };
};

/**
 * Get all tasks for the current user
 */
export const getTasks = async (filters?: TaskFilters): Promise<Task[]> => {
  let endpoint = '/task';
  
  // Add query parameters if filters are provided
  if (filters) {
    const params = new URLSearchParams();
    
    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        filters.priority.forEach(p => params.append('priority', p));
      } else {
        params.append('priority', filters.priority);
      }
    }
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(s => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    
    if (filters.petId) params.append('pet_id', filters.petId.toString());
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.isCompleted !== undefined) params.append('is_completed', filters.isCompleted.toString());
    if (filters.searchQuery) params.append('search', filters.searchQuery);
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
    
    if (params.toString()) {
      endpoint += '?' + params.toString();
    }
  }
  
  const backendTasks = await apiRequest<any[]>(endpoint);
  return backendTasks.map(transformTaskFromBackend);
};

/**
 * Get a single task by ID
 */
export const getTask = async (taskId: number): Promise<Task> => {
  const backendTask = await apiRequest<any>(`/task/${taskId}`);
  return transformTaskFromBackend(backendTask);
};

/**
 * Create a new task
 */
export const createTask = async (task: TaskCreateData): Promise<Task> => {
  const backendTask = transformTaskToBackend(task);
  const createdTask = await apiRequest<any>('/task', {
    method: 'POST',
    body: JSON.stringify(backendTask)
  });
  return transformTaskFromBackend(createdTask);
};

/**
 * Update an existing task
 */
export const updateTask = async (taskId: number, task: TaskUpdateData): Promise<Task> => {
  const backendTask = transformTaskToBackend(task);
  const updatedTask = await apiRequest<any>(`/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(backendTask)
  });
  return transformTaskFromBackend(updatedTask);
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: number): Promise<void> => {
  return apiRequest(`/task/${taskId}`, {
    method: 'DELETE'
  });
};

/**
 * Export tasks to iCal format for calendar applications
 */
export const exportTasksToICal = (tasks: Task[]): string => {
  const now = new Date();
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PawfectPal//Pet Care Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...tasks.map(task => {
      const taskDate = new Date(task.dateTime);
      const endDate = new Date(taskDate.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      return [
        'BEGIN:VEVENT',
        `UID:${task.id}@pawfectpal.com`,
        `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${taskDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${task.title}`,
        task.description ? `DESCRIPTION:${task.description.replace(/\n/g, '\\n')}` : '',
        `PRIORITY:${task.priority === 'urgent' ? '1' : task.priority === 'high' ? '2' : task.priority === 'medium' ? '3' : '4'}`,
        `STATUS:${task.isCompleted ? 'COMPLETED' : 'NEEDS-ACTION'}`,
        'END:VEVENT'
      ].filter(Boolean).join('\r\n');
    }),
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icalContent;
};

/**
 * Download tasks as iCal file
 */
export const downloadTasksAsICal = (tasks: Task[], filename: string = 'pawfectpal-tasks.ics'): void => {
  const icalContent = exportTasksToICal(tasks);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Add task to Google Calendar
 */
export const addTaskToGoogleCalendar = async (task: Task): Promise<void> => {
  const taskDate = new Date(task.dateTime);
  const endDate = new Date(taskDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  // Build recurrence rules for Google Calendar
  const recurrence: string[] = [];
  if (task.repeatUnit && task.repeatInterval) {
    const interval = task.repeatInterval || 1;
    let rule = `RRULE:FREQ=${task.repeatUnit.toUpperCase()}`;
    
    if (interval > 1) {
      rule += `;INTERVAL=${interval}`;
    }
    
    if (task.repeatEndDate) {
      const endDate = new Date(task.repeatEndDate);
      rule += `;UNTIL=${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    }
    
    recurrence.push(rule);
  }
  
  const event = {
    summary: task.title,
    description: task.description || 'Pet care task from PawfectPal',
    start: {
      dateTime: taskDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    recurrence: recurrence.length > 0 ? recurrence : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 30 } // 30 minutes before
      ]
    }
  };

  // Check if Google Calendar API is available
  if (window.gapi?.client?.calendar?.events) {
    try {
      await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      console.log('Task added to Google Calendar successfully');
    } catch (error) {
      console.error('Failed to add task to Google Calendar:', error);
      throw new Error('Failed to add task to Google Calendar');
    }
  } else {
    // Fallback: open Google Calendar in new tab with pre-filled event
    const calendarUrl = new URL('https://calendar.google.com/calendar/render');
    calendarUrl.searchParams.set('action', 'TEMPLATE');
    calendarUrl.searchParams.set('text', task.title);
    calendarUrl.searchParams.set('dates', 
      `${taskDate.toISOString().replace(/[-:]/g, '').split('.')[0]}/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}`
    );
    calendarUrl.searchParams.set('details', task.description || 'Pet care task from PawfectPal');
    
    window.open(calendarUrl.toString(), '_blank');
  }
};

/**
 * Sync all tasks with Google Calendar
 */
export const syncTasksWithGoogleCalendar = async (tasks: Task[]): Promise<void> => {
  try {
    // Filter out completed tasks
    const activeTasks = tasks.filter(task => !task.isCompleted);
    
    // Add each active task to Google Calendar
    for (const task of activeTasks) {
      await addTaskToGoogleCalendar(task);
    }
    
    console.log(`Successfully synced ${activeTasks.length} tasks with Google Calendar`);
  } catch (error) {
    console.error('Failed to sync tasks with Google Calendar:', error);
    throw error;
  }
};

/**
 * Mark a task as completed
 */
export const completeTask = async (taskId: number): Promise<Task> => {
  return updateTask(taskId, { 
    status: 'completed', 
    isCompleted: true 
  });
};

/**
 * Upload attachment to a task
 */
export const uploadTaskAttachment = async (taskId: number, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiRequest<{ file_path: string }>(`/task/${taskId}/attachment`, {
    method: 'POST',
    body: formData
  });
  
  return response.file_path;
};