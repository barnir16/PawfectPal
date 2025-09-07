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
import type { Pet } from '../../types/pet';

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
          content: `${t('ai.welcome')} ${t('ai.helpWith')} ${t('ai.healthConcerns')}, ${t('ai.behaviorIssues')}, ${t('ai.feedingQuestions')}, ${t('ai.exercisePlanning')}, ${t('ai.groomingAdvice')}, ${t('ai.careReminders')}. ${selectedPet ? `${t('ai.viewPetDetails')} ${selectedPet.name}!` : t('ai.askAboutPetCare')}`,
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
    switch (action.type) {
      case 'create_task':
        navigate('/tasks/new');
        onClose();
        break;
      
      case 'schedule_vet':
        // Navigate to vet appointment scheduling
        navigate('/tasks/new', { state: { taskType: 'vet_appointment' } });
        onClose();
        break;
      
      case 'emergency':
        // Show emergency contacts
        alert('Emergency veterinary contacts:\n\n24/7 Emergency Animal Hospital\n📞 (555) 123-PETS\n🏥 123 Emergency St, Your City\n\nAnimal Poison Control\n📞 (888) 426-4435');
        break;
      
      case 'view_tips':
        // Send the suggestion as a message
        await handleQuickSuggestion(action.label);
        break;
      
      default:
        console.log('Unhandled action type:', action.type);
    }
  };

  const handleQuickSuggestion = async (suggestion: string) => {
    setInputMessage(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };


  const getActionIcon = (type: SuggestedAction['type']) => {
    switch (type) {
      case 'create_task':
        return <ScheduleIcon />;
      case 'schedule_vet':
        return <VetIcon />;
      case 'emergency':
        return <EmergencyIcon />;
      case 'view_tips':
        return <TipsIcon />;
      default:
        return <BotIcon />;
    }
  };

  const getActionColor = (type: SuggestedAction['type']) => {
    switch (type) {
      case 'emergency':
        return 'error';
      case 'schedule_vet':
        return 'warning';
      case 'create_task':
        return 'primary';
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

