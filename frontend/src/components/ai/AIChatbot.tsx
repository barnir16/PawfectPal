import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Fab,
  Slide,
  AppBar,
  Toolbar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Pets as PetsIcon,
  Schedule as ScheduleIcon,
  LocalHospital as VetIcon,
  Emergency as EmergencyIcon,
  Lightbulb as TipsIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '../../contexts/LocalizationContext';

import { aiService } from '../../services/ai/aiService';
import { getPets } from '../../services/pets/petService';
import { getTasks } from '../../services/tasks/taskService';
import type { Pet } from '../../types/pets/pet';

// Simplified types for the new AI service
interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  suggestedActions?: SuggestedAction[];
}

interface SuggestedAction {
  id: string;
  type: string;
  label: string;
  description: string;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPet?: Pet;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  isOpen,
  onClose,
  selectedPet,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate unique message ID
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Simple markdown renderer for basic formatting
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/\n/g, '<br />'); // Line breaks
  };

  // Initialize chatbot context
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Reset conversation history when opening chat
        aiService.resetConversation();
        
        const [petsData, tasksData] = await Promise.all([
          getPets(),
          getTasks()
        ]);
        
        console.log('🤖 Chatbot: Initializing with pets:', petsData);
        console.log('🤖 Chatbot: Initializing with tasks:', tasksData);
        console.log('🤖 Chatbot: Selected pet:', selectedPet);
        
        setPets(petsData);
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: `Hi! I'm your AI pet care assistant. I can help you with: Health concerns, Behavior issues, Feeding questions, Exercise planning, Grooming advice, Care reminders. Ask me about your pet's care...`,
          isUser: false,
          timestamp: new Date(),
          suggestedActions: [
            {
              id: 'exercise_guide',
              type: 'view_tips',
              label: 'Exercise Guidelines',
              description: 'Get exercise recommendations for all pets'
            },
            {
              id: 'health_check',
              type: 'view_tips',
              label: 'Health Assessment',
              description: 'Review your pet\'s health status'
            }
          ]
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, selectedPet]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('🤖 Chatbot: Sending message with selectedPet:', selectedPet);
      console.log('🤖 Chatbot: Current pets state:', pets);
      const response = await aiService.sendMessage(userMessage, pets, selectedPet);
      console.log('🤖 Chatbot: AI response:', response);
      // Add user message
      const userMessageObj: ChatMessage = {
        id: generateMessageId(),
        content: userMessage,
        isUser: true,
        timestamp: new Date()
      };
      
      // Add AI response
      const aiMessageObj: ChatMessage = {
        id: generateMessageId(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        suggestedActions: response.suggestedActions
      };
      
      setMessages(prev => [...prev, userMessageObj, aiMessageObj]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedAction = async (action: SuggestedAction) => {
    try {
      switch (action.type) {
        case 'create_task':
          navigate('/tasks/new');
          onClose();
          break;
        
        case 'schedule_vet':
        case 'schedule_checkup':
          // Navigate to vet appointment scheduling
          navigate('/tasks/new', { state: { taskType: 'vet_appointment' } });
          onClose();
          break;
        
        case 'emergency':
        case 'emergency_vet':
          // Show emergency contacts with better formatting
          const emergencyInfo = `
🚨 EMERGENCY VETERINARY CARE 🚨

🏥 24/7 Emergency Animal Hospital
📞 (555) 123-PETS
📍 123 Animal Emergency St, Your City

☠️ Animal Poison Control Center
📞 (888) 426-4435
🌐 aspca.org/pet-care/animal-poison-control

💰 Cost: Emergency fees start at $150-$300
⏰ Open: 24 hours, 7 days a week

If your pet is bleeding, unconscious, or having breathing difficulties - GO IMMEDIATELY!
          `.trim();
          alert(emergencyInfo);
          break;
        
        case 'health_check':
        case 'health_monitoring':
        case 'health_tracking':
          await handleQuickSuggestion(`How can I monitor ${selectedPets.length > 0 ? selectedPets[0].name : 'my pet'}'s health?`);
          break;
        
        case 'comfort_care':
          await handleQuickSuggestion(`What comfort measures can I use for ${selectedPets.length > 0 ? selectedPets[0].name : 'my pet'}?`);
          break;
        
        case 'vet_consultation':
        case 'diet_consultation':
          navigate('/tasks/new', { state: { taskType: 'vet_appointment', purpose: 'consultation' } });
          onClose();
          break;
        
        case 'retry':
          // Retry the last message
          if (messages.length > 0) {
            const lastUserMessage = [...messages].reverse().find(msg => msg.isUser);
            if (lastUserMessage) {
              await handleQuickSuggestion(lastUserMessage.content);
            }
          }
          break;
        
        case 'contact':
        case 'contact_support':
          await handleQuickSuggestion('I need help with Pet Care Support');
          break;
        
        case 'view_tips':
        case 'general_tips':
        case 'care_tips':
        case 'exercise_plan':
        case 'nutrition_tips':
          // Send the suggestion as a message
          await handleQuickSuggestion(action.label.replace(/^[🎾💡🐾💪]/, '').trim());
          break;
        
        case 'add_pet':
          navigate('/pets/new');
          onClose();
          break;
        
        default:
          console.log('🤖 Unhandled action type:', action.type, 'Action:', action);
          // For unknown actions, try to extract a message from the label
          await handleQuickSuggestion(action.label || action.description || 'Tell me more about this');
      }
    } catch (error) {
      console.error('🚨 Error handling suggested action:', error);
      await handleQuickSuggestion(`Tell me more about ${action.label}`);
    }
  };

  const handleQuickSuggestion = async (suggestion: string) => {
    setInputMessage(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };


  const getActionIcon = (type: SuggestedAction['type']) => {
    switch (type) {
      case 'create_task':
      case 'health_check':
      case 'health_monitoring':
      case 'health_tracking':
        return <ScheduleIcon />;
      case 'schedule_vet':
      case 'schedule_checkup':
      case 'vet_consultation':
      case 'diet_consultation':
        return <VetIcon />;
      case 'emergency':
      case 'emergency_vet':
        return <EmergencyIcon />;
      case 'view_tips':
      case 'general_tips':
      case 'care_tips':
      case 'exercise_plan':
      case 'nutrition_tips':
        return <TipsIcon />;
      case 'comfort_care':
        return <PetsIcon />;
      case 'add_pet':
        return <PetsIcon />;
      case 'retry':
      case 'contact':
      case 'contact_support':
        return <ChatIcon />;
      default:
        return <BotIcon />;
    }
  };

  const getActionColor = (type: SuggestedAction['type']) => {
    switch (type) {
      case 'emergency':
      case 'emergency_vet':
        return 'error';
      case 'schedule_vet':
      case 'schedule_checkup':
      case 'vet_consultation':
      case 'health_check':
      case 'health_monitoring':
      case 'health_tracking':
        return 'warning';
      case 'create_task':
      case 'comfort_care':
        return 'primary';
      case 'add_pet':
        return 'secondary';
      case 'retry':
        return 'default';
      case 'contact':
      case 'contact_support':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: { xs: 'calc(100vw - 40px)', sm: 400 },
            height: { xs: 'calc(100vh - 120px)', sm: 600 },
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1300,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: theme.shadows[8],
          }}
        >
          {/* Header */}
          <AppBar position="static" color="primary" elevation={0}>
            <Toolbar variant="dense">
              <Avatar sx={{ mr: 1, bgcolor: 'primary.dark' }}>
                <PetsIcon />
              </Avatar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {t('chatbot.title')}
              </Typography>
              <IconButton color="inherit" onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 1,
              backgroundColor: alpha(theme.palette.background.default, 0.5),
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  mb: 2,
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: message.isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      mx: 1,
                      bgcolor: message.isUser ? 'primary.main' : 'secondary.main',
                    }}
                  >
                    {message.isUser ? <PersonIcon /> : <BotIcon />}
                  </Avatar>
                  
                  <Box>
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: message.isUser 
                          ? 'primary.main' 
                          : 'background.paper',
                        color: message.isUser ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                        maxWidth: '100%',
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        component="div"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                      />
                    </Paper>

                    {/* Suggested Actions */}
                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {message.suggestedActions.map((action) => (
                          <Chip
                            key={action.id}
                            label={action.label}
                            icon={getActionIcon(action.type)}
                            size="small"
                            color={getActionColor(action.type)}
                            variant="outlined"
                            clickable
                            onClick={() => handleSuggestedAction(action)}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
            
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar sx={{ width: 32, height: 32, mx: 1, bgcolor: 'secondary.main' }}>
                    <BotIcon />
                  </Avatar>
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('ai.thinking')}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('ai.askAboutPetCare')}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </>
  );
};

interface ChatToggleButtonProps {
  onClick: () => void;
  unreadCount?: number;
  t: (key: string) => string;
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({
  onClick,
  unreadCount = 0,
  t,
}) => {
  return (
    <Fab
      color="primary"
      aria-label={t('ai.title')}
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1200,
      }}
    >
      <ChatIcon />
      {unreadCount > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: 'error.main',
            color: 'error.contrastText',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Box>
      )}
    </Fab>
  );
};

