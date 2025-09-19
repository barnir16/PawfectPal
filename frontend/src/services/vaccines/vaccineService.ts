import { getBaseUrl, getToken } from '../api';

export interface VaccinationRecord {
  id: number;
  pet_id: number;
  vaccine_name: string;
  vaccine_type: string;
  date_administered: string;
  next_due_date: string;
  batch_number?: string;
  manufacturer?: string;
  veterinarian: string;
  clinic: string;
  dose_number: number;
  notes?: string;
  is_completed: boolean;
  reminder_sent: boolean;
  created_at: string;
  updated_at?: string;
}

export interface VaccinationSummary {
  pet_id: number;
  total_vaccinations: number;
  up_to_date: boolean;
  next_due_date?: string;
  overdue_count: number;
  due_soon_count: number;
  completed_series: string[];
}

export interface VaccinationReminder {
  vaccination_id: number;
  pet_id: number;
  pet_name: string;
  vaccine_name: string;
  due_date: string;
  days_until_due: number;
  is_overdue: boolean;
}

export interface VaccinationListResponse {
  vaccinations: VaccinationRecord[];
  total: number;
  page: number;
  page_size: number;
}

// Get all vaccinations for a specific pet
export const getPetVaccinations = async (petId: number): Promise<VaccinationListResponse> => {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/vaccinations/pet/${petId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vaccinations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pet vaccinations:', error);
    throw error;
  }
};

// Get all vaccinations for all user's pets
export const getAllVaccinations = async (): Promise<VaccinationRecord[]> => {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/vaccinations/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all vaccinations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching all vaccinations:', error);
    throw error;
  }
};

// Get vaccination summary for a pet
export const getVaccinationSummary = async (petId: number): Promise<VaccinationSummary> => {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/vaccinations/pet/${petId}/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vaccination summary: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vaccination summary:', error);
    throw error;
  }
};

// Get vaccinations due soon
export const getVaccinationsDueSoon = async (daysAhead: number = 30): Promise<VaccinationReminder[]> => {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/vaccinations/due-soon?days_ahead=${daysAhead}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vaccinations due soon: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching vaccinations due soon:', error);
    throw error;
  }
};

// Get overdue vaccinations
export const getOverdueVaccinations = async (): Promise<VaccinationReminder[]> => {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/vaccinations/overdue`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch overdue vaccinations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching overdue vaccinations:', error);
    throw error;
  }
};

// Create a new vaccination record
export const createVaccination = async (petId: number, vaccination: Partial<VaccinationRecord>): Promise<VaccinationRecord> => {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/vaccinations/pet/${petId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vaccination),
    });

    if (!response.ok) {
      throw new Error(`Failed to create vaccination: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating vaccination:', error);
    throw error;
  }
};

// Update a vaccination record
export const updateVaccination = async (vaccinationId: number, vaccination: Partial<VaccinationRecord>): Promise<VaccinationRecord> => {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/vaccinations/${vaccinationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vaccination),
    });

    if (!response.ok) {
      throw new Error(`Failed to update vaccination: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating vaccination:', error);
    throw error;
  }
};

// Delete a vaccination record
export const deleteVaccination = async (vaccinationId: number): Promise<void> => {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/vaccinations/${vaccinationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete vaccination: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting vaccination:', error);
    throw error;
  }
};