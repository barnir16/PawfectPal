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
      const data = await chatService.getMyConversations();
      setConversations(data);
    } catch (err: any) {
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
    const messageTime = new Date(lastMessage.created_at);
    const now = new Date();
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return t("chat.justNow");
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageTime.toLocaleDateString();
    }
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
              transition: "0.3s",
              "&:hover": { boxShadow: 6, transform: "scale(1.01)" },
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
                    <Typography variant="h6" fontWeight={600} noWrap>
                      Service #{conv.service_request_id}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {conv.unread_count > 0 && (
                        <Chip
                          label={conv.unread_count}
                          size="small"
                          color="primary"
                          sx={{ minWidth: 20, height: 20 }}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary">
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
                      lineHeight: 1.4,
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
