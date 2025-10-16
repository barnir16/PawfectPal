import type { User } from '../auth';

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'location' | 'service_update';

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
  
  // Delivery status tracking
  delivery_status: 'sent' | 'delivered' | 'read';
  delivered_at?: string;
  read_at?: string;
  
  // Message metadata (includes attachments and threading)
  message_metadata?: {
    attachments?: MediaAttachment[];
    original_message?: string;
    reply_to?: {
      message_id: number;
      sender_name: string;
      message_preview: string;
      message_type: MessageType;
    };
    reactions?: MessageReaction[];
    thread_id?: string;
  };
  
  // Media attachments (for backward compatibility)
  attachments?: MediaAttachment[];
  
  // Relationships
  sender?: User;
}

export interface MediaAttachment {
  id: string;  // Changed from number to string to match backend UUID
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  thumbnail_url?: string;
  created_at: string;
}

export interface ServiceMessageMetadata {
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  service_status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  pet_id?: number;
  meeting_time?: string;
  instructions?: string;
  attachments?: MediaAttachment[];
}

export interface ChatMessageCreate {
  service_request_id: number;
  message: string;
  message_type?: MessageType;
  attachments?: ChatAttachmentCreate[];
  reply_to?: ReplyToMessage;
}

export interface ChatAttachmentCreate {
  file: File;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: number;
  user_name: string;
  created_at: string;
}

export interface ReplyToMessage {
  message_id: number;
  sender_name: string;
  message_preview: string;
  message_type: MessageType;
}

export interface ChatConversation {
  service_request_id: number;
  messages: ChatMessage[];
  unread_count: number;
  
  // Pagination info
  total_messages?: number;
  has_more?: boolean;
  current_offset?: number;
  limit?: number;
}