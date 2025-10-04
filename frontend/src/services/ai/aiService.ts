/**
 * Simplified AI Service - Inspired by PawfectPlanner Python version
 * Direct API integration without complex state management
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
  private conversationHistory: Array<{ content: string; isUser: boolean }> = [];
  private readonly CONVERSATION_STORAGE_KEY = 'pawfectpal_ai_conversation';

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'https://pawfectpal-production.up.railway.app';
    this.loadConversationHistory();
  }

  /**
   * Send a message to the AI with pet context
   * This mimics the Python version's direct approach
   */
  async sendMessage(
    userMessage: string, 
    pets: Pet[], 
    selectedPet?: Pet[]
  ): Promise<AIServiceResponse> {
    try {
      console.log('🤖 AI Service: Sending message with pets:', pets.length);
      console.log('🤖 AI Service: Current conversation history length:', this.conversationHistory.length);
      
      // Ensure Firebase config is initialized
      if (!configService.isInitialized) {
        await configService.initialize();
      }
      
      // Add user message to conversation history with persistence
      this.addToHistory(userMessage, true);
      
      // Limit conversation history to prevent it from growing too large
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }
      
      // Prepare enhanced pet data for AI context  
      const petContext = await this.preparePetContext(pets, selectedPet);
      
      // Get authentication token
      const token = await getToken();
      console.log('🔑 AI Service Token:', token ? 'Present' : 'Missing');
      
      // Prepare request data with proper format - let backend create the prompt
      const requestData = {
        message: userMessage,
        pet_context: petContext,
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
      
      // Add AI response to conversation history with persistence
      const aiResponse = data.message || data.response || 'I apologize, but I had trouble processing your request.';
      this.addToHistory(aiResponse, false);
      
      console.log('🤖 AI Response received:', aiResponse.substring(0, 100) + '...');
      console.log('🤖 AI Service: Updated conversation history length:', this.conversationHistory.length);
      console.log('🤖 AI Suggested actions:', data.suggested_actions || data.suggestedActions || []);
      
      // Enhanced suggested actions processing
      const suggestedActions = this.processSuggestedActions(data.suggested_actions || data.suggestedActions || []);
      
      return {
        message: data.message || data.response || 'I apologize, but I had trouble processing your request.',
        suggestedActions: suggestedActions
      };

    } catch (error) {
      console.error('🤖 AI Service Error:', error);
      
      // Fallback to local AI logic if backend is unavailable
      return this.handleLocalAI(userMessage, pets, selectedPet);
    }
  }

  /**
   * Prepare enhanced pet context data (like our enhanced backend expects)
   */
  private async preparePetContext(pets: Pet[], selectedPet?: Pet[]): Promise<any> {
    try {
      // Fetch additional pet data for enhanced context
      const [tasksData, vaccinationsData] = await Promise.all([
        getTasks().catch(() => []),
        // Add vaccine service call when available
        Promise.resolve([])
      ]);

      const petData = pets.map(pet => {
        const petTasks = tasksData.filter(task => task.petIds?.includes(pet.id));
        const recentTaskNames = petTasks
          .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
          .slice(0, 3)
          .map(task => task.title);

        return {
          id: pet.id,
          name: pet.name || 'Unknown',
          type: pet.type || 'pet',
          breed: pet.breed || 'Unknown',
          age: this.calculateAge(pet),
          weight: pet.weightKg || pet.weight_kg || 0,
          gender: pet.gender || 'Unknown',
          health_issues: this.processHealthIssues(pet),
          behavior_issues: pet.behaviorIssues || pet.behavior_issues || [],
          medical_history: this.processMedicalHistory(pet),
          recent_tasks: recentTaskNames,
          vaccination_status: this.processVaccinationStatus(pet),
          is_vaccinated: Boolean(pet.isVaccinated || pet.is_vaccinated),
          is_neutered: Boolean(pet.isNeutered || pet.is_neutered),
          last_vet_visit: pet.lastVetVisit || pet.last_vet_visit || null,
          next_vet_visit: pet.nextVetVisit || pet.next_vet_visit || null
        };
      });

      return {
        pets: petData,
        selected_pet: selectedPet ? petData.find(p => p.name === selectedPet[0]?.name) : null,
        total_pets: pets.length,
        additional_context: {
          total_tasks: tasksData.length,
          overdue_tasks: tasksData.filter(task => !task.isCompleted && new Date(task.dateTime) <= new Date()).length,
          recent_vaccinations: vaccinationsData.length
        }
      };
    } catch (error) {
      console.warn('Error preparing enhanced pet context:', error);
      // Fallback to basic context
      return this.prepareBasicPetContext(pets, selectedPet);
    }
  }

  /**
   * Process health issues for enhanced context
   */
  private processHealthIssues(pet: Pet): string[] {
    const issues = pet.healthIssues || pet.health_issues || [];
    const parsedIssues = Array.isArray(issues) ? issues : [];
    
    // Convert to descriptive format for AI context
    return parsedIssues.map(issue => {
      if (typeof issue === 'string') return issue.toLowerCase();
      return issue.description || 'unknown issue';
    });
  }

  /**
   * Process medical history for enhanced context
   */
  private processMedicalHistory(pet: Pet): string[] {
    const history = pet.medicalHistory || pet.medical_history || [];
    const parsedHistory = Array.isArray(history) ? history : [];
    
    return parsedHistory.map(record => {
      if (typeof record === 'string') return record;
      return record.description || record.reason || 'unknown medical record';
    });
  }

  /**
   * Process vaccination status for enhanced context
   */
  private processVaccinationStatus(pet: Pet): string[] {
    const status = [];
    
    if (pet.isVaccinated || pet.is_vaccinated) {
      status.push('up to date');
    } else {
      status.push('needs vaccination updates');
    }
    
    // Add overdue vaccines if available
    if (pet.overdueVaccines && pet.overdueVaccines.length > 0) {
      status.push(`overdue vaccines: ${pet.overdueVaccines.join(', ')}`);
    }
    
    return status;
  }

  /**
   * Fallback basic context preparation
   */
  private prepareBasicPetContext(pets: Pet[], selectedPet?: Pet[]): any {
    const petData = pets.map(pet => ({
      id: pet.id,
      name: pet.name || 'Unknown',
      type: pet.type || 'pet',
      breed: pet.breed || 'Unknown',
      age: this.calculateAge(pet),
      weight: pet.weightKg || pet.weight_kg || 0,
      gender: pet.gender || 'Unknown',
      health_issues: [],
      behavior_issues: [],
      medical_history: [],
      recent_tasks: [],
      vaccination_status: [],
      is_vaccinated: Boolean(pet.isVaccinated || pet.is_vaccinated),
      is_neutered: Boolean(pet.isNeutered || pet.is_neutered),
      last_vet_visit: pet.lastVetVisit || pet.last_vet_visit || null,
      next_vet_visit: pet.nextVetVisit || pet.next_vet_visit || null
    }));

    return {
      pets: petData,
      selected_pet: selectedPet ? petData.find(p => p.name === selectedPet[0]?.name) : null,
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
      // Handle both string and object formats
      if (typeof action === 'string') {
        return {
          id: `action_${Date.now()}_${Math.random()}`,
          type: 'general',
          label: action,
          description: `Quick action: ${action}`
        };
      }
      
      // Handle object format
      return {
        id: action.id || `action_${Date.now()}_${Math.random()}`,
        type: action.type || 'general',
        label: action.label || action.action || 'Unknown Action',
        description: action.description || `Action: ${action.label || action.action}`
      };
    });
  }

  /**
   * Load conversation history from localStorage
   */
  private loadConversationHistory(): void {
    try {
      const stored = localStorage.getItem(this.CONVERSATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.conversationHistory = parsed;
          console.log('🤖 AI Service: Loaded conversation history:', this.conversationHistory.length, 'messages');
        }
      }
    } catch (error) {
      console.warn('🤖 AI Service: Failed to load conversation history:', error);
      this.conversationHistory = [];
    }
  }

  /**
   * Save conversation history to localStorage
   */
  private saveConversationHistory(): void {
    try {
      // Only keep last 50 messages to prevent localStorage bloat
      const historyToSave = this.conversationHistory.slice(-50);
      localStorage.setItem(this.CONVERSATION_STORAGE_KEY, JSON.stringify(historyToSave));
    } catch (error) {
      console.warn('🤖 AI Service: Failed to save conversation history:', error);
    }
  }

  /**
   * Add message to history and persist to localStorage
   */
  private addToHistory(content: string, isUser: boolean): void {
    this.conversationHistory.push({ content, isUser });
    this.saveConversationHistory();
  }

  /**
   * Reset conversation history (useful for starting fresh)
   */
  resetConversation(): void {
    this.conversationHistory = [];
    localStorage.removeItem(this.CONVERSATION_STORAGE_KEY);
    console.log('🤖 AI Service: Conversation history reset');
  }

  /**
   * Get current conversation history length
   */
  getConversationLength(): number {
    return this.conversationHistory.length;
  }

  /**
   * Fallback local AI logic if backend is unavailable
   */
  private handleLocalAI(userMessage: string, pets: Pet[], selectedPet?: Pet[]): AIServiceResponse {
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
        const type = pet.type || 'pet';
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
