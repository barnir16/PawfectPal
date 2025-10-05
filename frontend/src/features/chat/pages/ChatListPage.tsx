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
} from "@mui/material";
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

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await chatService.getMyConversations();
        setConversations(data);
      } catch (err: any) {
        setError(err.message || t("chat.somethingWentWrong"));
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [t]);

  const handleOpenConversation = (conversation: ChatConversation) => {
    navigate(`/chat/${conversation.service_request_id}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ p: 5, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2, fontWeight: 500 }}>
            {t("chat.loading")}
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
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Service #{conv.service_request_id}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ maxWidth: 400 }}
                  >
                    {conv.messages.length
                      ? conv.messages[conv.messages.length - 1].message
                      : t("chat.noMessagesYet")}
                  </Typography>
                </Box>
                {conv.unread_count > 0 && (
                  <Badge color="primary" badgeContent={conv.unread_count} />
                )}
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
        {t("chat.title")}
      </Typography>
      <Paper elevation={3} sx={{ mt: 2, borderRadius: 2 }}>
        {renderContent()}
      </Paper>
    </Box>
  );
};
