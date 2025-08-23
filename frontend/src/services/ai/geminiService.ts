import type { Pet } from '../../types/pets';
import type { Task } from '../../types/tasks/task';

/**
 * AI Assistant service for pet care advice
 * Provides intelligent recommendations based on pet data and best practices
 */

export interface AIResponse {
  message: string;
  suggestions?: string[];
  followUpQuestions?: string[];
  confidence: number;
  sources?: string[];
}

export interface PetContext {
  pet: Pet;
  recentTasks?: Task[];
  healthIssues?: string[];
  behaviorNotes?: string;
}

/**
 * Get pet care advice based on pet information
 */
export const getPetCareAdvice = async (
  pet: Pet,
  topic: 'health' | 'behavior' | 'nutrition' | 'exercise' | 'grooming'
): Promise<AIResponse> => {
  try {
    const advice = generatePetCareAdvice(pet, topic);
    return {
      message: advice.message,
      suggestions: advice.suggestions,
      followUpQuestions: advice.followUpQuestions,
      confidence: 0.85,
      sources: ['Veterinary best practices', 'Pet care guidelines', 'Breed-specific recommendations']
    };
  } catch (error) {
    console.error('Error getting pet care advice:', error);
    throw new Error('Failed to get pet care advice');
  }
};

/**
 * Get breed-specific information and recommendations
 */
export const getBreedRecommendations = async (
  breed: string,
  breedType: string
): Promise<AIResponse> => {
  try {
    const recommendations = generateBreedRecommendations(breed, breedType);
    return {
      message: recommendations.message,
      suggestions: recommendations.suggestions,
      followUpQuestions: recommendations.followUpQuestions,
      confidence: 0.80,
      sources: ['Breed standards', 'Veterinary databases', 'Expert recommendations']
    };
  } catch (error) {
    console.error('Error getting breed recommendations:', error);
    throw new Error('Failed to get breed recommendations');
  }
};

/**
 * Get training suggestions for specific behaviors
 */
export const getTrainingSuggestions = async (
  pet: Pet,
  behavior: string,
  isProblemBehavior: boolean = false
): Promise<AIResponse> => {
  try {
    const suggestions = generateTrainingSuggestions(pet, behavior, isProblemBehavior);
    return {
      message: suggestions.message,
      suggestions: suggestions.suggestions,
      followUpQuestions: suggestions.followUpQuestions,
      confidence: 0.90,
      sources: ['Professional dog training methods', 'Behavioral science', 'Veterinary behaviorists']
    };
  } catch (error) {
    console.error('Error getting training suggestions:', error);
    throw new Error('Failed to get training suggestions');
  }
};

/**
 * Get health monitoring advice
 */
export const getHealthMonitoringAdvice = async (
  pet: Pet,
  symptoms?: string[]
): Promise<AIResponse> => {
  try {
    const advice = generateHealthMonitoringAdvice(pet, symptoms);
    return {
      message: advice.message,
      suggestions: advice.suggestions,
      followUpQuestions: advice.followUpQuestions,
      confidence: 0.75,
      sources: ['Veterinary guidelines', 'Pet health databases', 'Preventive care recommendations']
    };
  } catch (error) {
    console.error('Error getting health monitoring advice:', error);
    throw new Error('Failed to get health monitoring advice');
  }
};

/**
 * Get nutrition and diet recommendations
 */
export const getNutritionAdvice = async (
  pet: Pet,
  currentDiet?: string,
  concerns?: string[]
): Promise<AIResponse> => {
  try {
    const advice = generateNutritionAdvice(pet, currentDiet, concerns);
    return {
      message: advice.message,
      suggestions: advice.suggestions,
      followUpQuestions: advice.followUpQuestions,
      confidence: 0.85,
      sources: ['Veterinary nutrition guidelines', 'Pet food standards', 'Dietary research']
    };
  } catch (error) {
    console.error('Error getting nutrition advice:', error);
    throw new Error('Failed to get nutrition advice');
  }
};

/**
 * Generate pet care advice based on pet data
 */
