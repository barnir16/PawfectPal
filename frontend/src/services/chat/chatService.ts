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
      return response.data;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  }

  /**
   * Get conversation for a specific service request
   */
  async getConversation(serviceRequestId: number): Promise<ChatConversation> {
    try {
      const response = await apiClient.get(`/chat/conversations/${serviceRequestId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch conversation:', error);
      
      // If it's a 404, return empty conversation (new chat)
      if (error?.status === 404) {
        return {
          service_request_id: serviceRequestId,
          messages: [],
          unread_count: 0
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
      return response.data;
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
      const messageData: ChatMessageCreate = {
        service_request_id: serviceRequestId,
        message: address || fallback || 'Location shared',
        message_type: 'location',
        message_metadata: {
          latitude,
          longitude,
          address,
          fallback
        }
      };
      
      return await this.sendMessage(serviceRequestId, messageData);
    } catch (error) {
      console.error('Failed to share location:', error);
      throw new Error('Failed to share location');
    }
  }

  /**
   * Send service update message
   */
  async sendServiceUpdate(
    serviceRequestId: number,
    status?: string,
    message?: string
  ): Promise<ChatMessage> {
    try {
      const messageData: ChatMessageCreate = {
        service_request_id: serviceRequestId,
        message: message || `Service status updated to: ${status}`,
        message_type: 'system',
        message_metadata: {
          status,
          type: 'service_update'
        }
      };
      
      return await this.sendMessage(serviceRequestId, messageData);
    } catch (error) {
      console.error('Failed to send service update:', error);
      throw new Error('Failed to send service update');
    }
  }
}

export const chatService = new ChatService();