import { WeightRecord } from './weightMonitoringService';
import { getBaseUrl, getToken } from '../api';

export interface CreateWeightRecordRequest {
  petId: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  date: string;
  notes?: string;
  source: 'manual' | 'vet' | 'auto';
}

export interface WeightRecordResponse {
  id: number;
  pet_id: number;
  weight: number;
  weight_unit: 'kg' | 'lbs';
  date: string;
  notes?: string;
  source: 'manual' | 'vet' | 'auto';
  created_at: string;
  updated_at: string;
}

export class WeightService {
  /**
   * Parse date string safely
   */
  private static parseDate(dateString: string): Date {
    try {
      // Handle various date formats
      if (dateString.includes('T')) {
        return new Date(dateString);
      } else if (dateString.includes('-')) {
        // Format: YYYY-MM-DD
        return new Date(dateString + 'T00:00:00');
      } else {
        // Fallback to current date
        return new Date();
      }
    } catch (error) {
      console.warn('Failed to parse date:', dateString, error);
      return new Date();
    }
  }

  /**
   * Get weight records for a specific pet
   */
  static async getWeightRecords(petId: number): Promise<WeightRecord[]> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-records/pet/${petId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch weight records: ${response.statusText}`);
      }

      const data: WeightRecordResponse[] = await response.json();
      
      return data.map(record => ({
        id: record.id,
        petId: record.pet_id,
        weight: record.weight,
        weightUnit: record.weight_unit,
        date: this.parseDate(record.date),
        notes: record.notes,
        source: record.source,
      }));
    } catch (error) {
      console.error('Error fetching weight records:', error);
      return [];
    }
  }

  /**
   * Get weight records for all pets
   */
  static async getAllWeightRecords(): Promise<WeightRecord[]> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-records/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch weight records: ${response.statusText}`);
      }

      const data: WeightRecordResponse[] = await response.json();
      
      return data.map(record => ({
        id: record.id,
        petId: record.pet_id,
        weight: record.weight,
        weightUnit: record.weight_unit,
        date: this.parseDate(record.date),
        notes: record.notes,
        source: record.source,
      }));
    } catch (error) {
      console.error('Error fetching all weight records:', error);
      return [];
    }
  }

  /**
   * Create a new weight record
   */
  static async createWeightRecord(request: CreateWeightRecordRequest): Promise<WeightRecord | null> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-records/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pet_id: request.petId,
          weight: request.weight,
          weight_unit: request.weightUnit,
          date: request.date,
          notes: request.notes,
          source: request.source,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create weight record: ${response.statusText}`);
      }

      const data: WeightRecordResponse = await response.json();
      
      return {
        id: data.id,
        petId: data.pet_id,
        weight: data.weight,
        weightUnit: data.weight_unit,
        date: this.parseDate(data.date),
        notes: data.notes,
        source: data.source,
      };
    } catch (error) {
      console.error('Error creating weight record:', error);
      return null;
    }
  }

  /**
   * Update a weight record
   */
  static async updateWeightRecord(id: number, request: Partial<CreateWeightRecordRequest>): Promise<WeightRecord | null> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-records/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pet_id: request.petId,
          weight: request.weight,
          weight_unit: request.weightUnit,
          date: request.date,
          notes: request.notes,
          source: request.source,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update weight record: ${response.statusText}`);
      }

      const data: WeightRecordResponse = await response.json();
      
      return {
        id: data.id,
        petId: data.pet_id,
        weight: data.weight,
        weightUnit: data.weight_unit,
        date: new Date(data.date),
        notes: data.notes,
        source: data.source,
      };
    } catch (error) {
      console.error('Error updating weight record:', error);
      return null;
    }
  }

  /**
   * Delete a weight record
   */
  static async deleteWeightRecord(id: number): Promise<boolean> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-records/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting weight record:', error);
      return false;
    }
  }

  /**
   * Get weight records for a date range
   */
  static async getWeightRecordsByDateRange(
    petId: number, 
    startDate: string, 
    endDate: string
  ): Promise<WeightRecord[]> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${getBaseUrl()}/api/weight-records/pet/${petId}/range/?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch weight records by date range: ${response.statusText}`);
      }

      const data: WeightRecordResponse[] = await response.json();
      
      return data.map(record => ({
        id: record.id,
        petId: record.pet_id,
        weight: record.weight,
        weightUnit: record.weight_unit,
        date: new Date(record.date),
        notes: record.notes,
        source: record.source,
      }));
    } catch (error) {
      console.error('Error fetching weight records by date range:', error);
      return [];
    }
  }
}
