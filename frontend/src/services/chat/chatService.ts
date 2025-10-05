import { apiClient } from '../api/apiClient';
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
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
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
}

export const chatService = new ChatService();