const generatePetCareAdvice = (pet: Pet, topic: string) => {
  const age = pet.age || 1;
  const weight = pet.weightKg || 10;
  const type = pet.type || 'dog';
  
  switch (topic) {
    case 'health':
      return {
        message: `For your ${age}-year-old ${type} weighing ${weight}kg, focus on regular veterinary check-ups every 6-12 months. Monitor for changes in appetite, energy levels, and bathroom habits.`,
        suggestions: [
          'Schedule annual wellness exams',
          'Keep vaccinations up to date',
          'Monitor weight and body condition',
          'Watch for signs of pain or discomfort'
        ],
        followUpQuestions: [
          'When was your last vet visit?',
          'Are there any specific health concerns?',
          'What vaccinations does your pet need?'
        ]
      };
      
    case 'behavior':
      return {
        message: `Behavior management for your ${age}-year-old ${type} should focus on positive reinforcement and consistent training.`,
        suggestions: [
          'Use positive reinforcement techniques',
          'Maintain consistent routines',
          'Provide mental stimulation',
          'Address any aggression or anxiety early'
        ],
        followUpQuestions: [
          'What specific behaviors concern you?',
          'How much exercise does your pet get?',
          'Are there any recent changes in behavior?'
        ]
      };
      
    case 'nutrition':
      return {
        message: `Your ${age}-year-old ${type} needs a balanced diet appropriate for their age, size, and activity level.`,
        suggestions: [
          'Choose high-quality pet food',
          'Follow feeding guidelines',
          'Avoid human food treats',
          'Ensure fresh water is always available'
        ],
        followUpQuestions: [
          'What type of food are you currently feeding?',
          'How many meals per day?',
          'Any food allergies or sensitivities?'
        ]
      };
      
    case 'exercise':
      return {
        message: `Exercise needs vary by breed and age. Your ${age}-year-old ${type} likely needs daily physical and mental stimulation.`,
        suggestions: [
          'Daily walks or play sessions',
          'Interactive toys and games',
          'Training sessions for mental exercise',
          'Adjust intensity based on age and health'
        ],
        followUpQuestions: [
          'How active is your pet currently?',
          'What types of exercise do they enjoy?',
          'Any physical limitations to consider?'
        ]
      };
      
    case 'grooming':
      return {
        message: `Regular grooming is essential for your ${type}'s health and comfort.`,
        suggestions: [
          'Brush regularly to prevent matting',
          'Check ears and eyes weekly',
          'Trim nails as needed',
          'Bathe only when necessary'
        ],
        followUpQuestions: [
          'What is your pet\'s coat type?',
          'How often do you currently groom?',
          'Any skin or coat issues?'
        ]
      };
      
    default:
      return {
        message: `I can provide advice on health, behavior, nutrition, exercise, and grooming for your ${type}.`,
        suggestions: ['Choose a specific topic for detailed advice'],
        followUpQuestions: ['What aspect of pet care would you like to learn more about?']
      };
  }
};

/**
 * Generate breed-specific recommendations
 */
const generateBreedRecommendations = (breed: string, breedType: string) => {
  const commonBreeds = {
    'Labrador Retriever': {
      exercise: 'High energy - needs 1-2 hours daily exercise',
      grooming: 'Moderate - weekly brushing, seasonal shedding',
      temperament: 'Friendly, intelligent, good with families',
      health: 'Watch for hip dysplasia, obesity'
    },
    'German Shepherd': {
      exercise: 'High energy - needs 2+ hours daily exercise',
      grooming: 'Moderate - weekly brushing, heavy shedding',
      temperament: 'Loyal, protective, intelligent',
      health: 'Watch for hip dysplasia, degenerative myelopathy'
    },
    'Persian': {
      exercise: 'Low energy - gentle play sessions',
      grooming: 'High maintenance - daily brushing required',
      temperament: 'Calm, affectionate, quiet',
      health: 'Watch for breathing issues, eye problems'
    },
    'Siamese': {
      exercise: 'Moderate energy - interactive play needed',
      grooming: 'Low maintenance - minimal brushing',
      temperament: 'Vocal, intelligent, social',
      health: 'Watch for dental issues, kidney disease'
    }
  };
  
  const breedInfo = commonBreeds[breed as keyof typeof commonBreeds];
  
  if (breedInfo) {
    return {
      message: `${breed} ${breedType}s are known for their ${breedInfo.temperament.toLowerCase()}.`,
      suggestions: [
        `Exercise: ${breedInfo.exercise}`,
        `Grooming: ${breedInfo.grooming}`,
        `Health monitoring: ${breedInfo.health}`,
        'Regular veterinary check-ups are essential'
      ],
      followUpQuestions: [
        'How much time can you dedicate to exercise?',
        'Are you prepared for the grooming requirements?',
        'Do you have experience with this breed?'
      ]
    };
  }
  
  return {
    message: `${breed} ${breedType}s can make wonderful companions. Research their specific needs before adoption.`,
    suggestions: [
      'Research breed characteristics',
      'Consult with breeders or rescue organizations',
      'Consider your lifestyle compatibility',
      'Prepare for their specific care requirements'
    ],
    followUpQuestions: [
      'What attracts you to this breed?',
      'What is your experience level with pets?',
      'How much time can you dedicate to care?'
    ]
  };
};

