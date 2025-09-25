// src/features/chat/pages/ChatPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { ChatWindow } from "../../../components/chat/ChatWindow";
import type {
  ChatConversation,
  ChatMessageCreate,
} from "../../../types/services/chat";
import MockChatService from "../../../services/chat/mockChat";

export const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const data = await MockChatService.getConversation(Number(id));
        setConversation(data ?? null);
      } catch (err) {
        console.error("Failed to fetch conversation", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [id]);

  const handleSendMessage = async (msg: ChatMessageCreate) => {
    if (!conversation) return;

    // Send via mock service
    const newMsg = await MockChatService.sendMessage(
      conversation.service_request_id,
      msg
    );

    // Update local state (parent owns messages)
    setConversation({
      ...conversation,
      messages: [...conversation.messages, newMsg],
      unread_count: 0,
    });
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
      <ChatWindow
        conversation={conversation}
        onSendMessage={handleSendMessage}
        currentUserId={0} // set your logged-in user ID here
      />
    </Box>
  );
};
