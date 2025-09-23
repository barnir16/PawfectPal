import type { User } from '../auth';

export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface ChatMessage {
  id: number;
  service_request_id: number;
  sender_id: number;
  message: string;
  message_type: MessageType;
  is_read: boolean;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  
  // Relationships
  sender?: User;
}

export interface ChatMessageCreate {
  service_request_id: number;
  message: string;
  message_type?: MessageType;
}

export interface ChatConversation {
  service_request_id: number;
  messages: ChatMessage[];
  unread_count: number;
}