/**
 * Generate training suggestions
 */
const generateTrainingSuggestions = (pet: Pet, behavior: string, isProblemBehavior: boolean) => {
  const age = pet.age || 1;
  const type = pet.type || 'dog';
  
  if (isProblemBehavior) {
    return {
      message: `Addressing the problem behavior "${behavior}" in your ${age}-year-old ${type} requires patience and consistency.`,
      suggestions: [
        'Identify the root cause of the behavior',
        'Use positive reinforcement techniques',
        'Avoid punishment-based methods',
        'Consider professional training if needed',
        'Maintain consistent routines'
      ],
      followUpQuestions: [
        'When did this behavior start?',
        'What triggers the behavior?',
        'Have you tried any training methods?'
      ]
    };
  }
  
  return {
    message: `Teaching new behaviors to your ${age}-year-old ${type} is a great way to bond and provide mental stimulation.`,
    suggestions: [
      'Start with basic commands',
      'Use clicker training or verbal markers',
      'Keep sessions short and fun',
      'Practice in different environments',
      'Reward progress consistently'
    ],
    followUpQuestions: [
      'What specific behavior do you want to teach?',
      'How much time can you dedicate to training?',
      'What motivates your pet (food, toys, praise)?'
    ]
  };
};

/**
 * Generate health monitoring advice
 */
const generateHealthMonitoringAdvice = (pet: Pet, symptoms?: string[]) => {
  const age = pet.age || 1;
  const type = pet.type || 'dog';
  
  let message = `Regular health monitoring for your ${age}-year-old ${type} is crucial for early detection of issues.`;
  
  if (symptoms && symptoms.length > 0) {
    message += ` The symptoms you mentioned (${symptoms.join(', ')}) should be evaluated by a veterinarian.`;
  }
  
  return {
    message,
    suggestions: [
      'Monitor eating and drinking habits',
      'Check for changes in energy levels',
      'Watch bathroom habits and stool quality',
      'Examine skin and coat regularly',
      'Note any coughing, sneezing, or limping',
      'Schedule veterinary visits for concerning symptoms'
    ],
    followUpQuestions: [
      'How long have you noticed these symptoms?',
      'Are there any recent changes in routine?',
      'Has your pet been exposed to anything new?'
    ]
  };
};

/**
 * Generate nutrition advice
 */
const generateNutritionAdvice = (pet: Pet, currentDiet?: string, concerns?: string[]) => {
  const age = pet.age || 1;
  const weight = pet.weightKg || 10;
  const type = pet.type || 'dog';
  
  let message = `Nutrition for your ${age}-year-old ${type} weighing ${weight}kg should support their age and lifestyle.`;
  
  if (currentDiet) {
    message += ` Your current diet: ${currentDiet}.`;
  }
  
  if (concerns && concerns.length > 0) {
    message += ` Your concerns about ${concerns.join(', ')} are important to address.`;
  }
  
  return {
    message,
    suggestions: [
      'Choose age-appropriate food formulas',
      'Follow recommended feeding amounts',
      'Avoid table scraps and human food',
      'Provide fresh water at all times',
      'Consider dietary supplements if recommended by vet',
      'Monitor weight and adjust portions as needed'
    ],
    followUpQuestions: [
      'What is your pet\'s current activity level?',
      'Are there any food allergies or sensitivities?',
      'How does your pet respond to different foods?'
    ]
  };
};

/**
 * Check if AI service is available
 */
export const isGeminiServiceAvailable = (): boolean => {
  return true; // This service is always available as it runs locally
};

/**
 * Get conversation history (stored locally)
 */
export const getConversationHistory = async (): Promise<Array<{
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}>> => {
  try {
    const history = localStorage.getItem('pet_care_conversation_history');
    if (history) {
      const parsed = JSON.parse(history);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    }
    return [];
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    return [];
  }
};

/**
 * Save conversation message to history
 */
export const saveConversationMessage = async (message: {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}): Promise<void> => {
  try {
    const history = await getConversationHistory();
    history.push(message);
    
    // Keep only last 50 messages
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    localStorage.setItem('pet_care_conversation_history', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving conversation message:', error);
  }
};

/**
 * Clear conversation history
 */
export const clearConversationHistory = async (): Promise<void> => {
  try {
    localStorage.removeItem('pet_care_conversation_history');
  } catch (error) {
    console.error('Error clearing conversation history:', error);
  }
};
