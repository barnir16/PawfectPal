import { useEffect, useRef, useState } from "react";
import { Box, Typography, TextField, IconButton, Paper } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import type {
  ChatConversation,
  ChatMessageCreate,
} from "../../types/services/chat";
import { useLocalization } from "../../contexts/LocalizationContext";

interface ChatWindowProps {
  conversation: ChatConversation;
  onSendMessage?: (msg: ChatMessageCreate) => Promise<void>;
  currentUserId?: number; // for styling "my messages"
}

export const ChatWindow = ({
  conversation,
  onSendMessage,
  currentUserId = 0,
}: ChatWindowProps) => {
  const { t } = useLocalization();
  const [input, setInput] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSend = async () => {
    if (!input.trim() || !onSendMessage) return;

    const newMessage: ChatMessageCreate = {
      service_request_id: conversation.service_request_id,
      message: input.trim(),
      message_type: "text",
    };

    await onSendMessage(newMessage);
    setInput("");
    scrollToBottom();
  };

  return (
    <Paper sx={{ display: "flex", flexDirection: "column", height: "80%" }}>
      {/* Messages */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {conversation.messages.map((msg) => (
          <Box
            key={msg.id} // now guaranteed unique from MockChatService
            sx={{
              mb: 1,
              display: "flex",
              justifyContent:
                msg.sender_id === currentUserId ? "flex-end" : "flex-start",
            }}
          >
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor:
                  msg.sender_id === currentUserId ? "primary.main" : "grey.300",
                color: msg.sender_id === currentUserId ? "white" : "black",
                maxWidth: "70%",
              }}
            >
              <Typography variant="body2">{msg.message}</Typography>
              <Typography
                variant="caption"
                sx={{ display: "block", textAlign: "right" }}
              >
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Input */}
      <Box sx={{ display: "flex", p: 1, borderTop: 1, borderColor: "divider" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t("services.messagePlaceholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <IconButton color="primary" onClick={handleSend}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};
