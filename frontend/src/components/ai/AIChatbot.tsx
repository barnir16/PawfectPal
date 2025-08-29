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

import { aiChatService, type ChatMessage, type SuggestedAction } from '../../services/ai/aiChatService';
import { getPets } from '../../services/pets/petService';
import { getTasks } from '../../services/tasks/taskService';
import type { Pet } from '../../types/pets/pet';

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
        await aiChatService.initializeContext(petsData, tasksData);
        
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: `Hi! I'm your AI pet care assistant. I can help you with health concerns, behavior issues, feeding questions, exercise planning, grooming advice, and creating care reminders. ${selectedPet ? `I see you're asking about ${selectedPet.name}!` : 'How can I help you today?'}`,
          isUser: false,
          timestamp: new Date(),
          suggestedActions: aiChatService.getQuickSuggestions(selectedPet).map((suggestion, index) => ({
            id: `suggestion-${index}`,
            type: 'view_tips' as const,
            label: suggestion,
            description: ''
          }))
        };
        setMessages([welcomeMessage]);
        
        // Debug: Check context after initialization
        console.log('🤖 Chatbot: Context after initialization:', aiChatService.getCurrentContext());
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
      const response = await aiChatService.sendMessage(userMessage, selectedPet);
      console.log('🤖 Chatbot: AI response:', response);
      setMessages(aiChatService.getConversationHistory());
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

  const handleDebugContext = () => {
    console.log('🤖 Chatbot: Debug - Current context:', aiChatService.getCurrentContext());
    console.log('🤖 Chatbot: Debug - Has pets:', aiChatService.hasPets());
    console.log('🤖 Chatbot: Debug - Pet count:', aiChatService.getPetCount());
    console.log('🤖 Chatbot: Debug - Current pets state:', pets);
    console.log('🤖 Chatbot: Debug - Selected pet:', selectedPet);
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
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
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
                      {t('chatbot.thinking')}
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
                placeholder="Ask me about your pet's care..."
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
              {/* Debug button - remove after testing */}
              <IconButton
                color="secondary"
                onClick={handleDebugContext}
                size="small"
                title="Debug Context"
              >
                <BotIcon />
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
}

export const ChatToggleButton: React.FC<ChatToggleButtonProps> = ({
  onClick,
  unreadCount = 0,
}) => {
  return (
    <Fab
      color="primary"
      aria-label="Chat with AI assistant"
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

