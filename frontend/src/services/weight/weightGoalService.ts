import { getBaseUrl, getToken } from '../api';

export interface WeightGoal {
  id: number;
  pet_id: number;
  target_weight: number;
  weight_unit: string;
  goal_type: string;
  description?: string;
  is_active: boolean;
  target_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WeightGoalCreate {
  pet_id: number;
  target_weight: number;
  weight_unit: string;
  goal_type: string;
  description?: string;
  is_active: boolean;
  target_date?: string;
}

export interface WeightGoalUpdate {
  target_weight?: number;
  weight_unit?: string;
  goal_type?: string;
  description?: string;
  is_active?: boolean;
  target_date?: string;
}

export interface WeightGoalWithPet extends WeightGoal {
  pet_name: string;
  pet_type: string;
}

class WeightGoalService {
  static async getAllWeightGoals(): Promise<WeightGoalWithPet[]> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-goals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch weight goals: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching weight goals:', error);
      throw error;
    }
  }

  static async getWeightGoalsByPet(petId: number): Promise<WeightGoal[]> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-goals/pet/${petId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch weight goals: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching weight goals by pet:', error);
      throw error;
    }
  }

  static async createWeightGoal(weightGoal: WeightGoalCreate): Promise<WeightGoal> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-goals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weightGoal),
      });

      if (!response.ok) {
        throw new Error(`Failed to create weight goal: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating weight goal:', error);
      throw error;
    }
  }

  static async updateWeightGoal(goalId: number, weightGoal: WeightGoalUpdate): Promise<WeightGoal> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weightGoal),
      });

      if (!response.ok) {
        throw new Error(`Failed to update weight goal: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating weight goal:', error);
      throw error;
    }
  }

  static async deleteWeightGoal(goalId: number): Promise<void> {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${getBaseUrl()}/api/weight-goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete weight goal: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting weight goal:', error);
      throw error;
    }
  }
}

export default WeightGoalService;
