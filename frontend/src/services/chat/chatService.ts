import { apiClient } from '../api';
import type { ChatMessage, ChatMessageCreate, ChatConversation } from '../../types/services/chat';

export class ChatService {
  /**
   * Send a message in a service request conversation
   */
  static async sendMessage(message: ChatMessageCreate): Promise<ChatMessage> {
    const response = await apiClient.post('/chat/messages', message);
    return response.data;
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