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
    
    // Truncate long messages
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

  const handleOpenConversation = (conversation: ChatConversation) => {
    navigate(`/chat/${conversation.service_request_id}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ p: 5, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, fontWeight: 500 }}>
            {t("chat.loadingConversations")}
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Typography
          color="error"
          sx={{ p: 5, textAlign: "center", fontWeight: 500 }}
        >
          {error}
        </Typography>
      );
    }

    if (conversations.length === 0) {
      return (
        <Typography
          sx={{
            p: 5,
            textAlign: "center",
            color: "text.secondary",
            fontStyle: "italic",
          }}
        >
          {t("chat.noConversations")}
        </Typography>
      );
    }

    return (
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
                    <Typography 
                      variant="h6" 
                      fontWeight={600} 
                      noWrap
                      sx={{
                        color: (theme) => theme.palette.text.primary,
                        fontSize: "1.1rem",
                      }}
                    >
                      Service #{conv.service_request_id}
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
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      <Message fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </List>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        {t("chat.chatTitle")}
      </Typography>
      <Paper elevation={3} sx={{ mt: 2, borderRadius: 2 }}>
        {renderContent()}
      </Paper>
    </Box>
  );
};
