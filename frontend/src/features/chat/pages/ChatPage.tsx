import { useEffect, useState, useRef } from "react";
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
  Chip,
} from "@mui/material";
import { ArrowBack, Home, Message, Wifi, WifiOff } from "@mui/icons-material";
import { EnhancedChatWindow } from "../../../components/services/EnhancedChatWindow";
import { ServiceRequestInfo } from "../../../components/services/ServiceRequestInfo";
import type {
  ChatConversation,
  ChatMessage,
  ChatMessageCreate,
} from "../../../types/services/chat";
import { chatService } from "../../../services/chat/chatService";
import { webSocketService, WebSocketMessage } from "../../../services/chat/webSocketService";
import { firebaseMessagingService, ChatNotificationData } from "../../../services/notifications/firebaseMessagingService";
import { offlineMessageService, OfflineStatus } from "../../../services/chat/offlineMessageService";
import { ServiceRequestService } from "../../../services/serviceRequests/serviceRequestService";
import { PetService } from "../../../services/pets/petService";
import type { ServiceRequest } from "../../../types/services/serviceRequest";
import type { Pet } from "../../../types/pets/pet";
import { useAuth } from "../../../contexts/AuthContext";
import { useMessageStatusTracker } from "../../../hooks/useMessageStatusTracker";

