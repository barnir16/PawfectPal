import React, { useState, useRef, useEffect } from "react";
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
  Collapse,
  LinearProgress,
  Badge,
} from "@mui/material";
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
  InsertDriveFile,
  ContentCopy,
  Delete,
  Person,
  Favorite,
  ThumbUp,
  ThumbDown,
  Message,
  Refresh,
  Error,
  Warning,
  Info,
  Wifi,
  WifiOff,
  CloudOff,
  CloudDone,
  Replay,
  Business,
  Home,
  AttachMoney,
  Emergency,
  ExpandMore,
  ExpandLess,
  Search,
} from "@mui/icons-material";
import { useLocalization } from "../../contexts/LocalizationContext";
import { useAuth } from "../../contexts/AuthContext";
import type {
  ChatMessage,
  ChatMessageCreate,
  MediaAttachment,
  ReplyToMessage,
} from "../../types/services/chat";
import { chatService } from "../../services/chat/chatService";
import { formatMessageTime } from "../../utils/timeUtils";
import { ReplyMessage } from "./ReplyMessage";
import { ReplyButton } from "./ReplyButton";
import { MessageReactions } from "./MessageReactions";
import { MessageSearch } from "./MessageSearch";
import { FilePreview } from "./FilePreview";
import { FileUploadProgress } from "./FileUploadProgress";
import { LocationMessage } from "./LocationMessage";

interface EnhancedChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: ChatMessageCreate) => Promise<void>;
  onSendMessageWithFiles?: (message: string, files: File[]) => Promise<void>;
  onQuickAction?: (action: string, data?: any) => void;
  onTypingChange?: (isTyping: boolean) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  isSending?: boolean;
  serviceRequestId: number;
  serviceRequest?: {
    id: number;
    title: string;
    service_type: string;
    description: string;
    status: 'open' | 'in_progress' | 'completed' | 'closed';
    location?: string;
    budget_min?: number;
    budget_max?: number;
    is_urgent: boolean;
    user?: {
      id: number;
      username: string;
      full_name?: string;
      is_provider: boolean;
    };
    assigned_provider?: {
      id: number;
      username: string;
      full_name?: string;
      is_provider: boolean;
    };
    pets?: Array<{
      id: number;
      name: string;
      type: string;
      breed?: string;
    }>;
  };
}

interface QuickReply {
  id: string;
  text: string;
  icon?: React.ReactNode;
}

