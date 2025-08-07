import { apiRequest } from '../api';
import type { Service, ServiceStatus } from '../../types/services';

/**
 * Get all services
 */
export const getServices = async (): Promise<Service[]> => {
  return apiRequest<Service[]>('/services');
};

/**
 * Create a new service booking
 */
export const createService = async (service: Omit<Service, 'id'>): Promise<Service> => {
  return apiRequest<Service>('/services', {
    method: 'POST',
    body: JSON.stringify(service)
  });
};

/**
 * Update a service status
 */
export const updateServiceStatus = async (
  serviceId: number, 
  status: ServiceStatus
): Promise<Service> => {
  return apiRequest<Service>(`/services/${serviceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};
