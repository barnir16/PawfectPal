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
} from "@mui/icons-material";
import { useLocalization } from "../../contexts/LocalizationContext";
import { useAuth } from "../../contexts/AuthContext";
import type {
  ChatMessage,
  ChatMessageCreate,
  MediaAttachment,
} from "../../types/services/chat";
import { chatService } from "../../services/chat/chatService";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const quickReplies: QuickReply[] = [
    {
      id: "greeting",
      text: "Hi! I'm interested in your service request.",
      icon: <Pets />,
    },
    {
      id: "availability",
      text: "I'm available for this service. When would you like to meet?",
      icon: <Schedule />,
    },
    {
      id: "location",
      text: "Could you share the exact location?",
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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Helper function to parse attachment data from message
  const parseMessageAttachments = (message: ChatMessage): MediaAttachment[] => {
    // First try to get attachments from message_metadata
    if (message.message_metadata?.attachments && Array.isArray(message.message_metadata.attachments)) {
      return message.message_metadata.attachments.map((att: any) => ({
        id: att.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_type: att.file_type,
        file_size: att.file_size,
        created_at: att.created_at,
      }));
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
    if (message.message_type === "location" && text.includes("📍 Location shared")) {
      const lines = text.split('\n');
      const latLine = lines.find(line => line.startsWith('Lat:'));
      const lngLine = lines.find(line => line.startsWith('Lng:'));
      
      if (latLine && lngLine) {
        const lat = parseFloat(latLine.replace('Lat:', '').trim());
        const lng = parseFloat(lngLine.replace('Lng:', '').trim());
        
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              📍 Shared location
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<LocationOn />}
              onClick={() => {
                const url = `https://www.google.com/maps?q=${lat},${lng}`;
                window.open(url, '_blank');
              }}
              sx={{ fontSize: '0.75rem' }}
            >
              Open in Maps
            </Button>
          </Box>
        );
      }
    }
    return null;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      let errorMessage = "Failed to send message";
      
      if (error?.response?.status === 400) {
        errorMessage = error.response.data?.detail || "Invalid message or file";
      } else if (error?.response?.status === 413) {
        errorMessage = "File too large. Please reduce file size and try again.";
      } else if (error?.response?.status === 403) {
        errorMessage = "You don't have permission to send messages in this chat.";
      } else if (error?.response?.status === 404) {
        errorMessage = "Service request not found.";
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
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

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    // Handle negative differences (future timestamps)
    if (diffInMinutes < 0) return t("services.justNow");
    if (diffInMinutes < 1) return t("services.justNow");
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
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
    console.log(
      "🖼️ Attachment details:",
      attachments.map((att) => ({
        id: att.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_type: att.file_type,
      }))
    );

    // Test each image URL
    attachments.forEach((att) => {
      if (att.file_url) {
        testImageUrl(att.file_url);
      }
    });

    return (
      <Box sx={{ mt: 1 }}>
        {attachments.map((attachment, index) => (
          <Card
            key={attachment.id}
            sx={{
              maxWidth: 200,
              mb: 1,
              cursor: "pointer",
            }}
            onClick={() => openMediaDialog(attachment)}
          >
            <CardMedia
              component="img"
              height="120"
              image={attachment.thumbnail_url || attachment.file_url}
              alt={attachment.file_name}
              onError={(e) => {
                console.error("🖼️ Image load error:", {
                  url: attachment.file_url,
                  thumbnailUrl: attachment.thumbnail_url,
                  fileName: attachment.file_name,
                  error: e,
                  target: e.target,
                });
              }}
              onLoad={() => {
                console.log("🖼️ Image loaded successfully:", {
                  url: attachment.file_url,
                  thumbnailUrl: attachment.thumbnail_url,
                  fileName: attachment.file_name,
                });
              }}
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
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">{t("services.conversation")}</Typography>{" "}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Quick Actions">
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Messages container */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: { xs: 1, md: 3 },
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "grey.900" : "grey.50",
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          display: "flex",
          flexDirection: "column",
        }}
      >
        {" "}
        {messages.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {t("services.noMessagesYet")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("services.startConversation")}
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
                    sx={{
                      flexDirection: isOwn ? "row-reverse" : "row",
                      alignItems: "flex-start",
                      py: 1.5,
                      px: 0,
                      width: "100%",
                    }}
                  >
                    {!isOwn && !isSystem && (
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {msg.sender?.username?.[0] || "U"}
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
                            p: 2,
                            backgroundColor: isOwn
                              ? "primary.main"
                              : isSystem
                                ? (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "grey.800"
                                      : "grey.100"
                                : (theme) =>
                                    theme.palette.mode === "dark"
                                      ? "grey.800"
                                      : "white",
                            color: isOwn
                              ? "primary.contrastText"
                              : "text.primary",
                            borderRadius: isOwn
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                            boxShadow: 2,
                            maxWidth: "100%",
                            wordWrap: "break-word",
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
                                    opacity: 0.7,
                                  }}
                                >
                                  {formatTimestamp(msg.created_at)}
                                </Typography>
                                {msg.is_read && isOwn && (
                                  <CheckCircle
                                    fontSize="small"
                                    sx={{ opacity: 0.7 }}
                                  />
                                )}
                                {msg.is_edited && (
                                  <Typography
                                    variant="caption"
                                    sx={{ opacity: 0.7 }}
                                  >
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
        {/* Typing Indicator */}
        {otherUserTyping && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
            <Avatar sx={{ width: 24, height: 24 }}>
              <Pets fontSize="small" />
            </Avatar>
            <Paper
              sx={{
                p: 1,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "grey.800" : "grey.100",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t("chat.typing")}...
              </Typography>
            </Paper>
          </Box>
        )}
        {/* Quick Replies */}
        {showQuickReplies && (
          <Paper sx={{ mt: 2, p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle2">Quick Replies</Typography>
              <IconButton
                size="small"
                onClick={() => setShowQuickReplies(false)}
              >
                <Close />
              </IconButton>
            </Box>
            <Stack spacing={1}>
              {quickReplies.map((reply) => (
                <Button
                  key={reply.id}
                  variant="outlined"
                  size="small"
                  startIcon={reply.icon}
                  onClick={() => handleQuickReply(reply)}
                  sx={{ justifyContent: "flex-start" }}
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
        <Paper sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
            Selected files ({selectedFiles.length}):
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {selectedFiles.map((file, index) => (
              <Card key={index} sx={{ maxWidth: 120, position: "relative" }}>
                {file.type.startsWith("image/") ? (
                  <CardMedia
                    component="img"
                    height="60"
                    image={URL.createObjectURL(file)}
                    alt={file.name}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 60,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <InsertDriveFile fontSize="large" color="action" />
                  </Box>
                )}
                <CardContent sx={{ p: 0.5 }}>
                  <Typography variant="caption" noWrap>
                    {file.name}
                  </Typography>
                </CardContent>
                <IconButton
                  size="small"
                  onClick={() => removeFile(index)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "white",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Input */}
      <Paper
        sx={{
          p: { xs: 1, md: 2 },
          borderTop: 1,
          borderColor: "divider",
          backgroundColor: "white",
          borderRadius: 0,
          minHeight: { xs: "60px", md: "auto" }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

          {/* Attach File */}
          <Tooltip title="Attach File">
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
            >
              <AttachFile />
            </IconButton>
          </Tooltip>

          {/* Share Photo */}
          <Tooltip title="Share Photo">
            <IconButton
              size="small"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image />
            </IconButton>
          </Tooltip>

          {/* Share Location */}
          <Tooltip title="Share Location">
            <IconButton size="small" onClick={handleShareLocation}>
              <LocationOn />
            </IconButton>
          </Tooltip>

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
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "grey.800" : "white",
                borderRadius: 3,
                boxShadow: 1,
                paddingY: 0, // reduce vertical padding
              },
              "& .MuiInputBase-input": {
                fontSize: "0.875rem",
                padding: "8px 12px", // shrink input padding
              },
            }}
          />

          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={
              (!input.trim() && selectedFiles.length === 0) || isSending
            }
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
        <MenuItem onClick={handleShareLocation}>
          <LocationOn sx={{ mr: 1 }} />
          Share Location
        </MenuItem>
        <MenuItem onClick={() => handleAction("request_photos")}>
          <Image sx={{ mr: 1 }} />
          Request Pet Photos
        </MenuItem>
        <MenuItem onClick={() => handleAction("schedule_meeting")}>
          <Schedule sx={{ mr: 1 }} />
          Schedule Meeting
        </MenuItem>
        <MenuItem onClick={() => handleAction("share_instructions")}>
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
                src={selectedMedia.file_url}
                alt={selectedMedia.file_name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
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
    </Paper>
  );
};
