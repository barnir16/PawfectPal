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
import { ChatService } from '../../services/chat/chatService';
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
      console.log('Fetched service request:', serviceRequest);
      
      // If service request doesn't have pets, fetch them separately
      if (!serviceRequest.pets || serviceRequest.pets.length === 0) {
        try {
          const pets = await getPets();
          serviceRequest.pets = pets.filter(pet => serviceRequest.pet_ids?.includes(pet.id));
          console.log('Fetched pets for service request:', serviceRequest.pets);
        } catch (petError) {
          console.warn('Could not fetch pets:', petError);
        }
      }
      
      // Fetch conversation messages
      const conversationData = await ChatService.getConversation(parseInt(id));
      console.log('Fetched conversation:', conversationData);
      
      setMessages(conversationData?.messages || []);
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
      const sentMessage = await ChatService.sendMessage({
        ...messageData,
        service_request_id: parseInt(id),
      });
      
      console.log('Message sent successfully:', sentMessage);
      
      // If the API returns undefined or empty object, create a mock message
      if (!sentMessage || (typeof sentMessage === 'object' && Object.keys(sentMessage).length === 0)) {
        console.warn('API returned undefined or empty object, creating mock message');
        const mockMessage: ChatMessage = {
          id: Date.now(),
          service_request_id: parseInt(id),
          sender_id: user?.id || 0,
          message: messageData.message,
          message_type: messageData.message_type || 'text',
          is_read: false,
          is_edited: false,
          created_at: new Date().toISOString(),
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
        setMessages(prev => {
          const newMessages = [...prev, mockMessage];
          console.log('Updated messages array with mock:', newMessages);
          return newMessages;
        });
      } else {
        console.log('API returned valid message:', sentMessage);
        setMessages(prev => {
          const newMessages = [...prev, sentMessage];
          console.log('Updated messages array:', newMessages);
          return newMessages;
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = async (action: string, data?: any) => {
    console.log('Quick action:', action, data);
    
    try {
      let sentMessage: ChatMessage;
      
      switch (action) {
        case 'share_location':
          sentMessage = await ChatService.shareLocation(
            parseInt(id!),
            data?.latitude,
            data?.longitude,
            data?.address,
            data?.fallback
          );
          setMessages(prev => [...prev, sentMessage]);
          break;
          
        case 'request_photos':
          sentMessage = await ChatService.sendMessage({
            service_request_id: parseInt(id!),
            message: t('services.requestPhotosMessage'),
            message_type: 'text',
          });
          setMessages(prev => [...prev, sentMessage]);
          break;
          
        case 'schedule_meeting':
          sentMessage = await ChatService.sendMessage({
            service_request_id: parseInt(id!),
            message: t('services.scheduleMeetingMessage'),
            message_type: 'text',
          });
          setMessages(prev => [...prev, sentMessage]);
          break;
          
        case 'share_instructions':
          sentMessage = await ChatService.sendMessage({
            service_request_id: parseInt(id!),
            message: t('services.shareInstructionsMessage'),
            message_type: 'text',
          });
          setMessages(prev => [...prev, sentMessage]);
          break;
          
        case 'update_service_status':
          sentMessage = await ChatService.sendServiceUpdate(
            parseInt(id!),
            data?.status,
            data?.message
          );
          setMessages(prev => [...prev, sentMessage]);
          break;
          
        default:
          console.log('Unknown action:', action);
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
    <Box height="100vh" display="flex" sx={{ backgroundColor: 'grey.50' }}>
      {/* Service Context Panel */}
      {request && (
        <Box sx={{ width: '350px', minWidth: '350px' }}>
          <ServiceContextPanel
            serviceRequest={request}
            onAction={handleQuickAction}
          />
        </Box>
      )}

      {/* Main Chat Area */}
      <Box flex={1} display="flex" flexDirection="column" sx={{ 
        backgroundColor: 'white',
        borderRadius: 2,
        m: 2,
        overflow: 'hidden',
        boxShadow: 3,
      }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" mb={1}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/service-requests/${id}`)}
              sx={{ mr: 2 }}
            >
              {t('common.back')}
            </Button>
            <Typography variant="h6">
              {t('services.conversation')} - {request?.title}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('services.requestedBy')}: {request?.user?.username}
          </Typography>
        </Box>

        {/* Enhanced Chat Window */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <EnhancedChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onQuickAction={handleQuickAction}
            isSending={sending}
          />
        </Box>
      </Box>
    </Box>
  );
};
