import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Send,
  AttachFile,
  Person,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ChatService } from '../../services/chat/chatService';
import { ServiceRequestService } from '../../services/serviceRequests/serviceRequestService';
import type { ChatMessage } from '../../types/services/chat';
import type { ServiceRequest } from '../../types/services/serviceRequest';

export const ServiceRequestChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [messagesData, requestData] = await Promise.all([
        ChatService.getChatMessages(parseInt(id)),
        ServiceRequestService.getServiceRequest(parseInt(id))
      ]);
      setMessages(messagesData);
      setRequest(requestData);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id || sending) return;

    try {
      setSending(true);
      const message = await ChatService.sendMessage(parseInt(id), {
        message: newMessage.trim(),
        message_type: 'text'
      });
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
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
    <Box height="100vh" display="flex" flexDirection="column">
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <IconButton onClick={() => navigate(`/service-requests/${id}`)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6">
            {t('services.conversation')} - {request.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t('services.requestedBy')}: {request.user?.username}
        </Typography>
      </Paper>

      {/* Messages */}
      <Box flex={1} overflow="auto" p={2}>
        {messages.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              {t('services.noMessagesYet')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('services.startConversation')}
            </Typography>
          </Box>
        ) : (
          <List>
            {messages.map((message) => (
              <ListItem key={message.id} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="subtitle2">
                        {message.sender_id === request.user_id ? request.user?.username : t('services.provider')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(message.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {message.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      <Divider />

      {/* Message Input */}
      <Box p={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('services.messagePlaceholder')}
            disabled={sending}
          />
          <IconButton color="primary" disabled={sending}>
            <AttachFile />
          </IconButton>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            startIcon={sending ? <CircularProgress size={20} /> : <Send />}
          >
            {sending ? t('common.creating') : t('common.submit')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
