import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Badge,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Message,
  AccessTime,
  Person,
  MoreVert,
  Refresh,
} from "@mui/icons-material";
import { useLocalization } from "../../../contexts/LocalizationContext";
import type { ChatConversation } from "../../../types/services/chat";
import { useNavigate } from "react-router-dom";
import { chatService } from "../../../services/chat/chatService";
import { formatChatListTime } from "../../../utils/timeUtils";

export const ChatListPage = () => {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Skeleton loading component for chat list
  const ChatListSkeleton = () => (
    <List sx={{ p: 0 }}>
      {[1, 2, 3].map((index) => (
        <Card
          key={index}
          variant="outlined"
          sx={{
            mb: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: (theme) => 
              theme.palette.mode === "dark" 
                ? "rgba(255,255,255,0.1)" 
                : "rgba(0,0,0,0.08)",
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 24,
                      backgroundColor: (theme) =>
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
                  <Box
                    sx={{
                      width: 40,
                      height: 16,
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      borderRadius: 1,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                </Stack>
                
                <Box
                  sx={{
                    width: "80%",
                    height: 16,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    borderRadius: 1,
                    animation: "pulse 1.5s ease-in-out infinite",
                    mt: 0.5,
                  }}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </List>
  );

  // Auto-refresh conversations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchConversations(true);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [t]);

  const fetchConversations = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      console.log('🔍 ChatListPage: Fetching conversations...');
      const data = await chatService.getMyConversations();
      console.log('🔍 ChatListPage: Received conversations:', data);
      console.log('🔍 ChatListPage: Conversations count:', data.length);
      console.log('🔍 ChatListPage: First conversation:', data[0]);
      setConversations(data);
    } catch (err: any) {
      console.error('❌ ChatListPage: Error fetching conversations:', err);
      setError(err.message || t("chat.somethingWentWrong"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatLastMessage = (conversation: ChatConversation): string => {
    if (conversation.messages.length === 0) {
      return t("chat.noMessagesYet");
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const messageText = lastMessage.message;
    
    // Handle different message types with localized text
    if (lastMessage.message_type === "image") {
      return t("chat.sharedImage"); // "Shared an image" or localized equivalent
    }
    
    if (lastMessage.message_type === "file") {
      return t("chat.sharedFile"); // "Shared a file" or localized equivalent
    }
    
    if (lastMessage.message_type === "location") {
      return t("chat.sharedLocation"); // "Shared location" or localized equivalent
    }
    
    if (lastMessage.message_type === "system") {
      return t("chat.systemMessage"); // "System message" or localized equivalent
    }
    
    // For text messages, truncate if too long
    if (messageText.length > 50) {
      return messageText.substring(0, 50) + "...";
    }
    
    return messageText;
  };

  const formatLastMessageTime = (conversation: ChatConversation): string => {
    if (conversation.messages.length === 0) {
      return "";
    }
    
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return formatChatListTime(lastMessage.created_at);
  };

  const getChatTitle = (conversation: ChatConversation): string => {
    // If there are messages, create a meaningful title
    if (conversation.messages.length > 0) {
      const firstMessage = conversation.messages[0];
      const messageText = firstMessage.message;
      
      // Extract service type from message content
      let serviceType = "";
      const lowerMessage = messageText.toLowerCase();
      
      if (lowerMessage.includes('walking') || lowerMessage.includes('walk')) {
        serviceType = t("walking"); // "Dog Walking" or localized equivalent
      } else if (lowerMessage.includes('sitting') || lowerMessage.includes('sit')) {
        serviceType = t("sitting"); // "Pet Sitting" or localized equivalent
      } else if (lowerMessage.includes('boarding') || lowerMessage.includes('board')) {
        serviceType = t("boarding"); // "Pet Boarding" or localized equivalent
      } else if (lowerMessage.includes('grooming') || lowerMessage.includes('groom')) {
        serviceType = t("grooming"); // "Pet Grooming" or localized equivalent
      } else if (lowerMessage.includes('vet') || lowerMessage.includes('veterinary')) {
        serviceType = t("veterinary"); // "Veterinary" or localized equivalent
      } else {
        serviceType = t("petCare"); // "Pet Care" or localized equivalent
      }
      
      // Extract provider name (sender of first message)
      const providerName = firstMessage.sender?.username || t("provider"); // "Provider" or localized equivalent
      
      // Get initial message preview (first 30 characters)
      const messagePreview = messageText.length > 30 
        ? messageText.substring(0, 30) + "..." 
        : messageText;
      
      // Format: "Service Type: Initial Message - Provider Name"
      return `${serviceType}: ${messagePreview} - ${providerName}`;
    }
    
    // No messages yet - show generic title
    return t("newServiceRequest"); // "New Service Request" or localized equivalent
  };

  const handleOpenConversation = (conversation: ChatConversation) => {
    navigate(`/chat/${conversation.service_request_id}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}>
          <CircularProgress size={40} />
          <Typography variant="h6" color="text.secondary">
            {t("chat.loadingConversations")}
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          p: 4,
        }}>
          <Typography variant="h6" color="error" textAlign="center">
            {error}
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => fetchConversations()}
            startIcon={<Refresh />}
          >
            {t("retry")}
          </Button>
        </Box>
      );
    }

    if (conversations.length === 0) {
      return (
        <Box sx={{ 
          flex: 1, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
          p: 4,
        }}>
          <Message sx={{ fontSize: 64, color: "text.secondary", opacity: 0.5 }} />
          <Typography variant="h6" color="text.secondary" textAlign="center">
            {t("chat.noConversations")}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t("chat.noConversationsDescription")}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ 
        flex: 1, 
        overflow: "auto",
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
      }}>
        <List sx={{ p: 0 }}>
          {conversations.map((conv) => (
            <Card
              key={conv.service_request_id}
              variant="outlined"
              sx={{
                mb: 2,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                borderRadius: 3,
                border: "1px solid",
                borderColor: (theme) => 
                  theme.palette.mode === "dark" 
                    ? "rgba(255,255,255,0.1)" 
                    : "rgba(0,0,0,0.08)",
                backgroundColor: (theme) => 
                  theme.palette.mode === "dark" ? "grey.800" : "white",
                "&:hover": { 
                  boxShadow: (theme) => 
                    theme.palette.mode === "dark"
                      ? "0 8px 32px rgba(0,0,0,0.3)"
                      : "0 8px 32px rgba(0,0,0,0.12)",
                  transform: "translateY(-2px)",
                  borderColor: (theme) => theme.palette.primary.main,
                },
                "&:active": {
                  transform: "translateY(0px)",
                }
              }}
              onClick={() => handleOpenConversation(conv)}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1.5 }}
                    >
                      <Typography 
                        variant="h6" 
                        fontWeight={600} 
                        noWrap
                        sx={{
                          color: (theme) => theme.palette.text.primary,
                          fontSize: "1.1rem",
                          lineHeight: 1.3,
                        }}
                      >
                        {getChatTitle(conv)}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {conv.unread_count > 0 && (
                          <Chip
                            label={conv.unread_count}
                            size="small"
                            color="primary"
                            sx={{ 
                              minWidth: 24, 
                              height: 24,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              borderRadius: "12px",
                              backgroundColor: (theme) => theme.palette.primary.main,
                              color: (theme) => theme.palette.primary.contrastText,
                            }}
                          />
                        )}
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatLastMessageTime(conv)}
                        </Typography>
                      </Stack>
                    </Stack>
                    
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.5,
                        fontSize: "0.9rem",
                        opacity: 0.8,
                        mt: 0.5,
                      }}
                    >
                      {formatLastMessage(conv)}
                    </Typography>
                    
                    {conv.messages.length > 0 && (
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
                        <Message fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {conv.messages.length} {conv.messages.length === 1 ? t("message") : t("messages")}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column",
      backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.900" : "grey.50",
    }}>
      {/* Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          borderRadius: 0,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: (theme) => theme.palette.mode === "dark" ? "grey.800" : "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                color: (theme) => theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              {t("chat.chatTitle")}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: "0.9rem" }}
            >
              {conversations.length} {conversations.length === 1 ? t("conversation") : t("conversations")}
            </Typography>
          </Box>
          
          {/* Action Buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              onClick={() => fetchConversations(true)}
              disabled={refreshing}
              sx={{
                backgroundColor: (theme) => theme.palette.primary.main,
                color: "white",
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
                "&:disabled": {
                  backgroundColor: (theme) => theme.palette.grey[400],
                },
              }}
            >
              {refreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Content Area */}
      <Box sx={{ 
        flex: 1, 
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}>
        {renderContent()}
      </Box>
    </Box>
  );
};
