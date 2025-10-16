import { apiClient } from '../api';
import type { 
  ServiceRequest, 
  ServiceRequestCreate, 
  ServiceRequestUpdate, 
  ServiceRequestSummary,
  ServiceRequestFilters 
} from '../../types/services/serviceRequest';

export class ServiceRequestService {
  /**
   * Create a new service request
   */
  static async createServiceRequest(request: ServiceRequestCreate): Promise<ServiceRequest> {
    try {
      const response = await apiClient.post<ServiceRequest>('/service-requests/', request);
      return response;
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  }

  /**
   * Get public service posts (marketplace)
   */
  static async getPublicServicePosts(filters: ServiceRequestFilters = {}): Promise<ServiceRequestSummary[]> {
    try {
      const params = new URLSearchParams();

      if (filters.service_type) params.append('service_type', filters.service_type);
      if (filters.location) params.append('location', filters.location);
      if (filters.budget_min !== undefined) params.append('budget_min', filters.budget_min.toString());
      if (filters.budget_max !== undefined) params.append('budget_max', filters.budget_max.toString());
      if (filters.is_urgent !== undefined) params.append('is_urgent', filters.is_urgent.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const queryString = params.toString();
      const endpoint = queryString ? `/service-requests/public/?${queryString}` : '/service-requests/public/';

      const response = await apiClient.get<ServiceRequestSummary[]>(endpoint);
      return response || [];
    } catch (error) {
      console.error('Error fetching public service posts:', error);
      return [];
    }
  }

  /**
   * Get service requests with optional filtering
   */
  static async getServiceRequests(filters: ServiceRequestFilters = {}): Promise<ServiceRequestSummary[]> {
    try {
      const params = new URLSearchParams();

      if (filters.service_type) params.append('service_type', filters.service_type);
      if (filters.location) params.append('location', filters.location);
      if (filters.budget_min !== undefined) params.append('budget_min', filters.budget_min.toString());
      if (filters.budget_max !== undefined) params.append('budget_max', filters.budget_max.toString());
      if (filters.is_urgent !== undefined) params.append('is_urgent', filters.is_urgent.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await apiClient.get<ServiceRequestSummary[]>(`/service-requests/?${params.toString()}`);
      return response || [];
    } catch (error) {
      console.error('Error fetching service requests:', error);
      return [];
    }
  }

  /**
   * Get current user's service requests
   */
  static async getMyServiceRequests(): Promise<ServiceRequest[]> {
    try {
      const response = await apiClient.get<ServiceRequest[]>('/service-requests/my-requests/');
      return response || [];
    } catch (error) {
      console.error('Error fetching user service requests:', error);
      return [];
    }
  }

  /**
   * Get a specific service request
   */
  static async getServiceRequest(requestId: number): Promise<ServiceRequest> {
    try {
      const response = await apiClient.get<ServiceRequest>(`/service-requests/${requestId}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching service request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Update a service request
   */
  static async updateServiceRequest(requestId: number, updates: ServiceRequestUpdate): Promise<ServiceRequest> {
    try {
      const response = await apiClient.put<ServiceRequest>(`/service-requests/${requestId}/`, updates);
      return response;
    } catch (error) {
      console.error(`Error updating service request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a service request
   */
  static async deleteServiceRequest(requestId: number): Promise<void> {
    try {
      await apiClient.delete(`/service-requests/${requestId}/`);
    } catch (error) {
      console.error(`Error deleting service request ${requestId}:`, error);
      throw error;
    }
  }
}