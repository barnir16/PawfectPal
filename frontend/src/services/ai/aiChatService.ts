import { apiRequest } from '../api';
import type { Pet } from '../../types/pets/pet';
import type { Task } from '../../types/tasks/task';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  petContext?: Pet;
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  id: string;
  type: 'create_task' | 'schedule_vet' | 'set_reminder' | 'view_tips' | 'emergency';
  label: string;
  description?: string;
  data?: any;
}

export interface AIContext {
  pets: Pet[];
  recentTasks: Task[];
  userPreferences?: {
    preferredLanguage?: 'en' | 'he';
    notificationFrequency?: 'high' | 'medium' | 'low';
  };
}

export interface ChatResponse {
  message: string;
  suggestedActions?: SuggestedAction[];
  contextUpdates?: {
    recommendedTasks?: Task[];
    alerts?: string[];
  };
}

/**
 * Enhanced AI Chat Service for comprehensive pet care assistance
 */
class AIChatService {
  private conversationHistory: ChatMessage[] = [];
  private context: AIContext | null = null;

  /**
   * Initialize chat with user context
   */
  async initializeContext(pets: Pet[], recentTasks: Task[] = []): Promise<void> {
    this.context = {
      pets,
      recentTasks,
      userPreferences: {
        preferredLanguage: 'en',
        notificationFrequency: 'medium'
      }
    };
  }

