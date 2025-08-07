import { apiRequest, getToken, handleApiError } from '../api';
import type { Task } from '../../types/tasks';
import type { UploadResponse } from '../../types/common';
import { BASE_URL } from './/../../api';
/**
 * Get all tasks for the current user
 */
export const getTasks = async (): Promise<Task[]> => {
  return apiRequest<Task[]>('/tasks');
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
 * Delete a task
 */
export const deleteTask = async (taskId: number): Promise<void> => {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE'
  });
};

/**
 * Upload a task attachment
 */
export const uploadTaskAttachment = async (
  taskId: number, 
  file: File
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('attachment', file);
  
  const token = await getToken();
  const response = await fetch(`${BASE_URL}/tasks/${taskId}/attachments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    return handleApiError(response);
  }

  return response.json();
};