export const EnhancedChatWindow: React.FC<EnhancedChatWindowProps> = ({
  messages,
  onSendMessage,
  onSendMessageWithFiles,
  onQuickAction,
  onTypingChange,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  isSending = false,
  serviceRequestId,
  serviceRequest,
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaAttachment | null>(
    null
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  
  // Enhanced error handling and connection status
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [errorState, setErrorState] = useState<{
    type: 'network' | 'permission' | 'validation' | 'server' | null;
    message: string;
    retryable: boolean;
  }>({ type: null, message: '', retryable: false });
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [offlineMessages, setOfflineMessages] = useState<ChatMessageCreate[]>([]);
  
  // Service request context panel
  const [showServiceContext, setShowServiceContext] = useState(true);
  
  // Reply functionality
  const [replyingTo, setReplyingTo] = useState<ReplyToMessage | null>(null);
  const [messageReactions, setMessageReactions] = useState<Map<number, any[]>>(new Map());
  
  // Search functionality
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  
  // File upload progress
  const [uploadProgress, setUploadProgress] = useState<Map<string, { progress: number; status: 'uploading' | 'completed' | 'error'; error?: string }>>(new Map());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const quickReplies: QuickReply[] = user?.is_provider ? [
    // Provider-specific quick replies
    {
      id: "greeting",
      text: t('chat.quickReplies.provider.greeting') || "Hi! I'm interested in providing this service for you.",
      icon: <Pets />,
    },
    {
      id: "availability",
      text: t('chat.quickReplies.provider.availability') || "I'm available for this service. When would be a good time to discuss the details?",
      icon: <Schedule />,
    },
    {
      id: "experience",
      text: t('chat.quickReplies.provider.experience') || "I have extensive experience with this type of service. Would you like to schedule a consultation?",
      icon: <Star />,
    },
    {
      id: "location",
      text: t('chat.quickReplies.provider.location') || "I'm located nearby. Would you like to meet in person to discuss the service?",
      icon: <LocationOn />,
    },
    {
      id: "photos",
      text: t('chat.quickReplies.provider.photos') || "Could you share some photos of your pet? This will help me provide the best care.",
      icon: <Image />,
    },
    {
      id: "instructions",
      text: t('chat.quickReplies.provider.instructions') || "Please share any special instructions or requirements for your pet's care.",
      icon: <Pets />,
    },
  ] : [
    // Client-specific quick replies
    {
      id: "greeting",
      text: t('chat.quickReplies.client.greeting') || "Hi! I'm interested in your service request.",
      icon: <Pets />,
    },
    {
      id: "availability",
      text: t('chat.quickReplies.client.availability') || "I'm available for this service. When would you like to meet?",
      icon: <Schedule />,
    },
    {
      id: "location",
      text: t('chat.quickReplies.client.location') || "Could you share the exact location?",
      icon: <LocationOn />,
    },
    {
      id: "photos",
      text: "Could you send some photos of your pet?",
      icon: <Image />,
    },
    {
      id: "confirm",
      text: "Perfect! I'll be there at the scheduled time.",
      icon: <CheckCircle />,
    },
    {
      id: "instructions",
      text: "Please share any special instructions for your pet.",
      icon: <Pets />,
    },
  ];

  // Debug logging for quick replies
  console.log('🔍 Quick Replies Debug:', {
    user: user,
    isProvider: user?.is_provider,
    quickRepliesCount: quickReplies.length,
    quickReplies: quickReplies.map(r => ({ id: r.id, text: r.text.substring(0, 30) + '...' }))
  });

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 5;
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File "${file.name}" has an unsupported type. Allowed types: images, PDF, text, Word documents`;
    }
    
    return null;
  };

  const validateFiles = (files: File[]): string | null => {
    // Check file count
    if (files.length > MAX_FILES) {
      return `Too many files. Maximum ${MAX_FILES} files allowed`;
    }
    
    // Validate each file
    for (const file of files) {
      const error = validateFile(file);
      if (error) return error;
    }
    
    return null;
  };

  // Typing indicator component
  const TypingIndicator = ({ username }: { username: string }) => (
    <ListItem sx={{ mb: 1 }}>
      <ListItemAvatar sx={{ minWidth: 40 }}>
        <Avatar sx={{ width: 32, height: 32 }}>
          <Person />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        sx={{
          maxWidth: "75%",
          ml: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
        primary={
          <Paper
            sx={{
              p: 2.5,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "grey.800"
                  : "white",
              borderRadius: "20px 20px 20px 6px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              border: (theme) =>
                theme.palette.mode === "dark"
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(0,0,0,0.05)",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: -6,
                width: 0,
                height: 0,
                borderRight: "6px solid transparent",
                borderTop: "6px solid",
                borderTopColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[800]
                    : "white",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontSize: "0.75rem",
                  opacity: 0.7,
                }}
              >
                {username} is typing
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  "& > div": {
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: (theme) => theme.palette.text.secondary,
                    animation: "typing 1.4s infinite ease-in-out",
                    "&:nth-of-type(1)": { animationDelay: "0s" },
                    "&:nth-of-type(2)": { animationDelay: "0.2s" },
                    "&:nth-of-type(3)": { animationDelay: "0.4s" },
                  },
                  "@keyframes typing": {
                    "0%, 60%, 100%": { transform: "translateY(0)", opacity: 0.4 },
                    "30%": { transform: "translateY(-10px)", opacity: 1 },
                  },
                }}
              >
                <Box />
                <Box />
                <Box />
              </Box>
            </Box>
          </Paper>
        }
      />
    </ListItem>
  );

  // Skeleton loading component for messages
  const MessageSkeleton = ({ isOwn }: { isOwn: boolean }) => (
    <ListItem sx={{ mb: 1 }}>
      {!isOwn && (
        <ListItemAvatar>
          <Avatar sx={{ width: 32, height: 32 }}>
            <Person />
          </Avatar>
        </ListItemAvatar>
      )}
      <ListItemText
        sx={{
          maxWidth: "75%",
          ml: isOwn ? 0 : 2,
          mr: isOwn ? 2 : 0,
          display: "flex",
          flexDirection: "column",
          alignItems: isOwn ? "flex-end" : "flex-start",
        }}
        primary={
          <Paper
            sx={{
              p: 2.5,
              backgroundColor: isOwn
                ? "primary.main"
                : (theme) =>
                    theme.palette.mode === "dark"
                      ? "grey.800"
                      : "white",
              borderRadius: isOwn
                ? "20px 20px 6px 20px"
                : "20px 20px 20px 6px",
              boxShadow: isOwn
                ? "0 2px 8px rgba(0,0,0,0.15)"
                : "0 1px 4px rgba(0,0,0,0.1)",
              border: isOwn
                ? "none"
                : (theme) =>
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid rgba(0,0,0,0.05)",
              position: "relative",
              "&::before": isOwn
                ? {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    right: -6,
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderTop: "6px solid",
                    borderTopColor: (theme) => theme.palette.primary.main,
                  }
                : {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: -6,
                    width: 0,
                    height: 0,
                    borderRight: "6px solid transparent",
                    borderTop: "6px solid",
                    borderTopColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : "white",
                  },
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: 20,
                backgroundColor: isOwn
                  ? "rgba(255,255,255,0.2)"
                  : (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                borderRadius: 1,
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 0.6 },
                  "50%": { opacity: 0.3 },
                  "100%": { opacity: 0.6 },
                },
              }}
            />
          </Paper>
        }
      />
    </ListItem>
  );

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Message reaction handlers
  const handleReaction = (messageId: number, reaction: string) => {
    console.log("Reaction:", reaction, "on message:", messageId);
    setSnackbarMessage(`Added ${reaction} reaction`);
    setSnackbarOpen(true);
  };

  // Helper function to parse attachment data from message
  const parseMessageAttachments = (message: ChatMessage): MediaAttachment[] => {
    console.log('🔍 parseMessageAttachments Debug:', {
      messageId: message.id,
      messageType: message.message_type,
      messageMetadata: message.message_metadata,
      hasAttachments: !!message.message_metadata?.attachments,
      attachments: message.message_metadata?.attachments
    });
    
    // First try to get attachments from message_metadata
    if (message.message_metadata?.attachments && Array.isArray(message.message_metadata.attachments)) {
      const parsed = message.message_metadata.attachments.map((att: any) => ({
        id: att.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_type: att.file_type,
        file_size: att.file_size,
        created_at: att.created_at,
      }));
      console.log('🔍 Parsed attachments from metadata:', parsed);
      return parsed;
    }
    
    // Fallback: try to parse JSON data from message (backward compatibility)
    try {
      const parsed = JSON.parse(message.message);
      if (parsed.attachments && Array.isArray(parsed.attachments)) {
        return parsed.attachments.map((att: any) => ({
          id: att.id,
          file_name: att.file_name,
          file_url: att.file_url,
          file_type: att.file_type,
          file_size: att.file_size,
          created_at: att.created_at,
        }));
      }
    } catch (e) {
      // Not JSON, return empty array
    }
    return [];
  };

  // Helper function to get display message text
  const getDisplayMessage = (message: ChatMessage): string => {
    // First try to get original message from message_metadata
    if (message.message_metadata?.original_message) {
      return message.message_metadata.original_message;
    }
    
    // Fallback: try to parse JSON data from message (backward compatibility)
    try {
      const parsed = JSON.parse(message.message);
      return parsed.original_message || message.message;
    } catch (e) {
      return message.message;
    }
  };

  // Helper function to render location messages
  const renderLocationMessage = (message: ChatMessage) => {
    const text = getDisplayMessage(message);
    
    console.log('📍 Location message check:', {
      messageId: message.id,
      messageType: message.message_type,
      text: text,
      isLocation: message.message_type === "location" || 
        text.includes("Lat:") || 
        text.includes("Lng:") ||
        text.includes("📍 Location shared") ||
        text.includes("Location:") ||
        text.includes("Coordinates:")
    });
    
    // Check if this is a location message by type or content
    if (message.message_type === "location" || 
        text.includes("Lat:") || 
        text.includes("Lng:") ||
        text.includes("📍 Location shared") ||
        text.includes("Location:") ||
        text.includes("Coordinates:")) {
      return <LocationMessage message={text} compact={true} />;
    }
    return null;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('connected');
      setErrorState({ type: null, message: '', retryable: false });
      // Retry sending offline messages
      if (offlineMessages.length > 0) {
        retryOfflineMessages();
      }
    };

    const handleOffline = () => {
      setConnectionStatus('disconnected');
      setErrorState({ 
        type: 'network', 
        message: 'You are offline. Messages will be sent when connection is restored.', 
        retryable: true 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial connection status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineMessages]);

  // Enhanced error handling functions
  const handleError = (error: any, context: string = '') => {
    console.error(`❌ ${context}:`, error);
    
    let errorType: 'network' | 'permission' | 'validation' | 'server' = 'server';
    let message = 'An unexpected error occurred';
    let retryable = false;

    if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          errorType = 'validation';
          message = error.response.data?.detail || 'Invalid request. Please check your input.';
          retryable = false;
          break;
        case 401:
          errorType = 'permission';
          message = 'Please log in again to continue.';
          retryable = false;
          break;
        case 403:
          errorType = 'permission';
          message = 'You don\'t have permission to perform this action.';
          retryable = false;
          break;
        case 404:
          errorType = 'server';
          message = 'The requested resource was not found.';
          retryable = false;
          break;
        case 413:
          errorType = 'validation';
          message = 'File too large. Please reduce file size and try again.';
          retryable = false;
          break;
        case 429:
          errorType = 'server';
          message = 'Too many requests. Please wait a moment and try again.';
          retryable = true;
          break;
        case 500:
          errorType = 'server';
          message = 'Server error. Please try again later.';
          retryable = true;
          break;
        default:
          errorType = 'server';
          message = error.response.data?.detail || 'An error occurred. Please try again.';
          retryable = true;
      }
    } else if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
      errorType = 'network';
      message = 'Network error. Please check your connection.';
      retryable = true;
    }

    setErrorState({ type: errorType, message, retryable });
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const retryOfflineMessages = async () => {
    if (offlineMessages.length === 0) return;
    
    setIsRetrying(true);
    setConnectionStatus('reconnecting');
    
    try {
      for (const message of offlineMessages) {
        await onSendMessage(message);
      }
      setOfflineMessages([]);
      setConnectionStatus('connected');
      setErrorState({ type: null, message: '', retryable: false });
    } catch (error) {
      handleError(error, 'Retry offline messages');
    } finally {
      setIsRetrying(false);
    }
  };

  const retryLastAction = async () => {
    if (!errorState.retryable) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // This would be implemented based on the last failed action
      // For now, we'll just clear the error state
      setErrorState({ type: null, message: '', retryable: false });
    } catch (error) {
      handleError(error, 'Retry action');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    console.log("📤 handleSend called with:", {
      input: input.trim(),
      selectedFilesCount: selectedFiles.length,
      selectedFiles: selectedFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    });

    // Ensure we have a valid message
    const messageText = input.trim() || (selectedFiles.length > 0 ? "📎 Shared files" : "");
    if (!messageText) {
      console.warn("📤 Cannot send empty message");
      return;
    }

    const newMessage: ChatMessageCreate = {
      service_request_id: serviceRequestId,
      message: messageText,
      message_type: selectedFiles.length > 0 ? "image" : "text",
      attachments:
        selectedFiles.length > 0
          ? selectedFiles.map((file) => ({ file }))
          : undefined,
      reply_to: replyingTo || undefined,
    };

    console.log("📤 Created message:", {
      message: newMessage.message,
      message_type: newMessage.message_type,
      hasAttachments: !!(
        newMessage.attachments && newMessage.attachments.length > 0
      ),
      attachmentCount: newMessage.attachments?.length || 0,
    });

    try {
      if (selectedFiles.length > 0 && onSendMessageWithFiles) {
        // Use file upload endpoint
        await onSendMessageWithFiles(messageText, selectedFiles);
      } else {
        // Use regular message endpoint
        await onSendMessage(newMessage);
      }
      
      setInput("");
      setSelectedFiles([]);
      setReplyingTo(null); // Clear reply state
      setErrorState({ type: null, message: '', retryable: false });
      scrollToBottom();
    } catch (error) {
      // If offline, queue the message
      if (!navigator.onLine) {
        setOfflineMessages(prev => [...prev, newMessage]);
        setInput("");
        setSelectedFiles([]);
        handleError(error, 'Send message (offline)');
      } else {
        handleError(error, 'Send message');
      }
    }
  };

  // Reply functionality handlers
  const handleReplyToMessage = (message: ChatMessage) => {
    const replyTo: ReplyToMessage = {
      message_id: message.id,
      sender_name: message.sender?.username || 'Unknown',
      message_preview: message.message.length > 50 
        ? message.message.substring(0, 50) + '...' 
        : message.message,
      message_type: message.message_type,
    };
    setReplyingTo(replyTo);
    // Focus on input field
    setTimeout(() => {
      const inputElement = document.querySelector('textarea[placeholder*="message"]') as HTMLTextAreaElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleAddReaction = async (message: ChatMessage, emoji: string) => {
    try {
      // TODO: Implement reaction API call
      console.log(`Adding reaction ${emoji} to message ${message.id}`);
      setSnackbarMessage(`Added ${emoji} reaction`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleCopyMessage = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.message);
      setSnackbarMessage("Message copied to clipboard");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  const handleDeleteMessage = (message: ChatMessage) => {
    // TODO: Implement delete message functionality
    console.log("Delete message:", message.id);
    setSnackbarMessage("Delete functionality coming soon");
    setSnackbarOpen(true);
  };

  // Search functionality handlers
  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setHighlightedMessageId(null);
  };

  const handleSearchMessageClick = (message: ChatMessage) => {
    setHighlightedMessageId(message.id);
    // Scroll to the message
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 3000);
    }
  };

  // File handling functions
  const handleFileDownload = async (attachment: MediaAttachment) => {
    try {
      const response = await fetch(attachment.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSnackbarMessage(`Downloaded ${attachment.file_name}`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to download file:', error);
      setSnackbarMessage('Failed to download file');
      setSnackbarOpen(true);
    }
  };

  const handleFileOpen = (attachment: MediaAttachment) => {
    console.log('📁 Opening file:', {
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type,
      isRelative: attachment.file_url.startsWith('/'),
      nodeEnv: process.env.NODE_ENV
    });
    
    // Ensure we have a full URL for opening
    let fullUrl = attachment.file_url;
    
    // If it's already a full URL, use as-is
    if (fullUrl.startsWith('http')) {
      console.log('📁 File URL is already full:', fullUrl);
    } else if (fullUrl.startsWith('/')) {
      // If it's a relative path, prepend the base URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://pawfectpal-production.up.railway.app' 
        : 'http://localhost:8000';
      fullUrl = baseUrl + fullUrl;
      console.log('📁 Constructed URL:', { baseUrl, originalUrl: attachment.file_url, fullUrl });
    }
    
    console.log('📁 Opening full URL:', fullUrl);
    
    // Try to open the file
    try {
      const newWindow = window.open(fullUrl, '_blank');
      if (!newWindow) {
        console.error('❌ Failed to open window - popup blocked?');
        // Fallback: try to download the file
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = attachment.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('📁 Fallback: triggered download');
      } else {
        console.log('✅ Successfully opened file in new window');
      }
    } catch (error) {
      console.error('❌ Error opening file:', error);
    }
  };

  const handleFileUploadProgress = (fileName: string, progress: number, status: 'uploading' | 'completed' | 'error', error?: string) => {
    setUploadProgress(prev => {
      const newMap = new Map(prev);
      newMap.set(fileName, { progress, status, error });
      return newMap;
    });
  };

  const handleCancelUpload = (fileName: string) => {
    setUploadProgress(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileName);
      return newMap;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    console.log(
      "📁 Files selected:",
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

    // Validate files first
    const validationError = validateFiles(files);
    if (validationError) {
      setSnackbarMessage(validationError);
      setSnackbarOpen(true);
      // Clear the input
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    // Separate images vs other files
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const otherFiles = files.filter((file) => !file.type.startsWith("image/"));

    // Limit file size for images (5MB per file)
    const validImageFiles = imageFiles.filter(
      (file) => file.size <= 5 * 1024 * 1024
    );
    const oversizedImages = imageFiles.filter(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversizedImages.length > 0) {
      setSnackbarMessage(
        `Some images are too large (max 5MB). ${validImageFiles.length} images added.`
      );
      setSnackbarOpen(true);
    }

    // Merge both images and other files
    const validFiles = [...validImageFiles, ...otherFiles];

    console.log(
      "📁 Valid files:",
      validFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );
    console.log(
      "📁 Oversized images:",
      oversizedImages.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

    setSelectedFiles((prev) => {
      const newFiles = [...prev, ...validFiles];
      console.log(
        "📁 Updated selectedFiles:",
        newFiles.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      );
      return newFiles;
    });

    // Clear the input so the same file can be selected again
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setSnackbarMessage("Geolocation is not supported by your browser.");
      setSnackbarOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const locationMessage: ChatMessageCreate = {
          service_request_id: serviceRequestId,
          message: `📍 Location shared\nLat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`,
          message_type: "location",
        };

        try {
          await onSendMessage(locationMessage);
        } catch (error) {
          console.error("Failed to send location:", error);
          setSnackbarMessage("Failed to send location");
          setSnackbarOpen(true);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setSnackbarMessage("Unable to retrieve location.");
        setSnackbarOpen(true);
      }
    );
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openMediaDialog = (media: MediaAttachment) => {
    console.log("Opening media dialog with:", media);
    setSelectedMedia(media);
    setMediaDialogOpen(true);
  };

  const closeMediaDialog = () => {
    setMediaDialogOpen(false);
    setSelectedMedia(null);
  };

  // Debug media dialog state
  useEffect(() => {
    console.log("Media dialog state changed:", {
      mediaDialogOpen,
      selectedMedia,
    });
  }, [mediaDialogOpen, selectedMedia]);

  const handleQuickReply = async (reply: QuickReply) => {
    const newMessage: ChatMessageCreate = {
      service_request_id: serviceRequestId,
      message: reply.text,
      message_type: "text",
    };

    try {
      await onSendMessage(newMessage);
      // Don't hide quick replies immediately - let user send multiple quick replies
      // setShowQuickReplies(false);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send quick reply:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case "system":
        return <CheckCircle />;
      case "location":
        return <LocationOn />;
      case "image":
        return <Image />;
      case "service_update":
        return <Schedule />;
      default:
        return null;
    }
  };

  const testImageUrl = async (url: string) => {
    try {
      console.log("🖼️ Testing image URL:", url);
      const response = await fetch(url, { method: "HEAD" });
      console.log("🖼️ Image URL test result:", {
        url,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
        lastModified: response.headers.get("last-modified"),
      });
      return response.ok;
    } catch (error) {
      console.error("🖼️ Image URL test failed:", url, error);
      return false;
    }
  };

  const renderMessageAttachments = (attachments: MediaAttachment[]) => {
    console.log("🖼️ Rendering attachments:", attachments);
    
    if (attachments.length === 0) {
      console.log("🖼️ No attachments to render");
      return null;
    }

    return (
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {attachments.map((attachment) => (
          <FilePreview
            key={attachment.id}
            attachment={attachment}
            onDownload={handleFileDownload}
            onOpen={handleFileOpen}
            compact={true}
          />
        ))}
      </Box>
    );
  };

  // Location sharing function removed since message_data doesn't exist

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
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: { xs: "300px", md: "500px" },
        borderRadius: { xs: 0, md: 2 },
        overflow: "hidden",
        boxShadow: { xs: 0, md: 3 },
      }}
    >
          {/* Header */}
          <Box
            sx={{
              p: 3,
              borderBottom: 1,
              borderColor: "divider",
              backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.800" : "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ width: 40, height: 40, backgroundColor: "primary.main" }}>
                <Pets />
              </Avatar>
              <Box>
                {user?.is_provider && (
                  <Chip
                    label="Provider"
                    size="small"
                    color="primary"
                    icon={<Business />}
                    sx={{ fontSize: "0.7rem", height: 20 }}
                  />
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Search Button */}
              <Tooltip title={t('chat.searchMessages') || 'Search Messages'}>
                <IconButton 
                  onClick={handleOpenSearch}
                  sx={{
                    backgroundColor: "transparent",
                    color: "text.secondary",
                    "&:hover": {
                      backgroundColor: "primary.main",
                      color: "white",
                    },
                  }}
                >
                  <Search />
                </IconButton>
              </Tooltip>

              {/* Service Context Toggle */}
              {serviceRequest && (
                <Tooltip title={showServiceContext ? "Hide service details" : "Show service details"}>
                  <IconButton 
                    onClick={() => setShowServiceContext(!showServiceContext)}
                    sx={{
                      backgroundColor: "transparent",
                      color: "text.secondary",
                      "&:hover": {
                        backgroundColor: "grey.100",
                        color: "primary.main",
                      },
                    }}
                  >
                    {showServiceContext ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Quick Actions">
                <IconButton 
                  onClick={handleMenuOpen}
                  sx={{
                    backgroundColor: "transparent",
                    color: "text.secondary",
                    "&:hover": {
                      backgroundColor: "grey.100",
                    },
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Error Banner */}
          {errorState.type && (
            <Collapse in={!!errorState.type}>
              <Alert 
                severity={
                  errorState.type === 'network' ? 'warning' :
                  errorState.type === 'permission' ? 'error' :
                  errorState.type === 'validation' ? 'info' :
                  'error'
                }
                sx={{ 
                  borderRadius: 0,
                  borderLeft: 0,
                  borderRight: 0,
                }}
                action={
                  errorState.retryable && (
                    <Button
                      color="inherit"
                      size="small"
                      onClick={retryLastAction}
                      disabled={isRetrying}
                      startIcon={isRetrying ? <CircularProgress size={16} /> : <Replay />}
                    >
                      {isRetrying ? 'Retrying...' : 'Retry'}
                    </Button>
                  )
                }
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {errorState.type === 'network' && <WifiOff />}
                  {errorState.type === 'permission' && <Error />}
                  {errorState.type === 'validation' && <Warning />}
                  {errorState.type === 'server' && <CloudOff />}
                  <Typography variant="body2">
                    {errorState.message}
                  </Typography>
                </Box>
              </Alert>
            </Collapse>
          )}

          {/* Service Request Context Panel */}
          {serviceRequest && (
            <Collapse in={showServiceContext}>
              <Paper 
                elevation={0}
                sx={{ 
                  borderRadius: 0,
                  borderLeft: 0,
                  borderRight: 0,
                  borderBottom: 1,
                  borderColor: "divider",
                  backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.800" : "grey.50",
                }}
              >
                <Box sx={{ p: 3 }}>
                  {/* Service Request Header */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Business color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        {serviceRequest.title}
                      </Typography>
                      {serviceRequest.is_urgent && (
                        <Chip
                          label="Urgent"
                          size="small"
                          color="error"
                          icon={<Emergency />}
                        />
                      )}
                    </Box>
                    <Chip
                      label={serviceRequest.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={
                        serviceRequest.status === 'completed' ? 'success' :
                        serviceRequest.status === 'in_progress' ? 'primary' :
                        serviceRequest.status === 'closed' ? 'default' :
                        'warning'
                      }
                    />
                  </Box>

                  {/* Service Details Grid */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    {/* Left Column - Service Info */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Service Details
                      </Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Pets fontSize="small" color="action" />
                          <Typography variant="body2">
                            <strong>Type:</strong> {serviceRequest.service_type}
                          </Typography>
                        </Box>
                        
                        {serviceRequest.location && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>Location:</strong> {serviceRequest.location}
                            </Typography>
                          </Box>
                        )}
                        
                        {(serviceRequest.budget_min || serviceRequest.budget_max) && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <AttachMoney fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>Budget:</strong> 
                              {serviceRequest.budget_min && serviceRequest.budget_max 
                                ? ` $${serviceRequest.budget_min} - $${serviceRequest.budget_max}`
                                : serviceRequest.budget_min 
                                  ? ` From $${serviceRequest.budget_min}`
                                  : ` Up to $${serviceRequest.budget_max}`
                              }
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Box>

                    {/* Right Column - People & Pets */}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        People & Pets
                      </Typography>
                      <Stack spacing={1}>
                        {/* Client Info */}
                        {serviceRequest.user && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>Client:</strong> {serviceRequest.user.full_name || serviceRequest.user.username}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Assigned Provider */}
                        {serviceRequest.assigned_provider && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Business fontSize="small" color="primary" />
                            <Typography variant="body2">
                              <strong>Provider:</strong> {serviceRequest.assigned_provider.full_name || serviceRequest.assigned_provider.username}
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Pets */}
                        {serviceRequest.pets && serviceRequest.pets.length > 0 && (
                          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Pets fontSize="small" color="action" />
                            <Box>
                              <Typography variant="body2">
                                <strong>Pet{serviceRequest.pets.length > 1 ? 's' : ''}:</strong>
                              </Typography>
                              {serviceRequest.pets.map((pet, index) => (
                                <Typography key={pet.id} variant="caption" sx={{ display: "block", ml: 1 }}>
                                  {pet.name} ({pet.type}{pet.breed ? ` - ${pet.breed}` : ''})
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Box>

                  {/* Description */}
                  {serviceRequest.description && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                        Description
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {serviceRequest.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Collapse>
          )}

      {/* Messages container */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 2, md: 3 },
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "grey.900" : "grey.50",
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          display: "flex",
          flexDirection: "column",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: (theme) => theme.palette.grey[400],
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: (theme) => theme.palette.grey[600],
          },
        }}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {" "}
        {messages.length === 0 ? (
          <Box sx={{ 
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            flexDirection: "column",
            gap: 2,
          }}>
            <Message sx={{ fontSize: 64, color: "text.secondary", opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" textAlign="center">
              {t("services.noMessagesYet")}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {t("services.startConversation")}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              startIcon={<Reply />}
              sx={{ mt: 2 }}
            >
              {t("chat.quickReplies")}
            </Button>
          </Box>
        ) : (
          <List>
            {/* Load More Button */}
            {hasMore && (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  startIcon={loadingMore ? <CircularProgress size={16} /> : undefined}
                >
                  {loadingMore ? "Loading..." : "Load More Messages"}
                </Button>
              </Box>
            )}
            
            {messages
              .filter((msg) => msg)
              .map((msg, index) => {
                console.log("💬 Rendering message:", {
                  id: msg.id,
                  message: msg.message,
                  message_type: msg.message_type,
                  created_at: msg.created_at,
                  attachments: msg.attachments,
                  sender_id: msg.sender_id,
                });

                // Properly identify own messages - only check user ID
                const isOwn = msg.sender_id === user?.id;
                const isSystem = msg.message_type === "system";

                return (
                  <ListItem
                    key={msg.id || index}
                    data-message-id={msg.id}
                    sx={{
                      flexDirection: isOwn ? "row-reverse" : "row",
                      alignItems: "flex-start",
                      py: 1.5,
                      px: 0,
                      width: "100%",
                      backgroundColor: highlightedMessageId === msg.id ? 'action.selected' : 'transparent',
                      transition: 'background-color 0.3s ease-in-out',
                      "&:hover": {
                        backgroundColor: "transparent", // Keep transparent background
                      },
                    }}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {!isOwn && !isSystem && (
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Box sx={{ position: "relative" }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {msg.sender?.username?.[0] || "U"}
                          </Avatar>
                          {/* User Role Badge */}
                          {msg.sender?.is_provider && (
                            <Chip
                              label="Provider"
                              size="small"
                              sx={{
                                position: "absolute",
                                bottom: -8,
                                left: "50%",
                                transform: "translateX(-50%)",
                                fontSize: "0.6rem",
                                height: 16,
                                backgroundColor: (theme) => theme.palette.primary.main,
                                color: "white",
                                "& .MuiChip-label": {
                                  px: 0.5,
                                },
                              }}
                            />
                          )}
                        </Box>
                      </ListItemAvatar>
                    )}
                    <ListItemText
                      sx={{
                        maxWidth: "75%",
                        ml: isOwn ? 0 : 2,
                        mr: isOwn ? 2 : 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isOwn ? "flex-end" : "flex-start",
                      }}
                      primary={
                        <Paper
                          sx={{
                            p: 2.5,
                            backgroundColor: isOwn
                              ? "primary.main"
                              : isSystem
                                ? (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "grey.800"
                                      : "grey.50"
                                : (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "grey.800"
                                      : "white",
                            color: isOwn
                              ? "primary.contrastText"
                              : "text.primary",
                            borderRadius: isOwn
                              ? "20px 20px 6px 20px"
                              : "20px 20px 20px 6px",
                            boxShadow: isOwn
                              ? "0 2px 8px rgba(0,0,0,0.15)"
                              : "0 1px 4px rgba(0,0,0,0.1)",
                            maxWidth: "100%",
                            wordWrap: "break-word",
                            border: isOwn
                              ? "none"
                              : (theme) =>
                                  theme.palette.mode === "dark"
                                    ? "1px solid rgba(255,255,255,0.1)"
                                    : "1px solid rgba(0,0,0,0.05)",
                            position: "relative",
                            "&::before": isOwn
                              ? {
                                  content: '""',
                                  position: "absolute",
                                  bottom: 0,
                                  right: -6,
                                  width: 0,
                                  height: 0,
                                  borderLeft: "6px solid transparent",
                                  borderTop: "6px solid",
                                  borderTopColor: (theme) => theme.palette.primary.main,
                                }
                              : {
                                  content: '""',
                                  position: "absolute",
                                  bottom: 0,
                                  left: -6,
                                  width: 0,
                                  height: 0,
                                  borderRight: "6px solid transparent",
                                  borderTop: "6px solid",
                                  borderTopColor: (theme) =>
                                    theme.palette.mode === "dark"
                                      ? theme.palette.grey[800]
                                      : "white",
                                },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1,
                            }}
                          >
                            {/* Only show message type icon if there are no attachments */}
                            {getMessageTypeIcon(msg.message_type) &&
                              (!msg.attachments ||
                                msg.attachments.length === 0) && (
                                <Box sx={{ mt: 0.5 }}>
                                  {getMessageTypeIcon(msg.message_type)}
                                </Box>
                              )}
                            <Box sx={{ flex: 1 }}>
                              {/* Sender name for non-own messages */}
                              {!isOwn && !isSystem && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    mb: 0.5,
                                    display: "block",
                                  }}
                                >
                                  {msg.sender?.username || "Unknown User"}
                                  {msg.sender?.is_provider && (
                                    <Chip
                                      label="Provider"
                                      size="small"
                                      sx={{
                                        ml: 1,
                                        fontSize: "0.6rem",
                                        height: 16,
                                        backgroundColor: (theme) => theme.palette.primary.main,
                                        color: "white",
                                        "& .MuiChip-label": {
                                          px: 0.5,
                                        },
                                      }}
                                    />
                                  )}
                                </Typography>
                              )}

                              {/* Reply to message display */}
                              {msg.message_metadata?.reply_to && (
                                <Box sx={{ mb: 1 }}>
                                  <ReplyMessage
                                    replyTo={msg.message_metadata.reply_to}
                                    compact={true}
                                  />
                                </Box>
                              )}
                              
                              <Typography
                                variant="body2"
                                sx={{
                                  color: isOwn
                                    ? "primary.contrastText"
                                    : "text.primary",
                                  fontWeight: 400,
                                }}
                              >
                                {getDisplayMessage(msg)}
                              </Typography>

                              {/* Render attachments from parsed message */}
                              {parseMessageAttachments(msg).length > 0 &&
                                renderMessageAttachments(parseMessageAttachments(msg))}

                              {/* Message reactions */}
                              {msg.message_metadata?.reactions && msg.message_metadata.reactions.length > 0 && (
                                <MessageReactions
                                  reactions={msg.message_metadata.reactions}
                                  onReactionClick={(emoji) => handleAddReaction(msg, emoji)}
                                  currentUserId={user?.id}
                                />
                              )}

                              {/* Render location message */}
                              {renderLocationMessage(msg)}

                              {/* Show image message indicator only if no attachments */}
                              {msg.message_type === "image" &&
                                (!msg.attachments ||
                                  msg.attachments.length === 0) && (
                                  <Box
                                    sx={{
                                      mt: 1,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Image
                                      color="primary"
                                      sx={{ fontSize: 16 }}
                                    />
                                    <Typography
                                      variant="caption"
                                      color="primary"
                                    >
                                      📎 Shared files
                                    </Typography>
                                  </Box>
                                )}

                              {/* Render location - removed since message_data doesn't exist */}

                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mt: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    opacity: 0.6,
                                    fontSize: "0.75rem",
                                    color: isOwn ? "primary.contrastText" : "text.secondary",
                                  }}
                                >
                                  {formatMessageTime(msg.created_at)}
                                </Typography>
                                
                                {/* Enhanced Message Status Indicators for own messages */}
                                {isOwn && (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    {/* Sent indicator */}
                                    <Tooltip title="Message sent">
                                      <Box
                                        sx={{
                                          width: 16,
                                          height: 16,
                                          borderRadius: "50%",
                                          backgroundColor: msg.delivery_status === 'sent' 
                                            ? (theme) => theme.palette.grey[400]
                                            : (theme) => theme.palette.success.main,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          transition: "all 0.2s ease-in-out",
                                        }}
                                      >
                                        <CheckCircle sx={{ fontSize: 10, color: "white" }} />
                                      </Box>
                                    </Tooltip>
                                    
                                    {/* Delivered indicator */}
                                    {msg.delivery_status === 'delivered' && (
                                      <Tooltip title={`Delivered at ${msg.delivered_at ? formatMessageTime(msg.delivered_at) : 'unknown time'}`}>
                                        <Box
                                          sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: "50%",
                                            backgroundColor: (theme) => theme.palette.success.main,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s ease-in-out",
                                          }}
                                        >
                                          <CheckCircle sx={{ fontSize: 10, color: "white" }} />
                                        </Box>
                                      </Tooltip>
                                    )}
                                    
                                    {/* Read indicator */}
                                    {msg.delivery_status === 'read' && (
                                      <Tooltip title={`Read at ${msg.read_at ? formatMessageTime(msg.read_at) : 'unknown time'}`}>
                                        <Box
                                          sx={{
                                            width: 16,
                                            height: 16,
                                            borderRadius: "50%",
                                            backgroundColor: (theme) => theme.palette.primary.main,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s ease-in-out",
                                            animation: "pulse 2s infinite",
                                            "@keyframes pulse": {
                                              "0%": { opacity: 1 },
                                              "50%": { opacity: 0.7 },
                                              "100%": { opacity: 1 },
                                            },
                                          }}
                                        >
                                          <Visibility sx={{ fontSize: 10, color: "white" }} />
                                        </Box>
                                      </Tooltip>
                                    )}
                                  </Box>
                                )}
                                
                                {/* Edited indicator */}
                                {msg.is_edited && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      opacity: 0.6,
                                      fontSize: "0.7rem",
                                      fontStyle: "italic",
                                      color: isOwn ? "primary.contrastText" : "text.secondary",
                                    }}
                                  >
                                    (edited)
                                  </Typography>
                                )}
                                
                                {/* Message actions - only show on hover */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    opacity: hoveredMessageId === msg.id ? 1 : 0,
                                    transition: "opacity 0.2s ease-in-out",
                                    ml: 1,
                                  }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyMessage(msg)}
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      color: isOwn ? "primary.contrastText" : "text.secondary",
                                      "&:hover": {
                                        backgroundColor: isOwn 
                                          ? "rgba(255,255,255,0.2)" 
                                          : "rgba(0,0,0,0.1)",
                                      },
                                    }}
                                    title="Copy message"
                                  >
                                    <ContentCopy sx={{ fontSize: 12 }} />
                                  </IconButton>
                                  
                                  <IconButton
                                    size="small"
                                    onClick={() => handleReplyToMessage(msg)}
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      color: isOwn ? "primary.contrastText" : "text.secondary",
                                      "&:hover": {
                                        backgroundColor: isOwn 
                                          ? "rgba(255,255,255,0.2)" 
                                          : "rgba(0,0,0,0.1)",
                                      },
                                    }}
                                    title="Reply to message"
                                  >
                                    <Reply sx={{ fontSize: 12 }} />
                                  </IconButton>
                                  
                                  {/* Reaction buttons */}
                                  <IconButton
                                    size="small"
                                    onClick={() => handleReaction(msg.id, "👍")}
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      color: isOwn ? "primary.contrastText" : "text.secondary",
                                      "&:hover": {
                                        backgroundColor: isOwn 
                                          ? "rgba(255,255,255,0.2)" 
                                          : "rgba(0,0,0,0.1)",
                                        transform: "scale(1.2)",
                                      },
                                    }}
                                    title="Like message"
                                  >
                                    <ThumbUp sx={{ fontSize: 12 }} />
                                  </IconButton>
                                  
                                  <IconButton
                                    size="small"
                                    onClick={() => handleReaction(msg.id, "❤️")}
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      color: isOwn ? "primary.contrastText" : "text.secondary",
                                      "&:hover": {
                                        backgroundColor: isOwn 
                                          ? "rgba(255,255,255,0.2)" 
                                          : "rgba(0,0,0,0.1)",
                                        transform: "scale(1.2)",
                                      },
                                    }}
                                    title="Love message"
                                  >
                                    <Favorite sx={{ fontSize: 12 }} />
                                  </IconButton>
                                  
                                  {isOwn && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteMessage(msg)}
                                      sx={{
                                        width: 20,
                                        height: 20,
                                        color: "error.main",
                                        "&:hover": {
                                          backgroundColor: "rgba(255,255,255,0.2)",
                                        },
                                      }}
                                      title="Delete message"
                                    >
                                      <Delete sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  )}
                                </Box>
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
            
            {/* Typing Indicator */}
            {otherUserTyping && (
              <TypingIndicator username="Provider" />
            )}
          </List>
        )}
        {/* Quick Replies */}
        {showQuickReplies && (
          <Paper 
            elevation={0}
            sx={{ 
              mt: 2, 
              p: 3,
              borderRadius: 3,
              backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.800" : "grey.50",
              border: (theme) => theme.palette.mode === "dark" 
                ? "1px solid rgba(255,255,255,0.1)" 
                : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={600} color="text.primary">
                {t("chat.quickReplies")}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowQuickReplies(false)}
                sx={{
                  backgroundColor: "transparent",
                  color: "text.secondary",
                  "&:hover": {
                    backgroundColor: (theme) => theme.palette.error.light + "20",
                    color: "error.main",
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>
            <Stack spacing={1.5}>
              {quickReplies.map((reply) => (
                <Button
                  key={reply.id}
                  variant="outlined"
                  size="medium"
                  startIcon={reply.icon}
                  onClick={() => handleQuickReply(reply)}
                  sx={{ 
                    justifyContent: "flex-start",
                    borderRadius: 2,
                    textTransform: "none",
                    py: 1.5,
                    px: 2,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor: (theme) => theme.palette.primary.light + "10",
                      borderColor: (theme) => theme.palette.primary.main,
                      transform: "translateY(-1px)",
                      boxShadow: (theme) => theme.palette.mode === "dark" 
                        ? "0 4px 12px rgba(0,0,0,0.3)" 
                        : "0 4px 12px rgba(0,0,0,0.1)",
                    },
                  }}
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
        <Paper 
          elevation={0}
          sx={{ 
            p: 2, 
            borderTop: 1, 
            borderColor: "divider",
            backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.800" : "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              {t("chat.selectedFiles")} ({selectedFiles.length})
            </Typography>
            <IconButton
              size="small"
              onClick={() => setSelectedFiles([])}
              sx={{
                backgroundColor: "transparent",
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.error.light + "20",
                  color: "error.main",
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            {selectedFiles.map((file, index) => (
              <Card 
                key={index} 
                sx={{ 
                  maxWidth: 140, 
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: (theme) => theme.palette.mode === "dark" 
                      ? "0 4px 12px rgba(0,0,0,0.3)" 
                      : "0 4px 12px rgba(0,0,0,0.15)",
                  },
                }}
              >
                {file.type.startsWith("image/") ? (
                  <CardMedia
                    component="img"
                    height="80"
                    image={URL.createObjectURL(file)}
                    alt={file.name}
                    sx={{ objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.700" : "grey.100",
                    }}
                  >
                    <InsertDriveFile fontSize="large" color="action" />
                  </Box>
                )}
                <CardContent sx={{ p: 1 }}>
                  <Typography 
                    variant="caption" 
                    noWrap
                    sx={{ 
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: "text.primary",
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: "0.7rem",
                      color: "text.secondary",
                      display: "block",
                    }}
                  >
                    {(file.size / 1024).toFixed(1)} KB
                  </Typography>
                </CardContent>
                <IconButton
                  size="small"
                  onClick={() => removeFile(index)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "white",
                    width: 24,
                    height: 24,
                    "&:hover": { 
                      backgroundColor: "rgba(0,0,0,0.8)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Card>
            ))}
          </Box>
          
          {/* Upload Progress */}
          {Array.from(uploadProgress.entries()).map(([fileName, progress]) => (
            <FileUploadProgress
              key={fileName}
              file={selectedFiles.find(f => f.name === fileName) || new File([], fileName)}
              progress={progress.progress}
              status={progress.status}
              error={progress.error}
              onCancel={() => handleCancelUpload(fileName)}
            />
          ))}
        </Paper>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: "divider",
            backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.800" : "grey.50",
            borderRadius: 0,
          }}
        >
          <ReplyMessage
            replyTo={replyingTo}
            onReplyClick={handleCancelReply}
            compact={true}
          />
        </Paper>
      )}

      {/* Input Area */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderTop: 1,
          borderColor: "divider",
          backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.800" : "white",
          borderRadius: 0,
          minHeight: { xs: "80px", md: "auto" },
          position: "relative",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5 }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {/* Action Buttons */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {/* Attach File */}
            <Tooltip title={t("chat.attachFile")}>
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  backgroundColor: "transparent",
                  color: "text.secondary",
                  borderRadius: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: (theme) => theme.palette.primary.light + "20",
                    color: "primary.main",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <AttachFile fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Share Photo */}
            <Tooltip title={t("chat.sharePhoto")}>
              <IconButton
                size="small"
                onClick={() => imageInputRef.current?.click()}
                sx={{
                  backgroundColor: "transparent",
                  color: "text.secondary",
                  borderRadius: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: (theme) => theme.palette.primary.light + "20",
                    color: "primary.main",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <Image fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Share Location */}
            <Tooltip title={t("chat.shareLocation")}>
              <IconButton 
                size="small" 
                onClick={handleShareLocation}
                sx={{
                  backgroundColor: "transparent",
                  color: "text.secondary",
                  borderRadius: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: (theme) => theme.palette.primary.light + "20",
                    color: "primary.main",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <LocationOn fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Message Input */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => {
              const value = e.target.value;
              setInput(value);
              
              // Handle typing indicators
              if (value.trim() && !isTyping) {
                setIsTyping(true);
                onTypingChange?.(true);
              } else if (!value.trim() && isTyping) {
                setIsTyping(false);
                onTypingChange?.(false);
              }
              
              // Clear existing timeout
              if (typingTimeout) {
                clearTimeout(typingTimeout);
              }
              
              // Set new timeout to stop typing indicator
              const timeout = setTimeout(() => {
                if (isTyping) {
                  setIsTyping(false);
                  onTypingChange?.(false);
                }
              }, 2000); // Stop typing indicator after 2 seconds of inactivity
              
              setTypingTimeout(timeout);
            }}
            onKeyDown={handleKeyPress}
            placeholder={t("services.messagePlaceholder")}
            disabled={isSending}
            variant="outlined"
            size="small"
            aria-label="Type your message"
            aria-describedby="message-input-help"
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "grey.700" : "grey.50",
                borderRadius: 4,
                boxShadow: (theme) => theme.palette.mode === "dark" 
                  ? "0 2px 8px rgba(0,0,0,0.3)" 
                  : "0 2px 8px rgba(0,0,0,0.1)",
                border: (theme) => theme.palette.mode === "dark" 
                  ? "1px solid rgba(255,255,255,0.1)" 
                  : "1px solid rgba(0,0,0,0.1)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  borderColor: (theme) => theme.palette.primary.main,
                  boxShadow: (theme) => theme.palette.mode === "dark" 
                    ? "0 4px 12px rgba(0,0,0,0.4)" 
                    : "0 4px 12px rgba(0,0,0,0.15)",
                },
                "&.Mui-focused": {
                  borderColor: (theme) => theme.palette.primary.main,
                  boxShadow: (theme) => theme.palette.mode === "dark" 
                    ? "0 4px 12px rgba(0,0,0,0.4)" 
                    : "0 4px 12px rgba(0,0,0,0.15)",
                },
              },
              "& .MuiInputBase-input": {
                fontSize: "0.9rem",
                padding: "12px 16px",
                lineHeight: 1.4,
              },
            }}
          />

          {/* Send Button */}
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={
              (!input.trim() && selectedFiles.length === 0) || isSending
            }
            aria-label={isSending ? "Sending message" : "Send message"}
            aria-describedby="send-button-help"
            sx={{
              backgroundColor: (theme) => theme.palette.primary.main,
              color: "white",
              borderRadius: 3,
              width: 48,
              height: 48,
              transition: "all 0.2s ease-in-out",
              boxShadow: (theme) => theme.palette.mode === "dark" 
                ? "0 2px 8px rgba(0,0,0,0.3)" 
                : "0 2px 8px rgba(0,0,0,0.15)",
              "&:hover": {
                transform: "scale(1.05)",
                backgroundColor: (theme) => theme.palette.primary.dark,
                boxShadow: (theme) => theme.palette.mode === "dark" 
                  ? "0 4px 12px rgba(0,0,0,0.4)" 
                  : "0 4px 12px rgba(0,0,0,0.2)",
              },
              "&:disabled": {
                opacity: 0.5,
                backgroundColor: (theme) => theme.palette.grey[400],
                transform: "none",
              },
            }}
          >
            {isSending ? (
              <CircularProgress 
                size={20} 
                sx={{ 
                  color: "white",
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }} 
              />
            ) : (
              <Send sx={{ 
                transition: "transform 0.2s ease-in-out",
                "&:hover": { transform: "translateX(2px)" },
              }} />
            )}
          </IconButton>
        </Box>
        
        {/* Character Count */}
        {input.length > 0 && (
          <Box sx={{ 
            position: "absolute", 
            bottom: 8, 
            right: 8,
            opacity: 0.6,
          }}>
            <Typography variant="caption" color="text.secondary">
              {input.length}/2000
            </Typography>
          </Box>
        )}
        
        {/* Hidden help text for screen readers */}
        <Box sx={{ display: "none" }}>
          <Typography id="message-input-help">
            Type your message here. Press Enter to send, Shift+Enter for new line.
            Maximum 2000 characters.
          </Typography>
          <Typography id="send-button-help">
            Click to send your message. Button is disabled when message is empty or sending.
          </Typography>
        </Box>
      </Paper>

      {/* Quick Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {user?.is_provider ? (
          // Provider-specific actions
          <>
            <MenuItem onClick={handleShareLocation}>
              <LocationOn sx={{ mr: 1 }} />
              {t('chat.shareMyLocation')}
            </MenuItem>
            <MenuItem onClick={() => handleAction("request_photos")}>
              <Image sx={{ mr: 1 }} />
              {t('chat.requestPetPhotos')}
            </MenuItem>
            <MenuItem onClick={() => handleAction("schedule_meeting")}>
              <Schedule sx={{ mr: 1 }} />
              {t('chat.scheduleConsultation')}
            </MenuItem>
            <MenuItem onClick={() => handleAction("share_experience")}>
              <Star sx={{ mr: 1 }} />
              {t('chat.shareExperience')}
            </MenuItem>
          </>
        ) : (
          // Client-specific actions
          <>
            <MenuItem onClick={handleShareLocation}>
              <LocationOn sx={{ mr: 1 }} />
              {t('chat.shareLocation')}
            </MenuItem>
            <MenuItem onClick={() => handleAction("request_photos")}>
              <Image sx={{ mr: 1 }} />
              {t('chat.requestPetPhotos')}
            </MenuItem>
            <MenuItem onClick={() => handleAction("schedule_meeting")}>
              <Schedule sx={{ mr: 1 }} />
              {t('chat.scheduleMeeting')}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Media Dialog */}
      <Dialog
        open={mediaDialogOpen}
        onClose={closeMediaDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {selectedMedia?.file_name}
            <IconButton onClick={closeMediaDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMedia && (
            <Box sx={{ textAlign: "center" }}>
              <img
                src={selectedMedia.file_url.startsWith('http') ? selectedMedia.file_url : 
                     (process.env.NODE_ENV === 'production' 
                       ? 'https://pawfectpal-production.up.railway.app' + (selectedMedia.file_url.startsWith('/') ? selectedMedia.file_url : '/' + selectedMedia.file_url)
                       : 'http://localhost:8000' + (selectedMedia.file_url.startsWith('/') ? selectedMedia.file_url : '/' + selectedMedia.file_url))}
                alt={selectedMedia.file_name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  console.error('❌ Image failed to load:', selectedMedia.file_url);
                  console.error('❌ Constructed URL:', selectedMedia.file_url.startsWith('http') ? selectedMedia.file_url : 
                     (process.env.NODE_ENV === 'production' 
                       ? 'https://pawfectpal-production.up.railway.app' + (selectedMedia.file_url.startsWith('/') ? selectedMedia.file_url : '/' + selectedMedia.file_url)
                       : 'http://localhost:8000' + (selectedMedia.file_url.startsWith('/') ? selectedMedia.file_url : '/' + selectedMedia.file_url)));
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
                const link = document.createElement("a");
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

      {/* Demo Typing Indicator Button - Remove in production */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: 1, 
        borderColor: "divider",
        backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.900" : "grey.100",
        display: "flex",
        justifyContent: "center",
      }}>
        <Button
          variant="text"
          size="small"
          onClick={() => {
            if (otherUserTyping) {
              setOtherUserTyping(false);
            } else {
              setOtherUserTyping(true);
              // Auto-hide after 3 seconds
              setTimeout(() => setOtherUserTyping(false), 3000);
            }
          }}
          sx={{ 
            fontSize: "0.7rem",
            textTransform: "none",
            color: "text.secondary",
            opacity: 0.7,
            "&:hover": {
              backgroundColor: "transparent",
              opacity: 1,
            },
          }}
        >
          {otherUserTyping ? "Stop Typing Demo" : "Start Typing Demo"}
        </Button>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Message Search Modal */}
      <MessageSearch
        messages={messages}
        onMessageClick={handleSearchMessageClick}
        onClose={handleCloseSearch}
        open={isSearchOpen}
      />
    </Paper>
  );
};
