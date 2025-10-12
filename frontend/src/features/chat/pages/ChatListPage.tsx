import { useEffect, useState, useMemo } from "react";
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
import { useAuth } from "../../../contexts/AuthContext";
import type { ChatConversation } from "../../../types/services/chat";
import { useNavigate } from "react-router-dom";
import { chatService } from "../../../services/chat/chatService";
import { ServiceRequestService } from "../../../services/serviceRequests/serviceRequestService";
import { formatChatListTime } from "../../../utils/timeUtils";
import type { ServiceRequest } from "../../../types/services/serviceRequest";

export const ChatListPage = () => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<Map<number, ServiceRequest>>(new Map());

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

      // Fetch service request data for each conversation to create better titles
      const serviceRequestMap = new Map<number, ServiceRequest>();
      const fetchPromises = data.map(async (conversation) => {
        try {
          const serviceRequest = await ServiceRequestService.getServiceRequest(conversation.service_request_id);
          serviceRequestMap.set(conversation.service_request_id, serviceRequest);
          console.log('🔍 ChatListPage: Fetched service request for conversation', conversation.service_request_id, serviceRequest.title);
        } catch (error) {
          console.warn('⚠️ ChatListPage: Failed to fetch service request for conversation', conversation.service_request_id, error);
        }
      });

      await Promise.all(fetchPromises);
      setServiceRequests(serviceRequestMap);
      console.log('🔍 ChatListPage: Service requests fetched:', serviceRequestMap.size);
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

  // Memoized service type map for better performance
  const serviceTypeMap = useMemo(() => ({
    'walking': t("walking"),
    'walk': t("walking"),
    'sitting': t("sitting"),
    'sit': t("sitting"),
    'boarding': t("boarding"),
    'board': t("boarding"),
    'grooming': t("grooming"),
    'groom': t("grooming"),
    'vet': t("veterinary"),
    'veterinary': t("veterinary"),
    'care': t("petCare"),
    'service': t("petCare"),
  }), [t]);

  const getChatTitle = (conversation: ChatConversation): string => {
    const serviceRequest = serviceRequests.get(conversation.service_request_id);
    
    // If we have service request data, use it for a better title
    if (serviceRequest) {
      const serviceType = serviceTypeMap[serviceRequest.service_type] || t("petCare");
      const title = serviceRequest.title;
      
      // Find the OTHER participant (provider or client)
      let otherParticipantName = t("provider");
      const currentUserId = user?.id;
      
      // If current user is the service request owner, show provider name
      if (serviceRequest.user?.id === currentUserId && serviceRequest.assigned_provider) {
        otherParticipantName = serviceRequest.assigned_provider.username || t("provider");
      }
      // If current user is the provider, show client name
      else if (serviceRequest.assigned_provider?.id === currentUserId && serviceRequest.user) {
        otherParticipantName = serviceRequest.user.username || t("client");
      }
      
      const finalTitle = `${serviceType}: ${title} - ${otherParticipantName}`;
      
      console.log('🔍 Service Request Title Debug:', {
        conversationId: conversation.service_request_id,
        serviceRequestTitle: serviceRequest.title,
        serviceType: serviceRequest.service_type,
        otherParticipantName,
        finalTitle
      });
      
      return finalTitle;
    }
    
    // Fallback to message-based title if no service request data
    if (conversation.messages.length > 0) {
      const firstMessage = conversation.messages[0];
      const messageText = firstMessage.message;
      
      // Extract service type from message content
      let serviceType = "";
      const lowerMessage = messageText.toLowerCase();
      
      for (const [keyword, translation] of Object.entries(serviceTypeMap)) {
        if (lowerMessage.includes(keyword)) {
          serviceType = translation;
          break;
        }
      }
      
      if (!serviceType) {
        serviceType = t("petCare");
      }
      
      // Find the OTHER participant in the conversation
      let otherParticipantName = t("provider");
      const currentUserId = user?.id;
      
      for (const message of conversation.messages) {
        if (message.sender_id !== currentUserId && message.sender?.username) {
          otherParticipantName = message.sender.username;
          break;
        }
      }
      
      const messagePreview = messageText.length > 30 
        ? messageText.substring(0, 30) + "..." 
        : messageText;
      
      const title = `${serviceType}: ${messagePreview} - ${otherParticipantName}`;
      
      console.log('🔍 Message-based Title Debug:', {
        conversationId: conversation.service_request_id,
        firstMessage: firstMessage.message,
        otherParticipantName,
        serviceType,
        finalTitle: title
      });
      
      return title;
    }
    
    // No messages and no service request data - show generic title
    return t("newServiceRequest");
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
                          {conv.messages.length} {conv.messages.length === 1 ? t("chat.message") : t("chat.messages")}
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
              {conversations.length} {conversations.length === 1 ? t("chat.conversation") : t("chat.conversations")}
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
