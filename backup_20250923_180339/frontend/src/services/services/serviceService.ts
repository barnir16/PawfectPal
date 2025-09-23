import { apiRequest } from '../api';
import type { Service } from '../../types/services';

/**
 * Get all services for the current user
 */
export const getServices = async (): Promise<Service[]> => {
  try {
    return await apiRequest<Service[]>('/service_booking');
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Get a single service by ID
 */
export const getService = async (serviceId: number): Promise<Service | null> => {
  try {
    return await apiRequest<Service>(`/service_booking/${serviceId}`);
  } catch (error) {
    console.error(`Error fetching service ${serviceId}:`, error);
    return null;
  }
};

/**
 * Create a new service booking
 */
export const createService = async (service: Omit<Service, 'id'>): Promise<Service | null> => {
  try {
    return await apiRequest<Service>('/service_booking', {
      method: 'POST',
      body: JSON.stringify(service)
    });
  } catch (error) {
    console.error('Error creating service:', error);
    return null;
  }
};

/**
 * Update an existing service
 */
export const updateService = async (serviceId: number, service: Partial<Service>): Promise<Service | null> => {
  try {
    return await apiRequest<Service>(`/service_booking/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(service)
    });
  } catch (error) {
    console.error(`Error updating service ${serviceId}:`, error);
    return null;
  }
};

/**
 * Delete a service
 */
export const deleteService = async (serviceId: number): Promise<boolean> => {
  try {
    await apiRequest(`/service_booking/${serviceId}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error(`Error deleting service ${serviceId}:`, error);
    return false;
  }
};

/**
 * Get services by status
 */
export const getServicesByStatus = async (status: string): Promise<Service[]> => {
  try {
    const allServices = await getServices();
    return allServices.filter(service => service.status === status);
  } catch (error) {
    console.error(`Error filtering services by status ${status}:`, error);
    return [];
  }
};

/**
 * Get services by pet ID
 */
export const getServicesByPet = async (petId: number): Promise<Service[]> => {
  try {
    const allServices = await getServices();
    return allServices.filter(service => service.pet_id === petId);
  } catch (error) {
    console.error(`Error filtering services by pet ${petId}:`, error);
    return [];
  }
};

/**
 * Get services by date range
 */
export const getServicesByDateRange = async (startDate: Date, endDate: Date): Promise<Service[]> => {
  try {
    const allServices = await getServices();
    return allServices.filter(service => {
      const serviceDate = new Date(service.start_datetime);
      return serviceDate >= startDate && serviceDate <= endDate;
    });
  } catch (error) {
    console.error(`Error filtering services by date range:`, error);
    return [];
  }
};

/**
 * Cancel a service
 */
export const cancelService = async (serviceId: number): Promise<boolean> => {
  try {
    return await updateService(serviceId, { status: 'cancelled' }) !== null;
  } catch (error) {
    console.error(`Error cancelling service ${serviceId}:`, error);
    return false;
  }
};

/**
 * Complete a service
 */
export const completeService = async (serviceId: number): Promise<boolean> => {
  try {
    return await updateService(serviceId, { status: 'completed' }) !== null;
  } catch (error) {
    console.error(`Error completing service ${serviceId}:`, error);
    return false;
  }
};
