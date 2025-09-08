/**
 * Simplified AI Service - Inspired by PawfectPlanner Python version
 * Direct API integration without complex state management
 */

import { Pet } from '../../types/pet';
import { configService } from '../config/firebaseConfigService';
import { getToken } from '../api';

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
  private conversationHistory: Array<{ content: string; isUser: boolean }> = [];

  constructor() {
    this.apiUrl = 'http://127.0.0.1:8000'; // Backend API URL
  }

  /**
   * Send a message to the AI with pet context
   * This mimics the Python version's direct approach
   */
  async sendMessage(
    userMessage: string, 
    pets: Pet[], 
    selectedPet?: Pet
  ): Promise<AIServiceResponse> {
    try {
      console.log('🤖 AI Service: Sending message with pets:', pets.length);
      
      // Ensure Firebase config is initialized
      if (!configService.isInitialized) {
        await configService.initialize();
      }
      
      // Add user message to conversation history
      this.conversationHistory.push({ content: userMessage, isUser: true });
      
      // Limit conversation history to prevent it from growing too large
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }
      
      // Prepare pet data for AI context (similar to Python version)
      const petContext = this.preparePetContext(pets, selectedPet);
      
      // Create the prompt with pet data injected
      const prompt = this.createPrompt(userMessage, petContext);
      
      // Get authentication token
      const token = await getToken();
      console.log('🔑 AI Service Token:', token ? 'Present' : 'Missing');
      
      // Prepare request data with proper format
      const requestData = {
        message: userMessage,
        pet_context: petContext,
        prompt: prompt,
        conversation_history: this.conversationHistory.map(msg => ({
          content: msg.content,
          isUser: msg.isUser ? "true" : "false"
        }))
      };
      
      console.log('🤖 AI Request Data:', JSON.stringify(requestData, null, 2));
      
      // Call the backend AI endpoint
      const response = await fetch(`${this.apiUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: AI endpoint might not require authentication
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🤖 AI Service Error Response:', errorText);
        throw new Error(`AI service error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Add AI response to conversation history
      const aiResponse = data.message || data.response || 'I apologize, but I had trouble processing your request.';
      this.conversationHistory.push({ content: aiResponse, isUser: false });
      
      console.log('🤖 AI Response received:', aiResponse.substring(0, 100) + '...');
      
      return {
        message: data.message || data.response || 'I apologize, but I had trouble processing your request.',
        suggestedActions: data.suggested_actions || []
      };

    } catch (error) {
      console.error('🤖 AI Service Error:', error);
      
      // Fallback to local AI logic if backend is unavailable
      return this.handleLocalAI(userMessage, pets, selectedPet);
    }
  }

  /**
   * Prepare pet context data (similar to Python version's data injection)
   */
  private preparePetContext(pets: Pet[], selectedPet?: Pet): any {
    const petData = pets.map(pet => ({
      name: pet.name || 'Unknown',
      type: pet.type || pet.breedType || 'pet',
      breed: pet.breed || 'Unknown',
      age: this.calculateAge(pet),
      weight: pet.weightKg || pet.weight_kg || 0,
      gender: pet.gender || 'Unknown',
      health_issues: pet.healthIssues || pet.health_issues || [],
      behavior_issues: pet.behaviorIssues || pet.behavior_issues || [],
      is_vaccinated: Boolean(pet.isVaccinated || pet.is_vaccinated),
      is_neutered: Boolean(pet.isNeutered || pet.is_neutered),
      last_vet_visit: pet.lastVetVisit || pet.last_vet_visit || null,
      next_vet_visit: pet.nextVetVisit || pet.next_vet_visit || null
    }));

    return {
      pets: petData,
      selected_pet: selectedPet ? petData.find(p => p.name === selectedPet.name) : null,
      total_pets: pets.length
    };
  }

  /**
   * Calculate pet age (using the same logic as our fixed calculation)
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
   * Create AI prompt with pet data injected (similar to Python version)
   */
  private createPrompt(userMessage: string, petContext: any): string {
    const petInfo = petContext.pets.map((pet: any) => 
      `- ${pet.name}: ${pet.type} (${pet.breed}), ${pet.age.toFixed(1)} years old, ${pet.weight}kg, ${pet.gender}`
    ).join('\n');

    return `You are a helpful pet care assistant. Here is the user's pet information:

PETS:
${petInfo}

${petContext.selected_pet ? `\nCURRENT FOCUS: ${petContext.selected_pet.name} (${petContext.selected_pet.type})\n` : ''}

USER QUESTION: ${userMessage}

Please provide helpful, specific advice based on the pet information provided. Be conversational and practical.`;
  }

  /**
   * Fallback local AI logic if backend is unavailable
   */
  private handleLocalAI(userMessage: string, pets: Pet[], selectedPet?: Pet): AIServiceResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // Handle age comparison questions
    if (lowerMessage.includes('oldest') || lowerMessage.includes('youngest')) {
      const isOldest = lowerMessage.includes('oldest');
      const petsWithAges = pets.map(pet => ({
        ...pet,
        calculatedAge: this.calculateAge(pet)
      }));
      
      const sortedPets = petsWithAges.sort((a, b) => 
        isOldest ? b.calculatedAge - a.calculatedAge : a.calculatedAge - b.calculatedAge
      );
      
      const targetPet = sortedPets[0];
      const ageText = targetPet.calculatedAge < 1 
        ? `${Math.floor(targetPet.calculatedAge * 12)} months`
        : `${Math.floor(targetPet.calculatedAge)} year${Math.floor(targetPet.calculatedAge) === 1 ? '' : 's'}`;
      
      return {
        message: `${targetPet.name} is your ${isOldest ? 'oldest' : 'youngest'} pet at ${ageText} old.`,
        suggestedActions: [
          {
            id: `tell_about_${targetPet.name.toLowerCase()}`,
            type: 'view_tips',
            label: `Tell me about ${targetPet.name}`,
            description: `Get specific advice for ${targetPet.name}`
          }
        ]
      };
    }
    
    // Handle exercise questions
    if (lowerMessage.includes('exercise')) {
      const exerciseGuidelines = pets.map(pet => {
        const age = this.calculateAge(pet);
        const type = pet.type || pet.breedType || 'pet';
        const breed = pet.breed || 'unknown breed';
        
        if (type === 'dog') {
          if (age < 1) {
            return `${pet.name} (${breed}, puppy): Short walks 5-10 minutes, 3-4 times daily + playtime`;
          } else if (age > 7) {
            return `${pet.name} (${breed}, senior): Gentle walks 15-20 minutes, 2-3 times daily`;
          } else {
            return `${pet.name} (${breed}, adult): 30-60 minutes daily - walks, playtime, and mental stimulation`;
          }
        } else if (type === 'cat') {
          if (age < 1) {
            return `${pet.name} (${breed}, kitten): Interactive play 15-20 minutes, 3-4 times daily`;
          } else if (age > 7) {
            return `${pet.name} (${breed}, senior): Gentle play 10-15 minutes, 2-3 times daily`;
          } else {
            return `${pet.name} (${breed}, adult): 20-30 minutes daily - interactive toys, climbing, and play`;
          }
        }
        return `${pet.name} (${breed}): Consult with a vet for species-specific exercise needs`;
      }).join('\n\n');
      
      return {
        message: `Here are exercise guidelines for each of your pets:\n\n${exerciseGuidelines}\n\nRemember: Always adjust based on your pet's individual energy level and health status!`,
        suggestedActions: [
          {
            id: 'exercise_tracking',
            type: 'create_task',
            label: 'Create Exercise Reminders',
            description: 'Set up daily exercise reminders for your pets'
          }
        ]
      };
    }
    
    // Default response
    return {
      message: `I'd be happy to help with your pet care questions! You have ${pets.length} pets: ${pets.map(p => p.name).join(', ')}. What specific aspect of their care would you like to know about?`,
      suggestedActions: [
        {
          id: 'exercise_guide',
          type: 'view_tips',
          label: 'Exercise Guidelines',
          description: 'Get exercise recommendations for all pets'
        },
        {
          id: 'feeding_guide',
          type: 'view_tips',
          label: 'Feeding Guide',
          description: 'Learn feeding schedules for all pets'
        }
      ]
    };
  }
}

export const aiService = new AIService();
