import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Button,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chat/chatService';
import { ServiceRequestService } from '../../services/serviceRequests/serviceRequestService';
import { getPets } from '../../services/pets/petService';
import { ServiceContextPanel } from './ServiceContextPanel';
import { EnhancedChatWindow } from './EnhancedChatWindow';
import type { ChatMessage, ChatMessageCreate } from '../../types/services/chat';
import type { ServiceRequest } from '../../types/services/serviceRequest';

export const ServiceRequestChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);


  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch service request details
      const serviceRequest = await ServiceRequestService.getServiceRequest(parseInt(id));
      
      // If service request doesn't have pets, fetch them separately
      if (!serviceRequest.pets || serviceRequest.pets.length === 0) {
        try {
          const pets = await getPets();
          serviceRequest.pets = pets.filter(pet => serviceRequest.pet_ids?.includes(pet.id));
        } catch (petError) {
          console.error('Could not fetch pets for the service request.', petError);
        }
      }
      
      // Fetch conversation messages with better error handling
      try {
        const conversationData = await chatService.getConversation(parseInt(id));
        
        // Ensure messages is always an array
        const messages = conversationData?.messages || [];
        setMessages(messages.map(processMessage));
      } catch (chatError: any) {
        console.error('Could not fetch the existing conversation. Starting with an empty chat.', chatError);
        // Start with empty messages if conversation fetch fails
        setMessages([]);
      }
      
      setRequest(serviceRequest);
    } catch (err: any) {
      console.error('Error fetching chat data:', err);
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageData: ChatMessageCreate) => {
    if (!id || sending) return;

    try {
      setSending(true);
      
      // Send message via API
      const sentMessage = await chatService.sendMessage(parseInt(id), {
        ...messageData,
        service_request_id: parseInt(id),
      });

      // Convert backend response to frontend format
      const processedMessage = processMessage(sentMessage);

      // If the API returns undefined or empty object, create a mock message
      if (!sentMessage || (typeof sentMessage === 'object' && Object.keys(sentMessage).length === 0)) {
        console.error('Chat API returned an empty payload. Using a local fallback message.');
        const mockMessage: ChatMessage = {
          id: Date.now(),
          service_request_id: parseInt(id),
          sender_id: user?.id || 0,
          message: messageData.message,
          message_type: messageData.message_type || 'text',
          is_read: false,
          is_edited: false,
          created_at: new Date().toISOString(),
          delivery_status: 'sent',
          sender: {
            id: user?.id || 0,
            username: user?.username || 'You',
            email: user?.email || '',
            is_active: true,
            is_email_verified: true,
            is_phone_verified: false,
            date_joined: new Date().toISOString(),
            is_provider: false
          }
        };
        setMessages(prev => [...prev, mockMessage]);
      } else {
        setMessages(prev => [...prev, processedMessage]);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const processMessage = (message: ChatMessage): ChatMessage => {
    // Ensure message is valid
    if (!message) {
      console.error('Invalid message received from chat service.');
      return {
        id: 0,
        service_request_id: 0,
        sender_id: 0,
        message: '',
        message_type: 'text',
        is_read: false,
        is_edited: false,
        created_at: new Date().toISOString(),
        delivery_status: 'sent',
        attachments: []
      };
    }
    
    return {
      ...message,
      attachments: message.attachments || []
    };
  };

  const handleQuickAction = async (action: string, data?: any) => {
    try {
      let sentMessage: ChatMessage;
      
      switch (action) {
        case 'share_location':
          sentMessage = await chatService.shareLocation(
            parseInt(id!),
            data?.latitude,
            data?.longitude,
            data?.address,
            data?.fallback
          );
          setMessages(prev => [...prev, processMessage(sentMessage)]);
          break;
          
        case 'request_photos':
          sentMessage = await chatService.sendMessage(parseInt(id!), {
            service_request_id: parseInt(id!),
            message: t('services.requestPhotosMessage'),
            message_type: 'text',
          });
          setMessages(prev => [...prev, processMessage(sentMessage)]);
          break;
          
        case 'schedule_meeting':
          sentMessage = await chatService.sendMessage(parseInt(id!), {
            service_request_id: parseInt(id!),
            message: t('services.scheduleMeetingMessage'),
            message_type: 'text',
          });
          setMessages(prev => [...prev, processMessage(sentMessage)]);
          break;
          
        case 'share_instructions':
          sentMessage = await chatService.sendMessage(parseInt(id!), {
            service_request_id: parseInt(id!),
            message: t('services.shareInstructionsMessage'),
            message_type: 'text',
          });
          setMessages(prev => [...prev, processMessage(sentMessage)]);
          break;
          
        case 'update_service_status':
          sentMessage = await chatService.sendMessage(
            parseInt(id!),
            {
              service_request_id: parseInt(id!),
              message: data?.message || 'Service status updated',
              message_type: 'service_update'
            }
          );
          setMessages(prev => [...prev, processMessage(sentMessage)]);
          break;
          
        default:
          return;
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      setError(t('common.error'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || t('common.error')}
        </Alert>
        <Button onClick={() => navigate('/service-requests')} sx={{ mt: 2 }}>
          {t('common.back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      height="100vh" 
      display="flex" 
      flexDirection={{ xs: 'column', md: 'row' }}
      sx={{ 
        backgroundColor: 'background.default',
        overflow: 'hidden'
      }}
    >
      {/* Service Context Panel - Hidden on mobile */}
      {request && (
        <Box sx={{ 
          width: { xs: 0, md: '350px' }, 
          minWidth: { xs: 0, md: '350px' },
          display: { xs: 'none', md: 'block' },
          overflow: 'hidden'
        }}>
          <ServiceContextPanel
            serviceRequest={request}
            onAction={handleQuickAction}
          />
        </Box>
      )}

      {/* Main Chat Area */}
      <Box 
        flex={1} 
        display="flex" 
        flexDirection="column" 
        sx={{ 
          backgroundColor: 'background.paper',
          borderRadius: { xs: 0, md: 2 },
          m: { xs: 0, md: 2 },
          overflow: 'hidden',
          boxShadow: { xs: 0, md: 3 },
          height: { xs: '100vh', md: 'auto' },
          minHeight: { xs: '100vh', md: 0 }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: { xs: 1, md: 2 }, 
          borderBottom: 1, 
          borderColor: 'divider',
          minHeight: '64px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Box display="flex" alignItems="center" flex={1} sx={{ minWidth: 0 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/service-requests/${id}`)}
              sx={{ 
                mr: { xs: 1, md: 2 },
                minWidth: 'auto',
                px: { xs: 1, md: 2 }
              }}
            >
              {t('common.back')}
            </Button>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: { xs: '1rem', md: '1.25rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {t('services.conversation')} - {request?.title}
            </Typography>
          </Box>
        </Box>
        
        {/* Mobile-only user info */}
        <Box sx={{ 
          display: { xs: 'block', md: 'none' },
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.default'
        }}>
          <Typography variant="body2" color="text.secondary">
            {t('services.requestedBy')}: {request?.user?.username}
          </Typography>
        </Box>

        {/* Enhanced Chat Window */}
        <Box sx={{ 
          flex: 1, 
          minHeight: 0, 
          display: 'flex', 
          flexDirection: 'column',
          height: { xs: 'calc(100vh - 120px)', md: 'auto' }
        }}>
          <EnhancedChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onQuickAction={handleQuickAction}
            isSending={sending}
            serviceRequestId={parseInt(id!)}
          />
        </Box>
      </Box>
    </Box>
  );
};
