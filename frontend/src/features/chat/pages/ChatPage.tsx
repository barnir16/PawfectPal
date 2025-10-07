// src/features/chat/pages/ChatPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Breadcrumbs, 
  Link,
  IconButton,
  Paper,
} from "@mui/material";
import { ArrowBack, Home, Message } from "@mui/icons-material";
import { EnhancedChatWindow } from "../../../components/services/EnhancedChatWindow";
import type {
  ChatConversation,
  ChatMessage,
  ChatMessageCreate,
} from "../../../types/services/chat";
import { chatService } from "../../../services/chat/chatService";

export const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const data = await chatService.getConversation(Number(id));
        setConversation(data);
      } catch (err) {
        console.error("Failed to fetch conversation", err);
        setConversation(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchConversation();
    }
  }, [id]);

  const handleSendMessage = async (msg: ChatMessageCreate) => {
    if (!conversation) return;
    try {
      setSending(true);
      const newMsg: ChatMessage = await chatService.sendMessage(
        conversation.service_request_id,
        msg
      );

      setConversation({
        ...conversation,
        messages: [...conversation.messages, newMsg],
        unread_count: 0,
      });
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = (action: string, data?: any) => {
    console.log("Quick action triggered:", action, data);
    // implement your action handling here
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!conversation) {
    return (
      <Typography variant="h6" sx={{ mt: 4, textAlign: "center" }}>
        Conversation not found
      </Typography>
    );
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Breadcrumb Navigation */}
      <Paper elevation={1} sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/chat-list")} size="small">
            <ArrowBack />
          </IconButton>
          <Breadcrumbs>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/dashboard")}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Home fontSize="small" />
              Dashboard
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate("/chat-list")}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Message fontSize="small" />
              Chats
            </Link>
            <Typography variant="body2" color="text.primary">
              Service #{id}
            </Typography>
          </Breadcrumbs>
        </Box>
      </Paper>

      {/* Chat Window */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <EnhancedChatWindow
          messages={conversation.messages}
          onSendMessage={handleSendMessage}
          onQuickAction={handleQuickAction}
          isSending={sending}
          serviceRequestId={conversation.service_request_id}
        />
      </Box>
    </Box>
  );
};
