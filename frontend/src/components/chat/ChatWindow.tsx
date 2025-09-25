import { useEffect, useRef, useState } from "react";
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
} from "@mui/material";
import {
  Send,
  AttachFile,
  Image,
  Phone,
  VideoCall,
  MoreVert,
} from "@mui/icons-material";
import type {
  ChatConversation,
  ChatMessageCreate,
} from "../../types/services/chat";
import { useLocalization } from "../../contexts/LocalizationContext";
import { useAuth } from "../../contexts/AuthContext";

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
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

    setIsSending(true);
    const newMessage: ChatMessageCreate = {
      service_request_id: conversation.service_request_id,
      message: input.trim(),
      message_type: "text",
    };

    try {
      await onSendMessage(newMessage);
      setInput("");
      scrollToBottom();
    } finally {
      setIsSending(false);
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

    if (diffInHours < 24) {
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

  return (
    <Paper sx={{ display: "flex", flexDirection: "column", height: "85%" }}>
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar sx={{ mr: 2 }}>
            {conversation.messages[0]?.sender?.full_name?.[0] || "U"}
          </Avatar>
          <Box>
            <Typography variant="subtitle1">
              {conversation.messages[0]?.sender?.full_name ||
                t("chat.unknownUser")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("chat.serviceRequest")} #{conversation.service_request_id}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {conversation.unread_count > 0 && (
            <Chip
              label={conversation.unread_count}
              color="primary"
              size="small"
            />
          )}
          <IconButton size="small">
            <Phone />
          </IconButton>
          <IconButton size="small">
            <VideoCall />
          </IconButton>
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {conversation.messages.length === 0 ? (
          <Typography
            sx={{ textAlign: "center", mt: 2, color: "text.secondary" }}
          >
            {t("chat.noMessagesYet")}
          </Typography>
        ) : (
          <List>
            {conversation.messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              const isSystem = msg.message_type === "system";

              return (
                <ListItem
                  key={msg.id}
                  sx={{
                    flexDirection: isOwn ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    py: 1,
                  }}
                >
                  {!isOwn && !isSystem && (
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {msg.sender?.full_name?.[0] || "U"}
                      </Avatar>
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    sx={{
                      maxWidth: "70%",
                      ml: isOwn ? 0 : 1,
                      mr: isOwn ? 1 : 0,
                    }}
                    primary={
                      <Paper
                        sx={{
                          p: 1.5,
                          backgroundColor: isOwn
                            ? "primary.main"
                            : isSystem
                              ? "grey.100"
                              : "grey.200",
                          color: isOwn
                            ? "primary.contrastText"
                            : "text.primary",
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2">{msg.message}</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.5,
                            textAlign: isOwn ? "right" : "left",
                            opacity: 0.7,
                          }}
                        >
                          {formatMessageTime(msg.created_at)}
                          {msg.is_edited && " (edited)"}
                        </Typography>
                      </Paper>
                    }
                  />
                </ListItem>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Input */}
      <Paper sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          <IconButton size="small">
            <AttachFile />
          </IconButton>
          <IconButton size="small">
            <Image />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("services.messagePlaceholder")}
            disabled={isSending}
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
          >
            {isSending ? <CircularProgress size={20} /> : <Send />}
          </IconButton>
        </Box>
      </Paper>
    </Paper>
  );
};
