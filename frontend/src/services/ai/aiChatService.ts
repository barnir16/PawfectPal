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
      
      // Validate input
      if (!userMessage || userMessage.trim().length === 0) {
        return {
          message: "Please provide a message so I can help you.",
          suggestedActions: []
        };
      }
      
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
      
      // Validate response
      if (!response || !response.message) {
        throw new Error('Invalid response generated');
      }

      // Add AI response to history
      const aiChatMessage: ChatMessage = {
        id: this.generateMessageId(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        suggestedActions: response.suggestedActions || []
      };
      this.conversationHistory.push(aiChatMessage);

      return response;
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Add error response to history
      const errorChatMessage: ChatMessage = {
        id: this.generateMessageId(),
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        isUser: false,
        timestamp: new Date(),
        suggestedActions: []
      };
      this.conversationHistory.push(errorChatMessage);
      
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
      
      case 'specific_question':
        return this.handleSpecificQuestion(userMessage, pets, selectedPet);
      
      case 'general_question':
        return this.handleGeneralQuestion(userMessage, pets, selectedPet);
      
      default:
        console.log('🤖 AI Service: No specific intent detected, using fallback response');
        return this.handleGeneralQuestion(userMessage, pets, selectedPet);
    }
  }



  /**
   * Detect user intent from message with improved context analysis
   */
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check for specific pet questions first (age, name, info)
    if (this.containsKeywords(lowerMessage, ['how old', 'age', 'what is', 'tell me about', 'who is', 'pet', 'she', 'he', 'her', 'his'])) {
      return 'specific_question';
    }
    
    // Emergency keywords - highest priority
    if (this.containsKeywords(lowerMessage, ['emergency', 'urgent', 'poisoned', 'bleeding', 'unconscious', 'choking', 'seizure', 'collapse'])) {
      return 'emergency';
    }
    
    // Health-related keywords - check for specific symptoms
    if (this.containsKeywords(lowerMessage, ['sick', 'ill', 'symptom', 'vet', 'health', 'medicine', 'pain', 'limping', 'vomiting', 'diarrhea', 'coughing', 'sneezing', 'itching', 'rash'])) {
      return 'health_concern';
    }
    
    // Behavior-related keywords - check for specific behaviors
    if (this.containsKeywords(lowerMessage, ['behavior', 'training', 'aggressive', 'anxious', 'barking', 'destructive', 'chewing', 'scratching', 'jumping', 'pulling', 'fearful', 'shy'])) {
      return 'behavior_issue';
    }
    
    // Feeding-related keywords - check for specific feeding concerns
    if (this.containsKeywords(lowerMessage, ['food', 'feed', 'eat', 'diet', 'nutrition', 'hungry', 'meal', 'portion', 'allergy', 'weight', 'obese', 'skinny', 'appetite'])) {
      return 'feeding_question';
    }
    
    // Exercise-related keywords - check for specific activity needs
    if (this.containsKeywords(lowerMessage, ['exercise', 'walk', 'play', 'active', 'energy', 'tired', 'lazy', 'hyper', 'bored', 'stimulation', 'enrichment'])) {
      return 'exercise_planning';
    }
    
    // Grooming-related keywords - check for specific grooming needs
    if (this.containsKeywords(lowerMessage, ['groom', 'brush', 'bath', 'nail', 'fur', 'coat', 'clean', 'shedding', 'matted', 'ear', 'dental', 'teeth'])) {
      return 'grooming_advice';
    }
    
    // Task creation keywords - check for scheduling needs
    if (this.containsKeywords(lowerMessage, ['remind', 'schedule', 'appointment', 'task', 'todo', 'routine', 'daily', 'weekly', 'monthly'])) {
      return 'task_creation';
    }
    
    // Check for specific questions that might need different handling
    if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why') || lowerMessage.includes('when')) {
      // These are specific questions that need contextual answers
      return 'specific_question';
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
      
      // Provide more specific and helpful responses based on the actual question
      if (lowerMessage.includes('knee') || lowerMessage.includes('limping') || lowerMessage.includes('leg')) {
        let specificAdvice = '';
        if (lowerMessage.includes('knee')) {
          specificAdvice = `For knee issues specifically, common causes include ligament tears, arthritis, or patellar luxation. `;
        } else if (lowerMessage.includes('limping')) {
          specificAdvice = `Limping can indicate pain, injury, or joint problems. `;
        }
        
        return {
          message: `${specificAdvice}Since ${petName} is ${petAge} years old and weighs ${petWeight}kg, this could be age-related arthritis, weight-related joint stress, or an injury. I recommend: 1) Rest and limited activity, 2) Monitor for worsening symptoms, 3) Schedule a vet appointment within 24-48 hours if the limping persists. Would you like me to help you create a vet appointment reminder?`,
          suggestedActions: [
            {
              id: 'schedule_vet',
              type: 'schedule_vet',
              label: 'Schedule Vet Appointment',
              description: 'Book an appointment for examination'
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
        // Provide specific dietary advice based on pet type and age
        let dietaryAdvice = '';
        const age = typeof petAge === 'number' ? petAge : parseFloat(petAge as string) || 0;
        
        if (petType === 'dog') {
          if (age < 1) {
            dietaryAdvice = 'Puppies need high-quality puppy food with frequent meals (3-4 times daily). ';
          } else if (age > 7) {
            dietaryAdvice = 'Senior dogs may need lower-calorie food with joint supplements. ';
          } else {
            dietaryAdvice = 'Adult dogs typically do well with 2 meals daily of high-quality adult food. ';
          }
        } else if (petType === 'cat') {
          if (age < 1) {
            dietaryAdvice = 'Kittens need kitten-specific food with high protein content. ';
          } else if (age > 7) {
            dietaryAdvice = 'Senior cats may need food with lower phosphorus and higher protein. ';
          } else {
            dietaryAdvice = 'Adult cats can be fed 2-3 times daily with high-quality cat food. ';
          }
        }
        
        return {
          message: `${dietaryAdvice}At ${petWeight}kg, ${petName} is a ${petAge} year old ${petType}. For specific dietary recommendations, I'd need to know: 1) Current food brand/type, 2) Feeding schedule, 3) Any food allergies or sensitivities. Would you like me to help you create a feeding schedule or schedule a vet consultation for personalized nutrition advice?`,
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
      
      // For other health concerns, ask for specific symptoms
      return {
        message: `I understand you're concerned about ${petName}'s health. To provide better guidance, could you tell me: 1) What specific symptoms or behaviors are you seeing? 2) When did this start? 3) Has anything changed in ${petName}'s routine or environment? This will help me give you more targeted advice.`,
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
  private handleBehaviorIssue(message: string, pets: Pet[], selectedPet?: Pet): ChatResponse {
    const lowerMessage = message.toLowerCase();
    
    // Check for specific behavior questions about pets not getting along
    if (lowerMessage.includes('not getting along') || lowerMessage.includes('fighting') || lowerMessage.includes('conflict') || lowerMessage.includes('aggressive')) {
      if (pets.length >= 2) {
        return {
          message: `I understand you're having issues with your pets not getting along. This is a common problem that can be resolved with proper management and training. Here are some immediate steps you can take:

1) **Separate them temporarily** - Give them space to calm down
2) **Identify triggers** - What causes the conflicts? Food, toys, attention?
3) **Gradual introduction** - Reintroduce them slowly under controlled conditions
4) **Positive reinforcement** - Reward calm behavior around each other
5) **Professional help** - Consider consulting a pet behaviorist

Which specific pets are having conflicts, and what triggers the aggressive behavior?`,
          suggestedActions: [
            {
              id: 'behavior_tips',
              type: 'view_tips',
              label: 'Pet Conflict Resolution',
              description: 'Learn techniques for managing multi-pet households'
            },
            {
              id: 'schedule_vet',
              type: 'schedule_vet',
              label: 'Consult Behaviorist',
              description: 'Get professional behavior consultation'
            }
          ]
        };
      }
    }
    
    if (selectedPet) {
      const petName = selectedPet.name;
      const petType = selectedPet.type || selectedPet.breedType || 'pet';
      const petAge = selectedPet.age || 'unknown age';
      const behaviorIssues = selectedPet.behaviorIssues?.length > 0 ? 
        `I notice ${petName} has some recorded behavior concerns: ${selectedPet.behaviorIssues.join(', ')}. ` : '';
      
      // Provide specific behavior advice based on the actual question
      let specificAdvice = '';
      if (lowerMessage.includes('aggressive') || lowerMessage.includes('biting') || lowerMessage.includes('growling')) {
        specificAdvice = `Aggression in ${petType}s can stem from fear, pain, or territorial behavior. `;
      } else if (lowerMessage.includes('anxious') || lowerMessage.includes('fearful') || lowerMessage.includes('scared')) {
        specificAdvice = `Anxiety in ${petType}s often results from lack of socialization, past trauma, or environmental changes. `;
      } else if (lowerMessage.includes('barking') || lowerMessage.includes('meowing') || lowerMessage.includes('vocal')) {
        specificAdvice = `Excessive vocalization can indicate boredom, attention-seeking, or underlying anxiety. `;
      } else if (lowerMessage.includes('destructive') || lowerMessage.includes('chewing') || lowerMessage.includes('scratching')) {
        specificAdvice = `Destructive behavior is often a sign of boredom, lack of exercise, or separation anxiety. `;
      }
      
      return {
        message: `${behaviorIssues}${specificAdvice}For ${petName} (${petType}, ${petAge} years), I recommend: 1) Identify the trigger, 2) Provide appropriate outlets (toys, exercise), 3) Use positive reinforcement training, 4) Consider professional help for severe cases. What specific behavior are you seeing, and when does it occur?`,
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
   * Handle specific questions with intelligent analysis
   */
  private handleSpecificQuestion(message: string, pets: Pet[], selectedPet?: Pet): ChatResponse {
    const lowerMessage = message.toLowerCase();
    
    // Check if message mentions a specific pet by name
    let targetPet = selectedPet;
    if (!targetPet) {
      targetPet = pets.find(pet => 
        lowerMessage.includes(pet.name.toLowerCase()) ||
        lowerMessage.includes('she') || 
        lowerMessage.includes('he') ||
        lowerMessage.includes('her') ||
        lowerMessage.includes('his')
      );
    }
    
    // If we found a specific pet, provide targeted answers
    if (targetPet) {
      const petName = targetPet.name;
      const petType = targetPet.type || targetPet.breedType || 'pet';
      const petAge = targetPet.age || 0;
      const petBreed = targetPet.breed || 'unknown breed';
      
      // Handle age questions
      if (lowerMessage.includes('how old') || lowerMessage.includes('age')) {
        if (petAge && petAge > 0) {
          return {
            message: `${petName} is ${petAge} year${petAge === 1 ? '' : 's'} old. ${petAge < 1 ? 'This is a very young ' : petAge > 7 ? 'This is a senior ' : 'This is an adult '}${petType}.`,
            suggestedActions: [
              {
                id: 'care_tips',
                type: 'view_tips',
                label: 'Age-Appropriate Care',
                description: `Get care tips for ${petName}'s age`
              }
            ]
          };
        } else {
          return {
            message: `I don't have ${petName}'s age information in the system. You can update this in ${petName}'s profile.`,
            suggestedActions: [
              {
                id: 'update_profile',
                type: 'view_tips',
                label: 'Update Pet Profile',
                description: 'Add missing information'
              }
            ]
          };
        }
      }
      
      // Handle general pet info questions
      if (lowerMessage.includes('what is') || lowerMessage.includes('tell me about') || lowerMessage.includes('who is')) {
        const ageInfo = petAge && petAge > 0 ? `${petAge} year${petAge === 1 ? '' : 's'} old` : 'age unknown';
        return {
          message: `${petName} is a ${ageInfo} ${petType} of the ${petBreed} breed. ${petName} is a beloved member of your family and I'm here to help with their care!`,
          suggestedActions: [
            {
              id: 'care_schedule',
              type: 'create_task',
              label: 'Create Care Schedule',
              description: `Set up care reminders for ${petName}`
            },
            {
              id: 'health_check',
              type: 'view_tips',
              label: 'Health Assessment',
              description: `Review ${petName}'s health status`
            }
          ]
        };
      }
      
      // Analyze the specific question type
      if (lowerMessage.includes('how often')) {
         const age = typeof petAge === 'number' ? petAge : parseFloat(petAge as string) || 0;
         
         if (lowerMessage.includes('feed') || lowerMessage.includes('food')) {
           if (petType === 'dog') {
             if (age < 1) return { message: `${petName} is a puppy and should be fed 3-4 times daily with high-quality puppy food.`, suggestedActions: [] };
             else if (age > 7) return { message: `${petName} is a senior dog and typically does well with 2 meals daily, possibly with smaller portions.`, suggestedActions: [] };
             else return { message: `${petName} is an adult dog and should be fed 2 times daily with high-quality adult dog food.`, suggestedActions: [] };
           } else if (petType === 'cat') {
             if (age < 1) return { message: `${petName} is a kitten and should be fed 3-4 times daily with kitten-specific food.`, suggestedActions: [] };
             else if (age > 7) return { message: `${petName} is a senior cat and may prefer smaller, more frequent meals (2-3 times daily).`, suggestedActions: [] };
             else return { message: `${petName} is an adult cat and can be fed 2-3 times daily with high-quality cat food.`, suggestedActions: [] };
           }
         } else if (lowerMessage.includes('walk') || lowerMessage.includes('exercise')) {
           if (petType === 'dog') {
             if (age < 1) return { message: `${petName} is a puppy and needs short, frequent walks (5-10 minutes, 3-4 times daily) plus playtime.`, suggestedActions: [] };
             else if (age > 7) return { message: `${petName} is a senior dog and may prefer shorter, gentler walks (15-20 minutes, 2-3 times daily).`, suggestedActions: [] };
             else return { message: `${petName} is an adult dog and typically needs 30-60 minutes of exercise daily, including walks and playtime.`, suggestedActions: [] };
           }
         } else if (lowerMessage.includes('groom') || lowerMessage.includes('brush')) {
           if (petType === 'dog') {
             if (lowerMessage.includes('long') || lowerMessage.includes('thick')) {
               return { message: `${petName} has a long/thick coat and should be brushed daily to prevent matting.`, suggestedActions: [] };
             } else {
               return { message: `${petName} should be brushed 2-3 times weekly, with more frequent brushing during shedding seasons.`, suggestedActions: [] };
             }
           } else if (petType === 'cat') {
             return { message: `${petName} should be brushed 2-3 times weekly, and most cats benefit from regular nail trimming every 2-3 weeks.`, suggestedActions: [] };
           }
         }
       }
      
      // Default response for specific pet questions
      return {
        message: `I'd be happy to help with ${petName}! ${petName} is a ${petAge && petAge > 0 ? petAge + ' year old ' : ''}${petType}. What specific aspect of ${petName}'s care would you like to know about? I can help with feeding, exercise, grooming, health, and behavior.`,
        suggestedActions: [
          {
            id: 'care_tips',
            type: 'view_tips',
            label: 'Care Guidelines',
            description: `Get specific care recommendations for ${petName}`
          },
          {
            id: 'health_check',
            type: 'view_tips',
            label: 'Health Assessment',
            description: `Review ${petName}'s health status`
          }
        ]
      };
    }
    
    // For general specific questions without a selected pet
    return {
      message: `I'd be happy to help with that! To provide the most relevant answer, could you tell me: 1) Which pet you're asking about, or 2) Provide more details about your specific question?`,
      suggestedActions: [
        {
          id: 'select_pet',
          type: 'view_tips',
          label: 'Select a Pet',
          description: 'Choose a pet to get specific advice'
        }
      ]
    };
  }

  /**
   * Handle general questions with better context awareness
   */
  private handleGeneralQuestion(_message: string, pets: Pet[], selectedPet?: Pet): ChatResponse {
    const lowerMessage = _message.toLowerCase();
    
    // If a specific pet is selected, provide more targeted help
    if (selectedPet) {
      const petName = selectedPet.name;
      const petType = selectedPet.type || selectedPet.breedType || 'pet';
      const petAge = selectedPet.age || 'unknown age';
      
      return {
        message: `I'm here to help with ${petName}'s care! ${petName} is a ${petAge} year old ${petType}. I can help with: 1) Health monitoring and vet appointments, 2) Feeding and nutrition advice, 3) Exercise and training plans, 4) Grooming and care routines, 5) Creating reminders for important tasks. What specific aspect of ${petName}'s care would you like to discuss?`,
        suggestedActions: [
          {
            id: 'health_check',
            type: 'view_tips',
            label: 'Health Assessment',
            description: 'Review health status and recommendations'
          },
          {
            id: 'care_schedule',
            type: 'create_task',
            label: 'Create Care Schedule',
            description: 'Set up daily care routines'
          },
          {
            id: 'vet_appointment',
            type: 'schedule_vet',
            label: 'Schedule Vet Visit',
            description: 'Book a checkup appointment'
          }
        ]
      };
    }
    
    // For general questions, provide overview and ask for specifics
    let responseMessage = `Hi! I'm your AI pet care assistant. `;
    
    if (pets.length > 0) {
      responseMessage += `I can see you have ${pets.length} pet${pets.length > 1 ? 's' : ''}: `;
      responseMessage += pets.map(p => `${p.name} (${p.type || 'unknown type'}, ${p.age || 'unknown age'} years old)`).join(', ');
      responseMessage += `. `;
    }
    
    // Check if this is a specific question that we can answer directly
    if (lowerMessage.includes('tips') || lowerMessage.includes('advice') || lowerMessage.includes('help')) {
      responseMessage += `I'd be happy to help! I can provide specific advice on pet care, behavior training, health monitoring, and more. What would you like to know about?`;
    } else {
      responseMessage += `I can help you with health concerns, behavior issues, feeding questions, exercise planning, grooming advice, and creating care reminders. To provide the best help, could you tell me: 1) Which pet you're asking about, or 2) What specific care topic you need help with?`;
    }
    
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

