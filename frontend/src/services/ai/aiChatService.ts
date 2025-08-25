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
    console.log('🤖 AI Service: Initializing context with pets:', pets.length, pets.map(p => p.name));
    console.log('🤖 AI Service: Initializing context with tasks:', recentTasks.length);
    
    this.context = {
      pets,
      recentTasks,
      userPreferences: {
        preferredLanguage: 'en',
        notificationFrequency: 'medium'
      }
    };
    
    console.log('🤖 AI Service: Context initialized:', this.context);
  }

  /**
   * Send a message to the AI assistant
   */
  async sendMessage(
    userMessage: string, 
    petContext?: Pet
  ): Promise<ChatResponse> {
    try {
      console.log('🤖 AI Service: sendMessage called with:', { userMessage, petContext });
      console.log('🤖 AI Service: Current context:', this.context);
      
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
    const allPets = this.context?.pets || [];
    const selectedPet = petContext;
    const pets = selectedPet ? [selectedPet, ...allPets.filter(p => p.id !== selectedPet.id)] : allPets;

    console.log('🤖 AI Context - All pets:', allPets.length);
    console.log('🤖 AI Context - Selected pet:', selectedPet?.name);
    console.log('🤖 AI Context - Pets for response:', pets.map(p => p.name));

    // Enhanced context analysis
    switch (intent) {
      case 'health_concern':
        return this.handleHealthConcern(userMessage, pets, selectedPet);
      
      case 'behavior_issue':
        return this.handleBehaviorIssue(userMessage, pets, selectedPet);
      
      case 'feeding_question':
        return this.handleFeedingQuestion(userMessage, pets, selectedPet);
      
      case 'exercise_planning':
        return this.handleExercisePlanning(userMessage, pets, selectedPet);
      
      case 'grooming_advice':
        return this.handleGroomingAdvice(userMessage, pets, selectedPet);
      
      case 'task_creation':
        return this.handleTaskCreation(userMessage, pets, selectedPet);
      
      case 'emergency':
        return this.handleEmergency(userMessage, pets, selectedPet);
      
      case 'general_question':
      default:
        return this.handleGeneralQuestion(userMessage, pets, selectedPet);
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
   * Handle health-related concerns with improved context awareness
   */
  private handleHealthConcern(message: string, pets: Pet[], selectedPet?: Pet): ChatResponse {
    const lowerMessage = message.toLowerCase();
    
    if (selectedPet) {
      const petName = selectedPet.name;
      const petType = selectedPet.type || selectedPet.breedType || 'pet';
      const petAge = selectedPet.age || 'unknown age';
      const petWeight = selectedPet.weightKg || selectedPet.weight_kg || 'unknown weight';
      
      // Check for specific health keywords in the message
      if (lowerMessage.includes('knee') || lowerMessage.includes('limping') || lowerMessage.includes('leg')) {
        return {
          message: `I see you're concerned about ${petName}'s knee/leg issue. Limping in ${petType}s can be caused by various factors like arthritis, injury, or joint problems. Since ${petName} is ${petAge} years old and weighs ${petWeight}kg, this could be age-related or weight-related. I recommend scheduling a vet appointment to get this checked out. Would you like me to help you create a reminder for a vet visit?`,
          suggestedActions: [
            {
              id: 'schedule_vet',
              type: 'schedule_vet',
              label: 'Schedule Vet Appointment',
              description: 'Book an appointment for knee/leg examination'
            },
            {
              id: 'emergency_info',
              type: 'emergency',
              label: 'Emergency Contacts',
              description: 'Find nearby emergency veterinary clinics'
            }
          ]
        };
      }
      
      if (lowerMessage.includes('weight') || lowerMessage.includes('diet') || lowerMessage.includes('feeding')) {
        return {
          message: `Regarding ${petName}'s weight and diet - at ${petWeight}kg, ${petName} is a ${petAge} year old ${petType}. Proper nutrition is crucial for maintaining a healthy weight. I can help you create feeding reminders or schedule a vet checkup to discuss ${petName}'s dietary needs. What specific concerns do you have about ${petName}'s weight or feeding?`,
          suggestedActions: [
            {
              id: 'feeding_schedule',
              type: 'create_task',
              label: 'Set Feeding Reminders',
              description: 'Create regular feeding time reminders'
            },
            {
              id: 'schedule_vet',
              type: 'schedule_vet',
              label: 'Schedule Vet Checkup',
              description: 'Discuss weight and dietary concerns'
            }
          ]
        };
      }
      
      // Generic health concern response
      return {
        message: `I understand you're concerned about ${petName}'s health. ${petName} is a ${petAge} year old ${petType} weighing ${petWeight}kg. While I can provide general guidance, any serious health concerns should be addressed by a veterinarian immediately. What specific symptoms or behaviors have you noticed with ${petName}?`,
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
          }
        ]
      };
    } else {
      // Analyze all pets for health priorities
      const petHealthAnalysis = pets.map(pet => {
        const age = pet.age || 0;
        const weight = pet.weightKg || pet.weight_kg || 0;
        const lastVet = pet.lastVetVisit;
        const daysSinceLastVet = lastVet ? Math.floor((new Date().getTime() - new Date(lastVet).getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
        
        let priority = 'Low';
        let reason = '';
        
        // Age-based concerns
        if (age > 7) {
          priority = 'High';
          reason = 'Senior pet - needs regular checkups';
        } else if (age > 0 && age < 1) {
          priority = 'Medium';
          reason = 'Young pet - vaccination schedule important';
        }
        
        // Weight concerns
        if (weight > 0) {
          if (pet.type === 'dog' && (weight < 2 || weight > 50)) {
            priority = 'High';
            reason = 'Weight outside normal range';
          } else if (pet.type === 'cat' && (weight < 1 || weight > 8)) {
            priority = 'High';
            reason = 'Weight outside normal range';
          }
        }
        
        // Vet visit concerns
        if (daysSinceLastVet > 365) {
          priority = 'High';
          reason = 'No vet visit in over a year';
        } else if (daysSinceLastVet > 180) {
          priority = 'Medium';
          reason = 'Vet visit overdue';
        }
        
        return {
          name: pet.name,
          type: pet.type || 'unknown',
          age,
          weight,
          priority,
          reason,
          daysSinceLastVet
        };
      }).sort((a, b) => {
        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      });
      
      const highPriorityPets = petHealthAnalysis.filter(p => p.priority === 'High');
      const mediumPriorityPets = petHealthAnalysis.filter(p => p.priority === 'Medium');
      
      let message = `I've analyzed the health status of all your pets. Here's what I found:\n\n`;
      
      if (highPriorityPets.length > 0) {
        message += `🚨 **High Priority Checkups Needed:**\n`;
        highPriorityPets.forEach(pet => {
          message += `• **${pet.name}** (${pet.type}, ${pet.age} years): ${pet.reason}\n`;
        });
        message += `\n`;
      }
      
      if (mediumPriorityPets.length > 0) {
        message += `⚠️ **Medium Priority - Consider Soon:**\n`;
        mediumPriorityPets.forEach(pet => {
          message += `• **${pet.name}** (${pet.type}, ${pet.age} years): ${pet.reason}\n`;
        });
        message += `\n`;
      }
      
      if (highPriorityPets.length === 0 && mediumPriorityPets.length === 0) {
        message += `✅ **All pets appear to be in good health status!**\n\n`;
      }
      
      message += `**Immediate Action Required:** ${highPriorityPets.length > 0 ? 
        `${highPriorityPets[0].name} needs the most immediate attention due to: ${highPriorityPets[0].reason}` : 
        'No immediate action required, but regular checkups are recommended.'}`;
      
      return {
        message,
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
          }
        ]
      };
    }
  }

  /**
   * Handle behavior-related issues
   */
  private handleBehaviorIssue(_message: string, pets: Pet[], selectedPet?: Pet): ChatResponse {
    if (selectedPet) {
      const petName = selectedPet.name;
      const petType = selectedPet.type || selectedPet.breedType || 'pet';
      const behaviorIssues = selectedPet.behaviorIssues?.length > 0 ? 
        `I notice ${petName} has some recorded behavior concerns: ${selectedPet.behaviorIssues.join(', ')}. ` : '';
      
      return {
        message: `${behaviorIssues}Behavior issues with ${petName} (${petType}) can often be addressed with consistent training and patience. Could you describe the specific behavior you're concerned about? This will help me provide more targeted advice.`,
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
    } else {
      const behaviorSummary = pets.map(pet => {
        const issues = pet.behaviorIssues?.length > 0 ? ` - Issues: ${pet.behaviorIssues.join(', ')}` : ' - No recorded issues';
        return `${pet.name} (${pet.type || 'unknown type'})${issues}`;
      }).join('\n• ');
      
      return {
        message: `I can help with behavior issues for any of your pets. Here's what I know about their behavior:\n\n• ${behaviorSummary}\n\nWhich pet are you having behavior concerns with, and what specific issues are you seeing?`,
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
  }

  /**
   * Handle feeding and nutrition questions
   */
  private handleFeedingQuestion(_message: string, pets: Pet[], selectedPet?: Pet): ChatResponse {
    if (selectedPet) {
      const petName = selectedPet.name;
      const petType = selectedPet.type || selectedPet.breedType || 'pet';
      const age = selectedPet.age || 'unknown age';
      const weight = selectedPet.weightKg || selectedPet.weight_kg || 'unknown weight';
      const healthIssues = selectedPet.healthIssues?.length > 0 ? 
        `Note: ${petName} has some health considerations: ${selectedPet.healthIssues.join(', ')}. ` : '';
      
      return {
        message: `For ${petName} (${age} year old ${petType}, ${weight}kg), proper nutrition is essential for health and longevity. ${healthIssues}What specific feeding question do you have? I can help with portion sizes, feeding schedules, or dietary recommendations.`,
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
    } else {
      const feedingSummary = pets.map(pet => {
        const age = pet.age || 'unknown age';
        const weight = pet.weightKg || pet.weight_kg ? `${pet.weightKg || pet.weight_kg}kg` : 'unknown weight';
        const health = pet.healthIssues?.length > 0 ? ` - Health: ${pet.healthIssues.join(', ')}` : '';
        return `${pet.name} (${pet.type || 'unknown type'}, ${age} years, ${weight})${health}`;
      }).join('\n• ');
      
      return {
        message: `I can help with feeding questions for any of your pets. Here's their current status:\n\n• ${feedingSummary}\n\nWhich pet do you have feeding questions about, and what would you like to know?`,
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
  }

  /**
   * Handle exercise and activity planning
   */
  private handleExercisePlanning(_message: string, pets: Pet[], selectedPet?: Pet): ChatResponse {
    if (selectedPet) {
      const petName = selectedPet.name;
      const petType = selectedPet.type || selectedPet.breedType || 'pet';
      const age = selectedPet.age || 'unknown age';
      
      let exerciseMessage = `Exercise is crucial for ${petName}'s physical and mental health. `;
      if (petType === 'dog') {
        if (age !== 'unknown age' && typeof age === 'number') {
          if (age > 7) {
            exerciseMessage += `As a senior dog (${age} years old), ${petName} needs gentle, low-impact exercise like short walks and gentle play. `;
          } else if (age > 1) {
            exerciseMessage += `As a ${age} year old dog, ${petName} needs regular daily exercise including walks and active play. `;
          } else {
            exerciseMessage += `As a young dog, ${petName} needs frequent, short exercise sessions throughout the day. `;
          }
          exerciseMessage += `What type of exercise activities are you considering for ${petName}?`;
        }
      } else if (petType === 'cat') {
        exerciseMessage += `Cats need mental stimulation and play rather than long walks. Interactive toys, climbing structures, and short play sessions are ideal. `;
        exerciseMessage += `What type of play activities are you considering for ${petName}?`;
      } else {
        exerciseMessage += `${petName} needs exercise suited to their species and age. `;
        exerciseMessage += `What type of activities are you considering?`;
      }
      
      return {
        message: exerciseMessage,
        suggestedActions: [
          {
            id: 'walk_schedule',
            type: 'create_task',
            label: 'Schedule Daily Exercise',
            description: 'Set up a regular exercise routine'
          },
          {
            id: 'exercise_tips',
            type: 'view_tips',
            label: 'Exercise Ideas',
            description: 'Discover fun activities for your pet'
          }
        ]
      };
    } else {
      // Provide comprehensive exercise overview for all pets
      const exerciseSummary = pets.map(pet => {
        const type = pet.type || pet.breedType || 'pet';
        const age = pet.age || 'unknown age';
        let recommendation = '';
        
        if (type === 'dog') {
          if (age && typeof age === 'number' && age > 7) {
            recommendation = 'Gentle walks, short play sessions';
          } else if (age && typeof age === 'number' && age > 1) {
            recommendation = 'Daily walks, active play, training';
          } else {
            recommendation = 'Frequent short sessions, socialization';
          }
        } else if (type === 'cat') {
          recommendation = 'Interactive play, climbing, hunting games';
        } else {
          recommendation = 'Species-appropriate activities';
        }
        
        return `${pet.name} (${type}, ${age} years): ${recommendation}`;
      }).join('\n• ');
      
      return {
        message: `Here's an exercise overview for all your pets:\n\n• ${exerciseSummary}\n\nEach pet has different exercise needs based on their age, type, and health. Which pet would you like to create an exercise plan for?`,
        suggestedActions: [
          {
            id: 'walk_schedule',
            type: 'create_task',
            label: 'Schedule Daily Exercise',
            description: 'Set up a regular exercise routine'
          },
          {
            id: 'exercise_tips',
            type: 'view_tips',
            label: 'Exercise Ideas',
            description: 'Discover fun activities for your pets'
          }
        ]
      };
    }
  }

  /**
   * Handle grooming advice
   */
  private handleGroomingAdvice(_message: string, pets: Pet[], selectedPet?: Pet): ChatResponse {
    const pet = selectedPet || pets[0];
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
  private handleTaskCreation(_message: string, _pets: Pet[], _selectedPet?: Pet): ChatResponse {
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
  private handleEmergency(_message: string, _pets: Pet[], _selectedPet?: Pet): ChatResponse {
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
  private handleGeneralQuestion(_message: string, pets: Pet[], _selectedPet?: Pet): ChatResponse {
    let responseMessage = `Hi! I'm your AI pet care assistant. `;
    
    if (pets.length > 0) {
      responseMessage += `I can see you have ${pets.length} pet${pets.length > 1 ? 's' : ''}: `;
      responseMessage += pets.map(p => `${p.name} (${p.type || 'unknown type'}, ${p.age || 'unknown age'} years old)`).join(', ');
      responseMessage += `. `;
    }
    
    responseMessage += `I can help you with health concerns, behavior issues, feeding questions, exercise planning, grooming advice, and creating care reminders. I can also provide emergency guidance when needed. What would you like to know about your pet's care?`;
    
    return {
      message: responseMessage,
      suggestedActions: [
        {
          id: 'health_check',
          type: 'view_tips',
          label: 'Health Check',
          description: 'Get general health tips for your pets'
        },
        {
          id: 'care_schedule',
          type: 'create_task',
          label: 'Create Care Schedule',
          description: 'Set up regular care reminders'
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
   * Get current context for debugging
   */
  getCurrentContext(): AIContext | null {
    return this.context;
  }

  /**
   * Check if context has pets
   */
  hasPets(): boolean {
    return !!(this.context?.pets && this.context.pets.length > 0);
  }

  /**
   * Get pet count for debugging
   */
  getPetCount(): number {
    return this.context?.pets?.length || 0;
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
      suggestions.unshift(`How do I care for my ${pet.type || 'pet'}?`);
      if (pet.age && typeof pet.age === 'number' && pet.age > 7) {
        suggestions.push("Senior pet care tips");
      }
    }

    return suggestions;
  }
}

// Export singleton instance
export const aiChatService = new AIChatService();

