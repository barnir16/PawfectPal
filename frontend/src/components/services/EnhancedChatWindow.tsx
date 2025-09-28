import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Stack,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardContent,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Image,
  LocationOn,
  Schedule,
  Pets,
  CheckCircle,
  AccessTime,
  MoreVert,
  Reply,
  Star,
  Close,
  Download,
  Visibility,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useAuth } from '../../contexts/AuthContext';
import type { ChatMessage, ChatMessageCreate, MediaAttachment } from '../../types/services/chat';

interface EnhancedChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessageCreate) => Promise<void>;
  onQuickAction?: (action: string, data?: any) => void;
  isSending?: boolean;
}

interface QuickReply {
  id: string;
  text: string;
  icon?: React.ReactNode;
}

export const EnhancedChatWindow: React.FC<EnhancedChatWindowProps> = ({
  messages,
  onSendMessage,
  onQuickAction,
  isSending = false,
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickReplies: QuickReply[] = [
    { id: 'greeting', text: 'Hi! I\'m interested in your service request.', icon: <Pets /> },
    { id: 'availability', text: 'I\'m available for this service. When would you like to meet?', icon: <Schedule /> },
    { id: 'location', text: 'Could you share the exact location?', icon: <LocationOn /> },
    { id: 'photos', text: 'Could you send some photos of your pet?', icon: <Image /> },
    { id: 'confirm', text: 'Perfect! I\'ll be there at the scheduled time.', icon: <CheckCircle /> },
    { id: 'instructions', text: 'Please share any special instructions for your pet.', icon: <Pets /> },
  ];

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    const newMessage: ChatMessageCreate = {
      service_request_id: 0, // Will be set by parent component
      message: input.trim() || (selectedFiles.length > 0 ? '📎 Shared files' : ''),
      message_type: selectedFiles.length > 0 ? 'image' : 'text',
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
    };

    try {
      await onSendMessage(newMessage);
      setInput('');
      setSelectedFiles([]);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      setSnackbarMessage('Failed to send message');
      setSnackbarOpen(true);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setSnackbarMessage('Only image files are supported');
      setSnackbarOpen(true);
    }
    
    // Limit file size for web (5MB per file)
    const validFiles = imageFiles.filter(file => file.size <= 5 * 1024 * 1024);
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      setSnackbarMessage(`Some files are too large (max 5MB). ${validFiles.length} files added.`);
      setSnackbarOpen(true);
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Clear the input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const openMediaDialog = (media: MediaAttachment) => {
    setSelectedMedia(media);
    setMediaDialogOpen(true);
  };

  const closeMediaDialog = () => {
    setMediaDialogOpen(false);
    setSelectedMedia(null);
  };

  const handleQuickReply = async (reply: QuickReply) => {
    const newMessage: ChatMessageCreate = {
      service_request_id: 0, // Will be set by parent component
      message: reply.text,
      message_type: 'text',
    };

    try {
      await onSendMessage(newMessage);
      setShowQuickReplies(false);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send quick reply:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'system': return <CheckCircle />;
      case 'location': return <LocationOn />;
      case 'image': return <Image />;
      case 'service_update': return <Schedule />;
      default: return null;
    }
  };

  const renderMessageAttachments = (attachments: MediaAttachment[]) => {
    return (
      <Box sx={{ mt: 1 }}>
        {attachments.map((attachment, index) => (
          <Card
            key={attachment.id}
            sx={{
              maxWidth: 200,
              mb: 1,
              cursor: 'pointer',
            }}
            onClick={() => openMediaDialog(attachment)}
          >
            <CardMedia
              component="img"
              height="120"
              image={attachment.thumbnail_url || attachment.file_url}
              alt={attachment.file_name}
            />
            <CardContent sx={{ p: 1 }}>
              <Typography variant="caption" noWrap>
                {attachment.file_name}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  const renderLocationMessage = (metadata: any) => {
    if (!metadata?.location) return null;
    
    const { latitude, longitude, address, fallback } = metadata.location;
    
    return (
      <Box sx={{ mt: 1 }}>
        <Card sx={{ maxWidth: 250 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2">{t('services.locationShared')}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {address || t('services.currentLocation')}
            </Typography>
            {!fallback && latitude && longitude ? (
              <Button
                size="small"
                startIcon={<Visibility />}
                onClick={() => {
                  window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank');
                }}
                sx={{ mt: 1 }}
              >
                {t('services.viewOnMaps')}
              </Button>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('services.locationShared')} - {address || t('services.currentLocation')}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    onQuickAction?.(action);
    handleMenuClose();
  };

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">
          {t('services.conversation')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Quick Actions">
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: '#fafafa',
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {t('services.noMessagesYet')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('services.startConversation')}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              startIcon={<Reply />}
            >
              Quick Replies
            </Button>
          </Box>
        ) : (
          <List>
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              const isSystem = msg.message_type === 'system';

              return (
                <ListItem
                  key={msg.id}
                  sx={{
                    flexDirection: isOwn ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    py: 1,
                  }}
                >
                  {!isOwn && !isSystem && (
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {msg.sender?.username?.[0] || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    sx={{
                      maxWidth: '70%',
                      ml: isOwn ? 0 : 1,
                      mr: isOwn ? 1 : 0,
                    }}
                    primary={
                      <Paper
                        sx={{
                          p: 1.5,
                          backgroundColor: isOwn
                            ? 'primary.main'
                            : isSystem
                              ? 'grey.100'
                              : 'white',
                          color: isOwn
                            ? 'primary.contrastText'
                            : 'text.primary',
                          borderRadius: 2,
                          boxShadow: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          {getMessageTypeIcon(msg.message_type) && (
                            <Box sx={{ mt: 0.5 }}>
                              {getMessageTypeIcon(msg.message_type)}
                            </Box>
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2">{msg.message}</Typography>
                            
                            {/* Render attachments */}
                            {msg.attachments && msg.attachments.length > 0 && 
                              renderMessageAttachments(msg.attachments)
                            }
                            
                            {/* Render location */}
                            {msg.message_type === 'location' && msg.metadata && 
                              renderLocationMessage(msg.metadata)
                            }
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  opacity: 0.7,
                                }}
                              >
                                {formatMessageTime(msg.created_at)}
                              </Typography>
                              {msg.is_read && isOwn && (
                                <CheckCircle fontSize="small" sx={{ opacity: 0.7 }} />
                              )}
                              {msg.is_edited && (
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                  (edited)
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    }
                  />
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}

        {/* Quick Replies */}
        {showQuickReplies && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Quick Replies
            </Typography>
            <Stack spacing={1}>
              {quickReplies.map((reply) => (
                <Button
                  key={reply.id}
                  variant="outlined"
                  size="small"
                  startIcon={reply.icon}
                  onClick={() => handleQuickReply(reply)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {reply.text}
                </Button>
              ))}
            </Stack>
          </Paper>
        )}
      </Box>

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <Paper sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
            Selected files ({selectedFiles.length}):
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {selectedFiles.map((file, index) => (
              <Card key={index} sx={{ maxWidth: 100 }}>
                <CardMedia
                  component="img"
                  height="60"
                  image={URL.createObjectURL(file)}
                  alt={file.name}
                />
                <CardContent sx={{ p: 0.5 }}>
                  <Typography variant="caption" noWrap>
                    {file.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeFile(index)}
                    sx={{ position: 'absolute', top: 0, right: 0 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Input */}
      <Paper sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Tooltip title="Attach File">
            <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
              <AttachFile />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Photo">
            <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
              <Image />
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Location">
            <IconButton size="small" onClick={() => handleAction('share_location')}>
              <LocationOn />
            </IconButton>
          </Tooltip>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('services.messagePlaceholder')}
            disabled={isSending}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={(!input.trim() && selectedFiles.length === 0) || isSending}
          >
            {isSending ? <CircularProgress size={20} /> : <Send />}
          </IconButton>
        </Box>
      </Paper>

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('share_location')}>
          <LocationOn sx={{ mr: 1 }} />
          Share Location
        </MenuItem>
        <MenuItem onClick={() => handleAction('request_photos')}>
          <Image sx={{ mr: 1 }} />
          Request Pet Photos
        </MenuItem>
        <MenuItem onClick={() => handleAction('schedule_meeting')}>
          <Schedule sx={{ mr: 1 }} />
          Schedule Meeting
        </MenuItem>
        <MenuItem onClick={() => handleAction('share_instructions')}>
          <Pets sx={{ mr: 1 }} />
          Share Instructions
        </MenuItem>
      </Menu>

      {/* Media Dialog */}
      <Dialog
        open={mediaDialogOpen}
        onClose={closeMediaDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {selectedMedia?.file_name}
            <IconButton onClick={closeMediaDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMedia && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={selectedMedia.file_url}
                alt={selectedMedia.file_name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<Download />}
            onClick={() => {
              if (selectedMedia) {
                const link = document.createElement('a');
                link.href = selectedMedia.file_url;
                link.download = selectedMedia.file_name;
                link.click();
              }
            }}
          >
            Download
          </Button>
          <Button onClick={closeMediaDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
