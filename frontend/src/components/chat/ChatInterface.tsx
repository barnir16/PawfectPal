import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Image,
  MoreVert,
  Phone,
  VideoCall,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatService } from '../../services/chat/chatService';
import type { ChatMessage, ChatConversation } from '../../types/services/chat';

interface ChatInterfaceProps {
  serviceRequestId: number;
  onClose?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  serviceRequestId,
  onClose
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await ChatService.getConversation(serviceRequestId);
        setConversation(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [serviceRequestId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      setError(null);

      const message = await ChatService.sendMessage({
        service_request_id: serviceRequestId,
        message: newMessage.trim(),
        message_type: 'text'
      });

      // Add message to local state
      if (conversation) {
        setConversation({
          ...conversation,
          messages: [...conversation.messages, message],
          unread_count: 0
        });
      }

      setNewMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('common.loading')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!conversation) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        {t('chat.noConversationFound')}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2 }}>
              {conversation.messages[0]?.sender?.full_name?.[0] || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {conversation.messages[0]?.sender?.full_name || t('chat.unknownUser')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('chat.serviceRequest')} #{serviceRequestId}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {conversation.unread_count > 0 && (
              <Chip
                label={conversation.unread_count}
                color="primary"
                size="small"
              />
            )}
            <IconButton size="small">
              <Phone />
            </IconButton>
            <IconButton size="small">
              <VideoCall />
            </IconButton>
            <IconButton size="small">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {conversation.messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              {t('chat.noMessagesYet')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('chat.startConversation')}
            </Typography>
          </Box>
        ) : (
          <List>
            {conversation.messages.map((message) => {
              const isOwnMessage = message.sender_id === user?.id;
              const isSystemMessage = message.message_type === 'system';
              
              return (
                <ListItem
                  key={message.id}
                  sx={{
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    py: 1
                  }}
                >
                  {!isOwnMessage && !isSystemMessage && (
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {message.sender?.full_name?.[0] || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                  )}
                  
                  <ListItemText
                    sx={{
                      maxWidth: '70%',
                      ml: isOwnMessage ? 0 : 1,
                      mr: isOwnMessage ? 1 : 0,
                    }}
                    primary={
                      <Paper
                        sx={{
                          p: 2,
                          backgroundColor: isOwnMessage 
                            ? 'primary.main' 
                            : isSystemMessage 
                            ? 'grey.100' 
                            : 'grey.200',
                          color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                          borderRadius: 2,
                          borderRadiusTopLeft: isOwnMessage ? 2 : 0,
                          borderRadiusTopRight: isOwnMessage ? 0 : 2,
                        }}
                      >
                        <Typography variant="body1">
                          {message.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            opacity: 0.7,
                            textAlign: isOwnMessage ? 'right' : 'left'
                          }}
                        >
                          {formatMessageTime(message.created_at)}
                          {message.is_edited && ' (edited)'}
                        </Typography>
                      </Paper>
                    }
                  />
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Message Input */}
      <Paper sx={{ p: 2, borderRadius: 0, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <IconButton size="small">
            <AttachFile />
          </IconButton>
          <IconButton size="small">
            <Image />
          </IconButton>
          
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.messagePlaceholder')}
            disabled={isSending}
            variant="outlined"
            size="small"
          />
          
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? <CircularProgress size={20} /> : <Send />}
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};
