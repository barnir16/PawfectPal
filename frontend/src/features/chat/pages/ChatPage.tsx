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
  Alert,
  Button,
} from "@mui/material";
import { ArrowBack, Home, Message } from "@mui/icons-material";
import { EnhancedChatWindow } from "../../../components/services/EnhancedChatWindow";
import type {
  ChatConversation,
  ChatMessage,
  ChatMessageCreate,
} from "../../../types/services/chat";
import { chatService } from "../../../services/chat/chatService";
import { ServiceRequestService } from "../../../services/serviceRequests/serviceRequestService";
import type { ServiceRequest } from "../../../types/services/serviceRequest";

export const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // First, verify the service request exists
        console.log('🔍 ChatPage: Fetching service request', id);
        const serviceRequestData = await ServiceRequestService.getServiceRequest(Number(id));
        console.log('🔍 ChatPage: Service request fetched', serviceRequestData);
        setServiceRequest(serviceRequestData);
        
        // Then fetch the conversation
        try {
          console.log('🔍 ChatPage: Fetching conversation', id);
          const conversationData = await chatService.getConversation(Number(id));
          console.log('🔍 ChatPage: Conversation fetched', conversationData);
          setConversation(conversationData);
        } catch (conversationError: any) {
          console.warn("Could not fetch conversation, starting with empty chat:", conversationError);
          // Create empty conversation if it doesn't exist
          setConversation({
            service_request_id: Number(id),
            messages: [],
            unread_count: 0
          });
        }
      } catch (err: any) {
        console.error("Failed to fetch chat data:", err);
        setError(err.message || "Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate("/chat-list")}>
          Back to Chats
        </Button>
      </Box>
    );
  }

  if (!serviceRequest || !conversation) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Service request not found or you don't have access to this chat. (Debug: ID {id})
        </Alert>
        <Button onClick={() => navigate("/chat-list")}>
          Back to Chats
        </Button>
      </Box>
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
              {serviceRequest.title || `Service #${id}`}
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
