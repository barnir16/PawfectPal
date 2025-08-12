import { apiRequest } from '../api';
import type { Task } from '../../types/tasks';
import type { UploadResponse } from '../../types/common';

/**
 * Get all tasks for the current user
 */
export const getTasks = async (): Promise<Task[]> => {
  return apiRequest<Task[]>('/tasks');
};

/**
 * Get a single task by ID
 */
export const getTask = async (taskId: number): Promise<Task> => {
  return apiRequest<Task>(`/tasks/${taskId}`);
};

/**
 * Create a new task
 */
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  });
};

/**
 * Update an existing task
 */
export const updateTask = async (taskId: number, task: Omit<Task, 'id'>): Promise<Task> => {
  return apiRequest<Task>(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(task)
  });
};

/**
 * Partially update a task
 */
export const patchTask = async (taskId: number, updates: Partial<Task>): Promise<Task> => {
  return apiRequest<Task>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: number): Promise<void> => {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE'
  });
};

/**
 * Get tasks by status
 */
export const getTasksByStatus = async (status: string): Promise<Task[]> => {
  return apiRequest<Task[]>(`/tasks?status=${encodeURIComponent(status)}`);
};

/**
 * Get tasks by priority
 */
export const getTasksByPriority = async (priority: string): Promise<Task[]> => {
  return apiRequest<Task[]>(`/tasks?priority=${encodeURIComponent(priority)}`);
};

/**
 * Get tasks assigned to a specific user
 */
export const getTasksByAssignee = async (userId: number): Promise<Task[]> => {
  return apiRequest<Task[]>(`/tasks?assigneeId=${userId}`);
};

/**
 * Get tasks due before a specific date
 */
export const getTasksDueBefore = async (date: Date): Promise<Task[]> => {
  return apiRequest<Task[]>(`/tasks?dueBefore=${date.toISOString()}`);
};

/**
 * Get tasks due after a specific date
 */
export const getTasksDueAfter = async (date: Date): Promise<Task[]> => {
  return apiRequest<Task[]>(`/tasks?dueAfter=${date.toISOString()}`);
};

/**
 * Get tasks due between two dates
 */
export const getTasksDueBetween = async (startDate: Date, endDate: Date): Promise<Task[]> => {
  return apiRequest<Task[]>(
    `/tasks?dueAfter=${startDate.toISOString()}&dueBefore=${endDate.toISOString()}`
  );
};

/**
 * Upload a task attachment
 */
export const uploadTaskAttachment = async (
  taskId: number,
  file: File,
  description?: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (description) {
    formData.append('description', description);
  }
  
  return apiRequest<UploadResponse>(`/tasks/${taskId}/attachments`, {
    method: 'POST',
    body: formData
  });
};

/**
 * Get all attachments for a task
 */
export const getTaskAttachments = async (taskId: number): Promise<Array<{
  id: number;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  description?: string;
}>> => {
  return apiRequest(`/tasks/${taskId}/attachments`);
};

/**
 * Delete a task attachment
 */
export const deleteTaskAttachment = async (taskId: number, attachmentId: number): Promise<void> => {
  return apiRequest(`/tasks/${taskId}/attachments/${attachmentId}`, {
    method: 'DELETE'
  });
};

/**
 * Add a comment to a task
 */
export const addTaskComment = async (
  taskId: number,
  content: string
): Promise<{ id: number; content: string; createdAt: string; authorId: number }> => {
  return apiRequest(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
};

/**
 * Get all comments for a task
 */
export const getTaskComments = async (taskId: number): Promise<Array<{
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
  authorName?: string;
  authorAvatar?: string;
}>> => {
  return apiRequest(`/tasks/${taskId}/comments`);
};

/**
 * Update a task status
 */
export const updateTaskStatus = async (
  taskId: number,
  status: string
): Promise<Task> => {
  return patchTask(taskId, { status } as Partial<Task>);
};

/**
 * Assign a task to a user
 */
export const assignTask = async (
  taskId: number,
  userId: number | null
): Promise<Task> => {
  return patchTask(taskId, { assignedTo: userId } as Partial<Task>);
};