  /**
   * Send a message to the AI assistant
   */
  async sendMessage(
    userMessage: string, 
    petContext?: Pet
  ): Promise<ChatResponse> {
    try {
      // Add user message to history
      const userChatMessage: ChatMessage = {
        id: this.generateMessageId(),
        content: userMessage,
        isUser: true,
        timestamp: new Date(),
        petContext
      };
      this.conversationHistory.push(userChatMessage);

      // Determine the intent and generate response
      const response = await this.generateAIResponse(userMessage, petContext);

      // Add AI response to history
      const aiChatMessage: ChatMessage = {
        id: this.generateMessageId(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        suggestedActions: response.suggestedActions
      };
      this.conversationHistory.push(aiChatMessage);

      return response;
    } catch (error) {
      console.error('Error in AI chat:', error);
      return {
        message: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        suggestedActions: []
      };
    }
  }

  /**
   * Generate AI response based on user input and context
   */
  private async generateAIResponse(
    userMessage: string, 
    petContext?: Pet
  ): Promise<ChatResponse> {
    const intent = this.detectIntent(userMessage);
    const pets = petContext ? [petContext] : this.context?.pets || [];

    switch (intent) {
      case 'health_concern':
        return this.handleHealthConcern(userMessage, pets);
      
      case 'behavior_issue':
        return this.handleBehaviorIssue(userMessage, pets);
      
      case 'feeding_question':
        return this.handleFeedingQuestion(userMessage, pets);
      
      case 'exercise_planning':
        return this.handleExercisePlanning(userMessage, pets);
      
      case 'grooming_advice':
        return this.handleGroomingAdvice(userMessage, pets);
      
      case 'task_creation':
        return this.handleTaskCreation(userMessage, pets);
      
      case 'emergency':
        return this.handleEmergency(userMessage, pets);
      
      case 'general_question':
      default:
        return this.handleGeneralQuestion(userMessage, pets);
    }
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Emergency keywords
    if (this.containsKeywords(lowerMessage, ['emergency', 'urgent', 'poisoned', 'bleeding', 'unconscious', 'choking'])) {
      return 'emergency';
    }
    
    // Health-related keywords
    if (this.containsKeywords(lowerMessage, ['sick', 'ill', 'symptom', 'vet', 'health', 'medicine', 'pain', 'limping'])) {
      return 'health_concern';
    }
    
    // Behavior-related keywords
    if (this.containsKeywords(lowerMessage, ['behavior', 'training', 'aggressive', 'anxious', 'barking', 'destructive'])) {
      return 'behavior_issue';
    }
    
    // Feeding-related keywords
    if (this.containsKeywords(lowerMessage, ['food', 'feed', 'eat', 'diet', 'nutrition', 'hungry', 'meal'])) {
      return 'feeding_question';
    }
    
    // Exercise-related keywords
    if (this.containsKeywords(lowerMessage, ['exercise', 'walk', 'play', 'active', 'energy', 'tired'])) {
      return 'exercise_planning';
    }
    
    // Grooming-related keywords
    if (this.containsKeywords(lowerMessage, ['groom', 'brush', 'bath', 'nail', 'fur', 'coat', 'clean'])) {
      return 'grooming_advice';
    }
    
    // Task creation keywords
    if (this.containsKeywords(lowerMessage, ['remind', 'schedule', 'appointment', 'task', 'todo'])) {
      return 'task_creation';
    }
    
    return 'general_question';
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Handle health-related concerns
   */
  private handleHealthConcern(message: string, pets: Pet[]): ChatResponse {
    const pet = pets[0];
    const petName = pet?.name || 'your pet';
    
    return {
      message: `I understand you're concerned about ${petName}'s health. While I can provide general guidance, any serious health concerns should be addressed by a veterinarian immediately. What specific symptoms or behaviors have you noticed?`,
      suggestedActions: [
        {
          id: 'schedule_vet',
          type: 'schedule_vet',
          label: 'Schedule Vet Appointment',
          description: 'Book an appointment with your veterinarian'
        },
        {
          id: 'emergency_info',
          type: 'emergency',
          label: 'Emergency Contacts',
          description: 'Find nearby emergency veterinary clinics'
        },
        {
          id: 'health_tips',
          type: 'view_tips',
          label: 'Health Monitoring Tips',
          description: 'Learn how to monitor your pet\'s health at home'
        }
      ]
    };
  }

  /**
   * Handle behavior-related issues
   */
  private handleBehaviorIssue(message: string, pets: Pet[]): ChatResponse {
    const pet = pets[0];
    const petName = pet?.name || 'your pet';
    
    return {
      message: `Behavior issues with ${petName} can often be addressed with consistent training and patience. Could you describe the specific behavior you're concerned about? This will help me provide more targeted advice.`,
      suggestedActions: [
        {
          id: 'create_training_task',
          type: 'create_task',
          label: 'Create Training Schedule',
          description: 'Set up a regular training routine'
        },
        {
          id: 'behavior_tips',
          type: 'view_tips',
          label: 'Behavior Training Tips',
          description: 'Get guidance on positive reinforcement techniques'
        }
      ]
    };
  }

  /**
   * Handle feeding and nutrition questions
   */
  private handleFeedingQuestion(message: string, pets: Pet[]): ChatResponse {
    const pet = pets[0];
    const petName = pet?.name || 'your pet';
    const age = pet?.age || 'unknown age';
    const weight = pet?.weightKg || 'unknown weight';
    
    return {
      message: `For ${petName} (${age} years old, ${weight}kg), proper nutrition is essential for health and longevity. What specific feeding question do you have? I can help with portion sizes, feeding schedules, or dietary recommendations.`,
      suggestedActions: [
        {
          id: 'feeding_schedule',
          type: 'create_task',
          label: 'Set Feeding Reminders',
          description: 'Create regular feeding time reminders'
        },
        {
          id: 'nutrition_tips',
          type: 'view_tips',
          label: 'Nutrition Guidelines',
          description: 'Learn about proper pet nutrition'
        }
      ]
    };
  }

  /**
   * Handle exercise and activity planning
   */
  private handleExercisePlanning(message: string, pets: Pet[]): ChatResponse {
    const pet = pets[0];
    const petName = pet?.name || 'your pet';
    const type = pet?.type || 'pet';
    
    return {
      message: `Exercise is crucial for ${petName}'s physical and mental health. ${type === 'dog' ? 'Dogs' : 'Pets'} need regular physical activity suited to their age, breed, and health status. What type of exercise activities are you considering?`,
      suggestedActions: [
        {
          id: 'walk_schedule',
          type: 'create_task',
          label: 'Schedule Daily Walks',
          description: 'Set up a regular walking routine'
        },
        {
          id: 'exercise_tips',
          type: 'view_tips',
          label: 'Exercise Ideas',
          description: 'Discover fun activities for your pet'
        }
      ]
    };
  }

  /**
   * Handle grooming advice
   */
  private handleGroomingAdvice(message: string, pets: Pet[]): ChatResponse {
    const pet = pets[0];
    const petName = pet?.name || 'your pet';
    
    return {
      message: `Regular grooming keeps ${petName} healthy and comfortable. The grooming needs depend on their coat type, breed, and lifestyle. What specific grooming questions do you have?`,
      suggestedActions: [
        {
          id: 'grooming_schedule',
          type: 'create_task',
          label: 'Set Grooming Reminders',
          description: 'Create a regular grooming schedule'
        },
        {
          id: 'grooming_tips',
          type: 'view_tips',
          label: 'Grooming Guidelines',
          description: 'Learn proper grooming techniques'
        }
      ]
    };
  }

  /**
   * Handle task creation requests
   */
  private handleTaskCreation(message: string, pets: Pet[]): ChatResponse {
    return {
      message: `I can help you create reminders and tasks for your pet's care. What would you like to be reminded about? Common tasks include feeding times, medication, vet appointments, grooming, and exercise.`,
      suggestedActions: [
        {
          id: 'create_task',
          type: 'create_task',
          label: 'Create New Task',
          description: 'Set up a custom reminder or task'
        }
      ]
    };
  }

  /**
   * Handle emergency situations
   */
  private handleEmergency(message: string, pets: Pet[]): ChatResponse {
    return {
      message: `🚨 This appears to be an emergency situation. Please contact your veterinarian or emergency animal hospital immediately. Do not delay seeking professional help. Would you like me to help you find emergency veterinary services in your area?`,
      suggestedActions: [
        {
          id: 'emergency_contacts',
          type: 'emergency',
          label: 'Emergency Vet Contacts',
          description: 'Find nearby emergency veterinary clinics'
        },
        {
          id: 'first_aid',
          type: 'view_tips',
          label: 'Pet First Aid',
          description: 'Basic first aid while getting professional help'
        }
      ]
    };
  }

  /**
   * Handle general questions
   */
  private handleGeneralQuestion(message: string, pets: Pet[]): ChatResponse {
    return {
      message: `Hi! I'm your AI pet care assistant. I can help you with health concerns, behavior issues, feeding questions, exercise planning, grooming advice, and creating care reminders. I can also provide emergency guidance when needed. What would you like to know about your pet's care?`,
      suggestedActions: [
        {
          id: 'health_checkup',
          type: 'view_tips',
          label: 'Health Tips',
          description: 'Learn about preventive pet health care'
        },
        {
          id: 'daily_care',
          type: 'view_tips', 
          label: 'Daily Care Routine',
          description: 'Establish a comprehensive care routine'
        }
      ]
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get quick suggestions based on pet data
   */
  getQuickSuggestions(pet?: Pet): string[] {
    const suggestions = [
      "How often should I feed my pet?",
      "What are signs of illness to watch for?", 
      "How much exercise does my pet need?",
      "When should I schedule a vet checkup?",
      "Help me create a grooming schedule"
    ];

    if (pet) {
      suggestions.unshift(`How do I care for my ${pet.type}?`);
      if (pet.age && pet.age > 7) {
        suggestions.push("Senior pet care tips");
      }
    }

    return suggestions;
  }
}

// Export singleton instance
export const aiChatService = new AIChatService();