export const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(offlineMessageService.getOfflineStatus());
  const wsInitialized = useRef(false);

  // Initialize message status tracker
  const messageStatusTracker = useMessageStatusTracker(
    conversation?.messages || [],
    user?.id
  );

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      if (!id || !token || wsInitialized.current) return;
      
      try {
        wsInitialized.current = true;
        console.log('🔌 Initializing WebSocket connection for chat', id);
        
        // Connect to WebSocket
        const connected = await webSocketService.connect(Number(id), token);
        if (connected) {
          console.log('✅ WebSocket connected successfully');
          
          // Set up message handlers
          webSocketService.onMessage('new_message', (data: WebSocketMessage) => {
            console.log('📨 New message received via WebSocket:', data);
            if (data.message) {
              setConversation(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  messages: [...prev.messages, data.message!],
                  unread_count: 0
                };
              });
              
              // Mark message as delivered when received
              if (data.message.id) {
                webSocketService.markMessageAsDelivered(data.message.id);
              }
            }
          });
          
          webSocketService.onMessage('typing', (data: WebSocketMessage) => {
            console.log('⌨️ Typing indicator received:', data);
            if (data.user_id !== user?.id) {
              setOtherUserTyping(data.is_typing || false);
              
              // Auto-hide typing indicator after 3 seconds
              setTimeout(() => {
                setOtherUserTyping(false);
              }, 3000);
            }
          });
          
          webSocketService.onMessage('message_status', (data: WebSocketMessage) => {
            console.log('📊 Message status received:', data);
            // Handle message status updates if needed
          });
          
          webSocketService.onMessage('connection_established', (data: WebSocketMessage) => {
            console.log('✅ WebSocket connection established:', data);
            setIsWebSocketConnected(true);
          });
          
          webSocketService.onMessage('error', (data: WebSocketMessage) => {
            console.error('❌ WebSocket error:', data);
          });
          
          // Connection status handler
          webSocketService.onConnectionChange((connected) => {
            setIsWebSocketConnected(connected);
            console.log('🔌 WebSocket connection status:', connected);
          });
          
        } else {
          console.warn('⚠️ Failed to connect to WebSocket, falling back to REST API only');
        }
      } catch (error) {
        console.error('❌ WebSocket initialization error:', error);
        wsInitialized.current = false;
      }
    };

    initializeWebSocket();
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      webSocketService.disconnect();
      wsInitialized.current = false;
    };
  }, [id, token]);

  // Initialize Firebase Cloud Messaging
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        console.log('🔔 Initializing Firebase Cloud Messaging');
        const initialized = await firebaseMessagingService.initialize();
        
        if (initialized) {
          console.log('✅ FCM initialized successfully');
          
          // Set up notification handler
          firebaseMessagingService.onMessage((payload) => {
            console.log('📨 FCM message received in ChatPage:', payload);
            
            // Handle chat notifications
            if (payload.data?.type === 'new_message' && payload.data?.service_request_id === id) {
              // Refresh conversation if it's for this chat
              if (conversation) {
                // Trigger a refresh of the conversation
                console.log('🔄 Refreshing conversation due to FCM notification');
                // You could implement a refresh mechanism here
              }
            }
          });
        } else {
          console.warn('⚠️ FCM initialization failed, notifications disabled');
        }
      } catch (error) {
        console.error('❌ FCM initialization error:', error);
      }
    };

    initializeFCM();
  }, [id, conversation]);

  // Monitor offline status and sync messages
  useEffect(() => {
    const handleOfflineStatusChange = (status: OfflineStatus) => {
      setOfflineStatus(status);
      
      // If we just came online and have queued messages, sync them
      if (status.isOnline && status.queuedMessages > 0) {
        console.log('🔄 Coming online, syncing queued messages...');
        syncQueuedMessages();
      }
    };

    offlineMessageService.onStatusChange(handleOfflineStatusChange);

    return () => {
      offlineMessageService.offStatusChange(handleOfflineStatusChange);
    };
  }, []);

  // Sync queued messages when coming online
  const syncQueuedMessages = async () => {
    try {
      await offlineMessageService.syncQueuedMessages(async (message: ChatMessageCreate) => {
        // Use the same send message logic as regular messages
        if (isWebSocketConnected && webSocketService.isConnected()) {
          webSocketService.sendMessage(message);
        } else {
          await chatService.sendMessage(conversation!.service_request_id, message);
        }
      });
    } catch (error) {
      console.error('Failed to sync queued messages:', error);
    }
  };

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
        
        // Fetch pets if they're not included in the service request
        if (serviceRequestData.pet_ids && serviceRequestData.pet_ids.length > 0) {
          try {
            const petsData = await Promise.all(
              serviceRequestData.pet_ids.map(petId => PetService.getPet(petId))
            );
            console.log('🔍 ChatPage: Pets fetched', petsData);
            setPets(petsData);
          } catch (petError) {
            console.warn('⚠️ ChatPage: Failed to fetch pets', petError);
            // If service request has pets data, use that as fallback
            if (serviceRequestData.pets) {
              setPets(serviceRequestData.pets);
            }
          }
        } else if (serviceRequestData.pets) {
          // Use pets from service request if available
          setPets(serviceRequestData.pets);
        }
        
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
    
    // Check if we're offline
    if (!offlineStatus.isOnline) {
      console.log('📱 Offline - queuing message for later sending');
      const queuedId = offlineMessageService.queueMessage(msg);
      
      // Optimistically add message to UI with offline indicator
      const optimisticMessage: ChatMessage = {
        ...msg,
        id: Date.now(), // Temporary ID
        sender_id: user?.id || 0,
        is_read: false,
        is_edited: false,
        created_at: new Date().toISOString(),
        message_type: msg.message_type || "text",
        delivery_status: "sent" // Will be updated when actually sent
      };
      
      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, optimisticMessage],
          unread_count: 0
        };
      });
      
      return;
    }
    
    try {
      setSending(true);
      
      // Try WebSocket first if connected
      if (isWebSocketConnected && webSocketService.isConnected()) {
        console.log('📤 Sending message via WebSocket');
        webSocketService.sendMessage(msg);
        
        // Optimistically add message to UI
        const optimisticMessage: ChatMessage = {
          ...msg,
          id: Date.now(), // Temporary ID
          sender_id: user?.id || 0,
          is_read: false,
          is_edited: false,
          created_at: new Date().toISOString(),
          message_type: msg.message_type || "text"
        };
        
        setConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, optimisticMessage],
            unread_count: 0
          };
        });
      } else {
        // Fallback to REST API
        console.log('📤 Sending message via REST API (WebSocket not available)');
        const newMsg: ChatMessage = await chatService.sendMessage(
          conversation.service_request_id,
          msg
        );

        setConversation({
          ...conversation,
          messages: [...conversation.messages, newMsg],
          unread_count: 0,
        });
      }
    } catch (err) {
      console.error("Failed to send message", err);
      
      // If sending failed and we're online, queue the message
      if (offlineStatus.isOnline) {
        console.log('📱 Send failed - queuing message for retry');
        offlineMessageService.queueMessage(msg);
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendMessageWithFiles = async (message: string, files: File[]) => {
    if (!conversation) return;
    try {
      setSending(true);
      
      // File uploads always use REST API for now
      console.log('📤 Sending message with files via REST API');
      const newMsg: ChatMessage = await chatService.sendMessageWithFiles(
        conversation.service_request_id,
        message,
        files,
        "image"
      );

      setConversation({
        ...conversation,
        messages: [...conversation.messages, newMsg],
        unread_count: 0,
      });
    } catch (err) {
      console.error("Failed to send message with files", err);
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = (action: string, data?: any) => {
    console.log("Quick action triggered:", action, data);
    // implement your action handling here
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (isWebSocketConnected && webSocketService.isConnected()) {
      webSocketService.sendTypingIndicator(isTyping);
    }
  };

  const loadMoreMessages = async () => {
    if (!conversation || loadingMore || !conversation.has_more) return;
    
    try {
      setLoadingMore(true);
      const moreMessages = await chatService.loadMoreMessages(
        conversation.service_request_id,
        conversation.current_offset || 0,
        50
      );
      
      setConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...moreMessages.messages, ...prev.messages], // Prepend older messages
          has_more: moreMessages.has_more,
          current_offset: moreMessages.current_offset,
          total_messages: moreMessages.total_messages
        };
      });
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoadingMore(false);
    }
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
              
              {/* Connection Status Indicator */}
              <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                {!offlineStatus.isOnline && (
                  <Chip
                    icon={<WifiOff />}
                    label={`Offline (${offlineStatus.queuedMessages} queued)`}
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                )}
                <Chip
                  icon={isWebSocketConnected ? <Wifi /> : <WifiOff />}
                  label={isWebSocketConnected ? "Connected" : "Disconnected"}
                  color={isWebSocketConnected ? "success" : "error"}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Paper>

      {/* Chat Window */}
      <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Service Request Information */}
        {serviceRequest && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <ServiceRequestInfo
              serviceRequest={serviceRequest}
              pets={pets}
              provider={serviceRequest.assigned_provider}
              compact={true}
            />
          </Box>
        )}
        
        {/* Chat Messages */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>
            <EnhancedChatWindow
              messages={conversation.messages}
              onSendMessage={handleSendMessage}
              onSendMessageWithFiles={handleSendMessageWithFiles}
              onQuickAction={handleQuickAction}
              onTypingChange={handleTypingChange}
              onLoadMore={loadMoreMessages}
              hasMore={conversation.has_more || false}
              loadingMore={loadingMore}
              isSending={sending}
              serviceRequestId={conversation.service_request_id}
              serviceRequest={serviceRequest ? {
                id: serviceRequest.id,
                title: serviceRequest.title,
                service_type: serviceRequest.service_type,
                description: serviceRequest.description,
                status: serviceRequest.status,
                location: serviceRequest.location,
                budget_min: serviceRequest.budget_min,
                budget_max: serviceRequest.budget_max,
                is_urgent: serviceRequest.is_urgent,
                user: serviceRequest.user ? {
                  id: serviceRequest.user.id,
                  username: serviceRequest.user.username,
                  full_name: serviceRequest.user.full_name,
                  is_provider: serviceRequest.user.is_provider,
                } : undefined,
                assigned_provider: serviceRequest.assigned_provider ? {
                  id: serviceRequest.assigned_provider.id,
                  username: serviceRequest.assigned_provider.username,
                  full_name: serviceRequest.assigned_provider.full_name,
                  is_provider: serviceRequest.assigned_provider.is_provider,
                } : undefined,
                pets: serviceRequest.pets?.map(pet => ({
                  id: pet.id,
                  name: pet.name,
                  species: pet.species,
                  breed: pet.breed,
                })),
              } : undefined}
            />
        </Box>
      </Box>
    </Box>
  );
};
