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
    const response = await apiClient.post('/service-requests/', request);
    return response;
  }

  /**
   * Get service requests with optional filtering
   */
  static async getServiceRequests(filters: ServiceRequestFilters = {}): Promise<ServiceRequestSummary[]> {
    const params = new URLSearchParams();
    
    if (filters.service_type) params.append('service_type', filters.service_type);
    if (filters.location) params.append('location', filters.location);
    if (filters.budget_min !== undefined) params.append('budget_min', filters.budget_min.toString());
    if (filters.budget_max !== undefined) params.append('budget_max', filters.budget_max.toString());
    if (filters.is_urgent !== undefined) params.append('is_urgent', filters.is_urgent.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get(`/service-requests/?${params.toString()}`);
    return response || [];
  }

  /**
   * Get current user's service requests
   */
  static async getMyServiceRequests(): Promise<ServiceRequest[]> {
    const response = await apiClient.get('/service-requests/my-requests/');
    return response || [];
  }

  /**
   * Get a specific service request
   */
  static async getServiceRequest(requestId: number): Promise<ServiceRequest> {
    const response = await apiClient.get(`/service-requests/${requestId}/`);
    return response;
  }

  /**
   * Update a service request
   */
  static async updateServiceRequest(requestId: number, updates: ServiceRequestUpdate): Promise<ServiceRequest> {
    const response = await apiClient.put(`/service-requests/${requestId}/`, updates);
    return response;
  }

  /**
   * Delete a service request
   */
  static async deleteServiceRequest(requestId: number): Promise<void> {
    await apiClient.delete(`/service-requests/${requestId}/`);
  }
}