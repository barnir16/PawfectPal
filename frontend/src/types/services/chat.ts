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
  
  // Message metadata (includes attachments)
  message_metadata?: {
    attachments?: MediaAttachment[];
    original_message?: string;
  };
  
  // Media attachments (for backward compatibility)
  attachments?: MediaAttachment[];
  
  // Relationships
  sender?: User;
}

export interface MediaAttachment {
  id: number;
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
}

export interface ChatAttachmentCreate {
  file: File;
}

export interface ChatConversation {
  service_request_id: number;
  messages: ChatMessage[];
  unread_count: number;
}