import React, { useEffect, useRef, useState } from 'react';
import {
  alpha,
  AppBar,
  Avatar,
  Box,
  Chip,
  Fab,
  IconButton,
  Paper,
  Slide,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Emergency as EmergencyIcon,
  LocalHospital as VetIcon,
  Person as PersonIcon,
  Pets as PetsIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Lightbulb as TipsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useLocalization } from '../../contexts/LocalizationContext';
import { aiService } from '../../services/ai/aiService';
import { getPets } from '../../services/pets/petService';
import { getTasks } from '../../services/tasks/taskService';
import type { Pet } from '../../types/pets/pet';

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

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const renderMarkdown = (text: string) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');

export const AIChatbot: React.FC<AIChatbotProps> = ({
  isOpen,
  onClose,
  selectedPet,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, isRTL } = useLocalization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        aiService.resetConversation();

        const [petsData] = await Promise.all([
          getPets(),
          getTasks(),
        ]);

        setPets(petsData);
        setMessages([
          {
            id: 'welcome',
            content: `${t('ai.welcome')} ${t('ai.helpWith')} ${t('ai.healthConcerns')}, ${t('ai.behaviorIssues')}, ${t('ai.feedingQuestions')}, ${t('ai.exercisePlanning')}, ${t('ai.groomingAdvice')}, ${t('ai.careReminders')}. ${t('ai.askAboutPetCare')}`,
            isUser: false,
            timestamp: new Date(),
            suggestedActions: [
              {
                id: 'exercise_guide',
                type: 'view_tips',
                label: t('ai.exercisePlanning'),
                description: t('ai.viewTips'),
              },
              {
                id: 'health_check',
                type: 'view_tips',
                label: t('ai.healthConcerns'),
                description: t('ai.viewTips'),
              },
            ],
          },
        ]);
      } catch (error) {
        console.error('Failed to initialize AI chat:', error);
      }
    };

    if (isOpen) {
      void initializeChat();
    }
  }, [isOpen, selectedPet, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) {
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .filter((message) => message.id !== 'welcome')
        .slice(-6)
        .map((message) => ({
          content: message.content,
          isUser: message.isUser,
        }));

      const response = await aiService.sendMessage(
        userMessage,
        pets,
        selectedPet ? [selectedPet] : [],
        conversationHistory,
      );

      const userMessageObj: ChatMessage = {
        id: generateMessageId(),
        content: userMessage,
        isUser: true,
        timestamp: new Date(),
      };

      const aiMessageObj: ChatMessage = {
        id: generateMessageId(),
        content: response.message,
        isUser: false,
        timestamp: new Date(),
        suggestedActions: response.suggestedActions,
      };

      setMessages((prev) => [...prev, userMessageObj, aiMessageObj]);
    } catch (error) {
      console.error('Failed to send AI chat message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = async (suggestion: string) => {
    setInputMessage(suggestion);
    setTimeout(() => {
      void handleSendMessage();
    }, 100);
  };

  const handleSuggestedAction = async (action: SuggestedAction) => {
    try {
      switch (action.type) {
        case 'create_task':
          navigate('/tasks/new');
          onClose();
          return;

        case 'schedule_vet':
        case 'schedule_checkup':
          navigate('/tasks/new', { state: { taskType: 'vet_appointment' } });
          onClose();
          return;

        case 'emergency':
        case 'emergency_vet':
          alert(
            [
              t('ai.emergencyInstructions') || 'Emergency veterinary care',
              '',
              t('ai.stayCalm') || 'Stay calm and assess the situation.',
              t('ai.emergencyVet') || 'Search for the nearest 24/7 emergency animal hospital and call ahead.',
              t('ai.transportSafely') || 'Transport your pet safely to the vet.',
              '',
              'ASPCA Animal Poison Control Center',
              '(888) 426-4435',
              'aspca.org/pet-care/animal-poison-control',
              '',
              t('ai.emergencySymptomsWarning') ||
                'If your pet is bleeding heavily, unconscious, having trouble breathing, or seizing, go to an emergency vet immediately.',
            ].join('\n'),
          );
          return;

        case 'health_check':
        case 'health_monitoring':
        case 'health_tracking':
          await handleQuickSuggestion(`How can I monitor ${selectedPet ? selectedPet.name : 'my pet'}'s health?`);
          return;

        case 'comfort_care':
          await handleQuickSuggestion(`What comfort measures can I use for ${selectedPet ? selectedPet.name : 'my pet'}?`);
          return;

        case 'vet_consultation':
        case 'diet_consultation':
          navigate('/tasks/new', { state: { taskType: 'vet_appointment', purpose: 'consultation' } });
          onClose();
          return;

        case 'retry': {
          const lastUserMessage = [...messages].reverse().find((message) => message.isUser);
          if (lastUserMessage) {
            await handleQuickSuggestion(lastUserMessage.content);
          }
          return;
        }

        case 'contact':
        case 'contact_support':
          await handleQuickSuggestion('I need help with Pet Care Support');
          return;

        case 'view_tips':
        case 'general_tips':
        case 'care_tips':
        case 'exercise_plan':
        case 'nutrition_tips':
          await handleQuickSuggestion(action.label.trim());
          return;

        case 'add_pet':
          navigate('/pets/new');
          onClose();
          return;

        default:
          await handleQuickSuggestion(action.label || action.description || 'Tell me more about this');
      }
    } catch (error) {
      console.error('Failed to handle AI suggested action:', error);
      await handleQuickSuggestion(`Tell me more about ${action.label}`);
    }
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
      case 'contact':
      case 'contact_support':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 80,
          right: isRTL ? 'auto' : 20,
          left: isRTL ? 20 : 'auto',
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
                      backgroundColor: message.isUser ? 'primary.main' : 'background.paper',
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
                          onClick={() => {
                            void handleSuggestedAction(action);
                          }}
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

        <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('ai.askAboutPetCare')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              disabled={isLoading}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={() => {
                void handleSendMessage();
              }}
              disabled={!inputMessage.trim() || isLoading}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Slide>
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
  const { isRTL } = useLocalization();
  return (
    <Fab
      color="primary"
      aria-label={t('ai.title')}
      onClick={onClick}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: isRTL ? 'auto' : 16,
        left: isRTL ? 16 : 'auto',
        zIndex: 1200,
      }}
    >
      <ChatIcon />
      {unreadCount > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: isRTL ? 'auto' : -8,
            left: isRTL ? -8 : 'auto',
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
