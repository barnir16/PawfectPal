import { apiClient } from '../api';
import type {
  ChatConversation,
  ChatMessage,
  ChatMessageCreate,
} from '../../types/services/chat';

class ChatService {
  /**
   * Get all conversations for the current user
   */
  async getMyConversations(): Promise<ChatConversation[]> {
    try {
      const response = await apiClient.get('/chat/my-conversations');
      return response || [];
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Get conversation for a specific service request
   */
  async getConversation(serviceRequestId: number, limit: number = 50, offset: number = 0): Promise<ChatConversation> {
    try {
      const response = await apiClient.get(`/chat/conversations/${serviceRequestId}?limit=${limit}&offset=${offset}`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch conversation:', error);
      
      // If it's a 404, return empty conversation (new chat)
      if (error?.status === 404) {
        return {
          service_request_id: serviceRequestId,
          messages: [],
          unread_count: 0,
          total_messages: 0,
          has_more: false,
          current_offset: offset,
          limit: limit
        };
      }
      
      // If it's a 403, user doesn't have access
      if (error?.status === 403) {
        throw new Error('You do not have access to this conversation');
      }
      
      throw new Error('Failed to fetch conversation');
    }
  }

  /**
   * Send a message in a service request conversation
   */
  async sendMessage(serviceRequestId: number, message: ChatMessageCreate): Promise<ChatMessage> {
    try {
      const response = await apiClient.post('/chat/messages', message);
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Mark a message as read
   */
  async markMessageRead(messageId: number): Promise<void> {
    try {
      await apiClient.put(`/chat/messages/${messageId}/read`);
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }

  /**
   * Mark a message as delivered
   */
  async markMessageDelivered(messageId: number): Promise<void> {
    try {
      await apiClient.put(`/chat/messages/${messageId}/delivered`);
    } catch (error) {
      console.error('Failed to mark message as delivered:', error);
      throw new Error('Failed to mark message as delivered');
    }
  }

  /**
   * Share location in a service request conversation
   */
  async shareLocation(
    serviceRequestId: number,
    latitude?: number,
    longitude?: number,
    address?: string,
    fallback?: string
  ): Promise<ChatMessage> {
    try {
      // Format the location message to match what the render function expects
      let locationMessage = '📍 Location shared';
      if (latitude && longitude) {
        locationMessage += `\nLat: ${latitude}\nLng: ${longitude}`;
      }
      if (address) {
        locationMessage += `\nAddress: ${address}`;
      }
      
      const messageData: ChatMessageCreate = {
        service_request_id: serviceRequestId,
        message: locationMessage,
        message_type: 'location',
      };
      
      return await this.sendMessage(serviceRequestId, messageData);
    } catch (error) {
      console.error('Failed to share location:', error);
      throw new Error('Failed to share location');
    }
  }

  /**
   * Send a message with file attachments
   */
  async sendMessageWithFiles(
    serviceRequestId: number,
    message: string,
    files: File[],
    messageType: string = "text"
  ): Promise<ChatMessage> {
    try {
      const formData = new FormData();
      formData.append('service_request_id', serviceRequestId.toString());
      formData.append('message', message);
      formData.append('message_type', messageType);
      
      // Add files to FormData
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiClient.post('/chat/messages-with-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error: any) {
      console.error('Failed to send message with files:', error);
      throw new Error('Failed to send message with files');
    }
  }

  /**
   * Load more messages for pagination
   */
  async loadMoreMessages(serviceRequestId: number, currentOffset: number, limit: number = 50): Promise<ChatConversation> {
    try {
      const response = await apiClient.get(`/chat/conversations/${serviceRequestId}?limit=${limit}&offset=${currentOffset}`);
      return response;
    } catch (error: any) {
      console.error('Failed to load more messages:', error);
      throw new Error('Failed to load more messages');
    }
  }
}

export const chatService = new ChatService();
