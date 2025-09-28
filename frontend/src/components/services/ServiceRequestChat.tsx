import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ChatService } from '../../services/chat/chatService';
import { ServiceRequestService } from '../../services/serviceRequests/serviceRequestService';
import { ServiceContextPanel } from './ServiceContextPanel';
import { EnhancedChatWindow } from './EnhancedChatWindow';
import type { ChatMessage, ChatMessageCreate } from '../../types/services/chat';
import type { ServiceRequest } from '../../types/services/serviceRequest';

export const ServiceRequestChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocalization();
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
      
      const [conversationData, requestData] = await Promise.all([
        ChatService.getConversation(parseInt(id)),
        ServiceRequestService.getServiceRequest(parseInt(id))
      ]);
      
      console.log('Conversation data:', conversationData);
      console.log('Request data:', requestData);
      
      setMessages(conversationData?.messages || []);
      setRequest(requestData);
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
      const message = await ChatService.sendMessage({
        ...messageData,
        service_request_id: parseInt(id),
      });
      setMessages(prev => [...prev, message]);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = async (action: string, data?: any) => {
    console.log('Quick action:', action, data);
    
    try {
      switch (action) {
        case 'share_location':
          await ChatService.shareLocation(
            parseInt(id!),
            data?.latitude,
            data?.longitude,
            data?.address,
            data?.fallback
          );
          // Refresh messages
          fetchData();
          break;
          
        case 'request_photos':
          const photoMessage = await ChatService.sendMessage({
            service_request_id: parseInt(id!),
            message: 'Could you please share some photos of your pet? This will help me provide better care.',
            message_type: 'text',
          });
          setMessages(prev => [...prev, photoMessage]);
          break;
          
        case 'schedule_meeting':
          const meetingMessage = await ChatService.sendMessage({
            service_request_id: parseInt(id!),
            message: 'Let\'s schedule a meeting to discuss the service details. When would be a good time for you?',
            message_type: 'text',
          });
          setMessages(prev => [...prev, meetingMessage]);
          break;
          
        case 'share_instructions':
          const instructionMessage = await ChatService.sendMessage({
            service_request_id: parseInt(id!),
            message: 'Please share any special instructions or requirements for your pet\'s care.',
            message_type: 'text',
          });
          setMessages(prev => [...prev, instructionMessage]);
          break;
          
        case 'update_service_status':
          if (data?.status && data?.serviceRequestId) {
            await ChatService.sendServiceUpdate(
              data.serviceRequestId,
              data.status
            );
            // Refresh messages and request data
            fetchData();
          }
          break;
          
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      setError('Failed to perform action. Please try again.');
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
    <Box height="100vh" display="flex">
      {/* Service Context Panel */}
      {request && (
        <ServiceContextPanel
          serviceRequest={request}
          onAction={handleQuickAction}
        />
      )}

      {/* Main Chat Area */}
      <Box flex={1} display="flex" flexDirection="column">
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
        <Box flex={1}>
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
