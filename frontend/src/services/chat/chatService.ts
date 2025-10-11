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
      console.log('🔍 ChatService: Fetching my conversations...');
      const response = await apiClient.get('/chat/my-conversations');
      console.log('🔍 ChatService: Raw response:', response);
      console.log('🔍 ChatService: Response data:', response);
      console.log('🔍 ChatService: Data type:', typeof response);
      console.log('🔍 ChatService: Data length:', Array.isArray(response) ? response.length : 'not array');
      return response || [];
    } catch (error) {
      console.error('❌ ChatService: Failed to fetch conversations:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * Get conversation for a specific service request
   */
  async getConversation(serviceRequestId: number, limit: number = 50, offset: number = 0): Promise<ChatConversation> {
    try {
      console.log(`🔍 ChatService: Fetching conversation for service request ${serviceRequestId} with limit=${limit}, offset=${offset}`);
      const response = await apiClient.get(`/chat/conversations/${serviceRequestId}?limit=${limit}&offset=${offset}`);
      console.log(`🔍 ChatService: Conversation fetched successfully`, response);
      return response;
    } catch (error: any) {
      console.error('❌ ChatService: Failed to fetch conversation:', error);
      console.error('❌ ChatService: Error status:', error?.status);
      console.error('❌ ChatService: Error response:', error?.response?.data);
      
      // If it's a 404, return empty conversation (new chat)
      if (error?.status === 404) {
        console.log('🔍 ChatService: 404 - returning empty conversation');
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
        console.log('❌ ChatService: 403 - Access denied');
        throw new Error('You do not have access to this conversation');
      }
      
      console.log('❌ ChatService: Unknown error, throwing generic error');
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

      console.log('📤 Sending message with files:', {
        serviceRequestId,
        message,
        messageType,
        fileCount: files.length,
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      const response = await apiClient.post('/chat/messages-with-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('📤 Message with files sent successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Failed to send message with files:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      throw new Error('Failed to send message with files');
    }
  }

  /**
   * Load more messages for pagination
   */
  async loadMoreMessages(serviceRequestId: number, currentOffset: number, limit: number = 50): Promise<ChatConversation> {
    try {
      console.log(`🔍 ChatService: Loading more messages for service request ${serviceRequestId}, offset=${currentOffset}`);
      const response = await apiClient.get(`/chat/conversations/${serviceRequestId}?limit=${limit}&offset=${currentOffset}`);
      console.log(`🔍 ChatService: More messages loaded successfully`, response);
      return response;
    } catch (error: any) {
      console.error('❌ ChatService: Failed to load more messages:', error);
      throw new Error('Failed to load more messages');
    }
  }
}

export const chatService = new ChatService();