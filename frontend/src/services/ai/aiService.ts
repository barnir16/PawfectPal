/**
 * Simplified AI service used by the floating chatbot.
 */

import { Pet } from '../../types/pets/pet';
import { getBaseUrl, getToken } from '../api';
import { calculatePetAgeInYears } from '../../utils/petAge';

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
    this.apiUrl = getBaseUrl();
  }

  /**
   * Detect the dominant language of the user's message.
   */
  private detectLanguage(message: string): string {
    const hebrewMatches = (message.match(/[\u0590-\u05FF]/g) || []).length;
    const totalLetters = (message.match(/[a-zA-Z]/g) || []).length + hebrewMatches;

    if (totalLetters === 0) return 'en';

    const hebrewRatio = hebrewMatches / totalLetters;
    return hebrewRatio > 0.3 ? 'he' : 'en';
  }

  /**
   * Send a message to the AI with normalized pet context.
   */
  async sendMessage(
    userMessage: string,
    pets: Pet[],
    selectedPet?: Pet[]
  ): Promise<AIServiceResponse> {
    try {
      const language = this.detectLanguage(userMessage);
      const petContext = this.preparePetContext(pets, selectedPet);
      const token = await getToken();

      const requestData = {
        message: userMessage,
        pet_context: petContext,
        prompt_language: language
      };

      const response = await fetch(`${this.apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        if (response.status === 408) {
          throw new Error('timeout');
        } else if (!navigator.onLine) {
          throw new Error('connection_lost');
        } else {
          throw new Error('service_unavailable');
        }
      }

      const data = await response.json();

      return {
        message: data.message || 'I apologize, but I had trouble processing your request.',
        suggestedActions: this.processSuggestedActions(data.suggested_actions || [])
      };
    } catch (error) {
      console.error('AI service error:', error);

      return {
        message: this.getErrorMessage(error),
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
   * Prepare simplified pet context for the backend prompt builder.
   */
  private preparePetContext(pets: Pet[], selectedPet?: Pet[]): any {
    const petData = pets.map((pet) => {
      return {
        name: pet.name || 'Unknown',
        type: pet.type || 'pet',
        breed: pet.breed || 'Unknown',
        age: this.calculateAge(pet),
        weight: pet.weightKg || 0,
        gender: pet.gender || 'Unknown',
        health_issues: this.processHealthIssues(pet),
        behavior_issues: pet.behaviorIssues || [],
        is_vaccinated: Boolean(pet.isVaccinated),
        is_neutered: Boolean(pet.isNeutered),
        last_vet_visit: pet.lastVetVisit || null,
        next_vet_visit: pet.nextVetVisit || null
      };
    });

    return {
      pets: petData,
      selected_pet: selectedPet ? petData.find((p) => p.name === selectedPet[0]?.name) : null,
      total_pets: pets.length
    };
  }

  /**
   * Normalize health issues for AI context.
   */
  private processHealthIssues(pet: Pet): string[] {
    const issues = Array.isArray(pet.healthIssues) ? pet.healthIssues : [];
    return issues.map((issue) => issue.toLowerCase());
  }

  /**
   * Calculate pet age in years for prompt context.
   */
  private calculateAge(pet: Pet): number {
    return calculatePetAgeInYears(pet) ?? 0;
  }

  /**
   * Normalize suggested actions from backend response.
   */
  private processSuggestedActions(actions: any[]): Array<{
    id: string;
    type: string;
    label: string;
    description: string;
  }> {
    if (!Array.isArray(actions)) return [];

    return actions.map((action) => {
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
   * Map transport failures to user-facing messages.
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

  resetConversation(): void {
    // Conversation history currently lives on the backend or caller side.
  }

  getConversationLength(): number {
    return 0;
  }
}

export const aiService = new AIService();
