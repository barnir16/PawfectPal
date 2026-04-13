/**
 * Simplified AI Service - Direct approach inspired by PawfectPlanner
 */

import { Pet } from '../../types/pets/pet';
import { configService } from '../config/firebaseConfigService';
import { getToken } from '../api';
import { getTasks } from '../tasks/taskService';

interface AIServiceResponse {
  message: string;
  suggestedActions?: Array<{
    id: string;
    type: string;
    label: string;
    description: string;
  }>;
}

class AIService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'https://pawfectpal-production-2f07.up.railway.app';
  }

  /**
   * Detect primary language of a message
   */
  private detectLanguage(message: string): string {
    const hebrewPattern = /[\u0590-\u05FF]/;
    const hebrewMatches = (message.match(/[\u0590-\u05FF]/g) || []).length;
    const totalLetters = (message.match(/[a-zA-Z]/g) || []).length + hebrewMatches;
    
    if (totalLetters === 0) return 'en'; // Default to English
    
    const hebrewRatio = hebrewMatches / totalLetters;
    return hebrewRatio > 0.3 ? 'he' : 'en';
  }

  /**
   * Send a message to the AI with pet context
   */
  async sendMessage(
    userMessage: string, 
    pets: Pet[], 
    selectedPet?: Pet[]
  ): Promise<AIServiceResponse> {
    try {
      console.log('🤖 AI Service: Sending message with pets:', pets.length);
      
      // Detect language
      const language = this.detectLanguage(userMessage);
      console.log('🤖 AI Service: Detected language:', language);
      
      // Prepare pet context - simplified format
      const petContext = this.preparePetContext(pets, selectedPet);
      
      // Get authentication token
      const token = await getToken();
      console.log('🔑 AI Service Token:', token ? 'Present' : 'Missing');
      
      // Prepare request data
      const requestData = {
        message: userMessage,
        pet_context: petContext,
        prompt_language: language
      };

      console.log('🤖 AI Request Data:', JSON.stringify(requestData, null, 2));
      
      // Call the simplified backend AI endpoint
      const response = await fetch(`${this.apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 AI Service Error Response:', errorText);
        
        // Handle specific error types
        if (response.status === 408) {
          throw new Error('timeout');
        } else if (!navigator.onLine) {
          throw new Error('connection_lost');
        } else {
          throw new Error('service_unavailable');
        }
      }

      const data = await response.json();
      
      console.log('🤖 AI Response received:', data.message?.substring(0, 100) + '...');
      console.log('🤖 AI Suggested actions:', data.suggested_actions || []);
      
      return {
        message: data.message || 'I apologize, but I had trouble processing your request.',
        suggestedActions: this.processSuggestedActions(data.suggested_actions || [])
      };

    } catch (error) {
      console.error('🤖 AI Service Error:', error);
      
      // Return appropriate error message based on error type
      const errorMessage = this.getErrorMessage(error);
      return {
        message: errorMessage,
        suggestedActions: [
          {
            id: 'retry',
            type: 'retry',
            label: 'Try Again',
            description: 'Retry your request'
          }
        ]
      };
    }
  }

  /**
   * Prepare simplified pet context
   */
  private preparePetContext(pets: Pet[], selectedPet?: Pet[]): any {
    const petData = pets.map(pet => {
      return {
        name: pet.name || 'Unknown',
        type: pet.type || 'pet',
        breed: pet.breed || 'Unknown',
        age: this.calculateAge(pet),
        weight: pet.weightKg || pet.weight_kg || 0,
        gender: pet.gender || 'Unknown',
        health_issues: this.processHealthIssues(pet),
        behavior_issues: pet.behaviorIssues || pet.behavior_issues || [],
        is_vaccinated: Boolean(pet.isVaccinated || pet.is_vaccinated),
        is_neutered: Boolean(pet.isNeutered || pet.is_neutered),
        last_vet_visit: pet.lastVetVisit || pet.last_vet_visit || null,
        next_vet_visit: pet.nextVetVisit || pet.next_vet_visit || null
      };
    });

    return {
      pets: petData,
      selected_pet: selectedPet ? petData.find(p => p.name === selectedPet[0]?.name) : null,
      total_pets: pets.length
    };
  }

  /**
   * Process health issues for AI context
   */
  private processHealthIssues(pet: Pet): string[] {
    const issues = pet.healthIssues || pet.health_issues || [];
    const parsedIssues = Array.isArray(issues) ? issues : [];
    
    return parsedIssues.map(issue => {
      if (typeof issue === 'string') return issue.toLowerCase();
      return issue.description || 'unknown issue';
    });
  }

  /**
   * Calculate pet age (existing logic)
   */
  private calculateAge(pet: Pet): number {
    const birthDate = pet.birthDate || pet.birth_date;
    if (birthDate && (pet.isBirthdayGiven || pet.is_birthday_given)) {
      try {
        let birth;
        if (typeof birthDate === 'string' && birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = birthDate.split('-').map(Number);
          birth = new Date(year, month - 1, day);
        } else {
          birth = new Date(birthDate);
        }
        
        const now = new Date();
        const ageInDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
        return ageInDays / 365.25;
      } catch (error) {
        return pet.age || 0;
      }
    }
    return pet.age || 0;
  }

  /**
   * Process suggested actions from backend response
   */
  private processSuggestedActions(actions: any[]): Array<{
    id: string;
    type: string;
    label: string;
    description: string;
  }> {
    if (!Array.isArray(actions)) return [];
    
    return actions.map(action => {
      if (typeof action === 'string') {
        return {
          id: `action_${Date.now()}_${Math.random()}`,
          type: 'general',
          label: action,
          description: `Quick action: ${action}`
        };
      }
      
      return {
        id: action.id || `action_${Date.now()}_${Math.random()}`,
        type: action.type || 'general',
        label: action.label || action.action || 'Unknown Action',
        description: action.description || `Action: ${action.label || action.action}`
      };
    });
  }

  /**
   * Get appropriate error message based on error type
   */
  private getErrorMessage(error: any): string {
    const errorStr = String(error).toLowerCase();
    
    if (errorStr.includes('timeout')) {
      return 'Request timed out. Please try again with a shorter message.';
    } else if (errorStr.includes('connection_lost') || !navigator.onLine) {
      return 'Connection lost. Please check your internet connection and try again.';
    } else if (errorStr.includes('service_unavailable')) {
      return 'AI service is temporarily unavailable. Please try again later.';
    } else {
      return 'AI service error. Please try again or contact support.';
    }
  }

  /**
   * Reset conversation history (no longer needed with simplified approach)
   */
  resetConversation(): void {
    console.log('🤖 AI Service: Conversation reset (simplified approach - no localStorage needed)');
  }

  /**
   * Get conversation length (no longer tracked with simplified approach)
   */
  getConversationLength(): number {
    return 0;
  }
}

export const aiService = new AIService();