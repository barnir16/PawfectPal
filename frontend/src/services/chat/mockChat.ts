import type {
  ChatConversation,
  ChatMessage,
  ChatMessageCreate,
  MessageType,
} from "../../types/services/chat";

// Initial mock conversations
const mockConversations: ChatConversation[] = [
  {
    service_request_id: 1,
    messages: [
      {
        id: 101,
        service_request_id: 1,
        sender_id: 2, // someone else
        message: "Hello! This is a mock conversation.",
        message_type: "text" as MessageType,
        is_read: true,
        is_edited: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 102,
        service_request_id: 1,
        sender_id: 1, // 👈 this will be treated as “you”
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
  mockConversations.map((c) => [
    c.service_request_id,
    Math.max(...c.messages.map((m) => m.id)),
  ])
);

const getNextMessageId = (service_request_id: number) => {
  const lastId = lastMessageIds.get(service_request_id) || 0;
  const nextId = lastId + 1;
  lastMessageIds.set(service_request_id, nextId);
  return nextId;
};

const MockChatService = {
  async getMyConversations(): Promise<ChatConversation[]> {
    return Promise.resolve(structuredClone(mockConversations));
  },

  async getConversation(
    service_request_id: number
  ): Promise<ChatConversation | undefined> {
    const conversation = mockConversations.find(
      (c) => c.service_request_id === service_request_id
    );
    return Promise.resolve(conversation ? structuredClone(conversation) : undefined);
  },

  async sendMessage(
    service_request_id: number,
    newMessage: ChatMessageCreate,
    currentUserId: number = 1 // 👈 default mock user id
  ): Promise<ChatMessage> {
    const conversationIndex = mockConversations.findIndex(
      (c) => c.service_request_id === service_request_id
    );
    if (conversationIndex === -1)
      throw new Error(`Conversation ${service_request_id} not found`);

    const conversation = mockConversations[conversationIndex];

    const msg: ChatMessage = {
      ...newMessage,
      id: getNextMessageId(service_request_id),
      sender_id: currentUserId, // 👈 dynamic sender ID
      is_read: false,
      is_edited: false,
      created_at: new Date().toISOString(),
      message_type: newMessage.message_type || "text",
    };

    const updatedConversation: ChatConversation = {
      ...conversation,
      messages: [...conversation.messages, msg],
    };

    // Update in mock data immutably
    mockConversations.splice(conversationIndex, 1, updatedConversation);

    return Promise.resolve(structuredClone(msg));
  },
};

export default MockChatService;
