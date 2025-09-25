import type { ChatConversation, ChatMessage, ChatMessageCreate, MessageType } from "../../types/services/chat";

// Initial mock conversations
const mockConversations: ChatConversation[] = [
  {
    service_request_id: 1,
    messages: [
      {
        id: 101,
        service_request_id: 1,
        sender_id: 2,
        message: "Hello! This is a mock conversation.",
        message_type: "text" as MessageType,
        is_read: true,
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 102,
        service_request_id: 1,
        sender_id: 0,
        message: "Hi there! Replying from the mock user.",
        message_type: "text" as MessageType,
        is_read: true,
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      },
    ],
    unread_count: 0,
  },
  {
    service_request_id: 2,
    messages: [
      {
        id: 201,
        service_request_id: 2,
        sender_id: 3,
        message: "Do you still need help with your request?",
        message_type: "text" as MessageType,
        is_read: false,
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ],
    unread_count: 1,
  },
];

// Map to track last message ID per conversation
const lastMessageIds = new Map<number, number>(
  mockConversations.map((c) => [c.service_request_id, Math.max(...c.messages.map((m) => m.id))])
);

const getNextMessageId = (service_request_id: number) => {
  const lastId = lastMessageIds.get(service_request_id) || 0;
  const nextId = lastId + 1;
  lastMessageIds.set(service_request_id, nextId);
  return nextId;
};

const MockChatService = {
  async getMyConversations(): Promise<ChatConversation[]> {
    return Promise.resolve(mockConversations);
  },

  async getConversation(service_request_id: number): Promise<ChatConversation | undefined> {
    return Promise.resolve(
      mockConversations.find((c) => c.service_request_id === service_request_id)
    );
  },

async sendMessage(service_request_id: number, newMessage: ChatMessageCreate): Promise<ChatMessage> {
  const conversation = mockConversations.find(
    (c) => c.service_request_id === service_request_id
  );
  if (!conversation) throw new Error("Conversation not found");

  const msg: ChatMessage = {
    ...newMessage,
    id: getNextMessageId(service_request_id),
    sender_id: 0,
    is_read: false,
    is_edited: false,
    created_at: new Date().toISOString(),
    message_type: newMessage.message_type || "text",
  };

  // Return a **new array** instead of mutating
  const updatedMessages = [...conversation.messages, msg];
  // Update mockConversations immutably
  mockConversations.splice(
    mockConversations.findIndex(c => c.service_request_id === service_request_id),
    1,
    { ...conversation, messages: updatedMessages }
  );

  return Promise.resolve(msg);
}

};

export default MockChatService;
