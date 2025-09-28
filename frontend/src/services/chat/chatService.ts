import { apiClient } from '../api';
import type { ChatMessage, ChatMessageCreate, ChatConversation } from '../../types/services/chat';

export class ChatService {
  /**
   * Send a message in a service request conversation
   */
  static async sendMessage(message: ChatMessageCreate): Promise<ChatMessage> {
    // Handle file uploads if present
    if (message.attachments && message.attachments.length > 0) {
      return this.sendMessageWithAttachments(message);
    }

    const response = await apiClient.post('/chat/messages', message);
    return response.data;
  }

  /**
   * Send a message with file attachments
   */
  static async sendMessageWithAttachments(message: ChatMessageCreate): Promise<ChatMessage> {
    const formData = new FormData();
    
    // Add message data
    formData.append('service_request_id', message.service_request_id.toString());
    formData.append('message', message.message);
    formData.append('message_type', message.message_type || 'text');
    
    // Add metadata if present
    if (message.metadata) {
      formData.append('metadata', JSON.stringify(message.metadata));
    }
    
    // Add file attachments
    if (message.attachments) {
      message.attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    const response = await apiClient.post('/chat/messages/with-attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Share location in a conversation
   */
  static async shareLocation(
    serviceRequestId: number,
    latitude?: number,
    longitude?: number,
    address?: string,
    fallback?: boolean
  ): Promise<ChatMessage> {
    let messageText: string;
    let metadata: any = {};

    if (fallback || (!latitude && !longitude)) {
      // Web fallback - just share the address
      messageText = `📍 Location shared: ${address || 'Service location'}`;
      metadata = {
        location: {
          address: address || 'Service location',
          fallback: true,
        },
      };
    } else {
      // Full location with coordinates
      messageText = `📍 Location shared: ${address || 'Current location'}`;
      metadata = {
        location: {
          latitude,
          longitude,
          address,
        },
      };
    }

    const message: ChatMessageCreate = {
      service_request_id: serviceRequestId,
      message: messageText,
      message_type: 'location',
      metadata,
    };

    return this.sendMessage(message);
  }

  /**
   * Send service status update
   */
  static async sendServiceUpdate(
    serviceRequestId: number,
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    message?: string
  ): Promise<ChatMessage> {
    const statusMessages = {
      pending: 'Service request is pending confirmation',
      confirmed: 'Service has been confirmed!',
      in_progress: 'Service is now in progress',
      completed: 'Service has been completed successfully',
      cancelled: 'Service has been cancelled',
    };

    const updateMessage: ChatMessageCreate = {
      service_request_id: serviceRequestId,
      message: message || statusMessages[status],
      message_type: 'service_update',
      metadata: {
        service_status: status,
      },
    };

    return this.sendMessage(updateMessage);
  }

  /**
   * Get conversation for a service request
   */
  static async getConversation(serviceRequestId: number): Promise<ChatConversation> {
    const response = await apiClient.get(`/chat/conversations/${serviceRequestId}`);
    return response.data;
  }

  /**
   * Get all conversations for the current user
   */
  static async getMyConversations(): Promise<ChatConversation[]> {
    const response = await apiClient.get('/chat/my-conversations');
    return response.data;
  }

  /**
   * Mark a message as read
   */
  static async markMessageRead(messageId: number): Promise<void> {
    await apiClient.put(`/chat/messages/${messageId}/read`);
  }
}