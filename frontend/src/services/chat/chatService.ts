import { apiClient } from '../api';
import { StorageHelper } from '../../utils/StorageHelper';
import type { ChatMessage, ChatMessageCreate, ChatConversation } from '../../types/services/chat';

export class ChatService {
  /**
   * Send a message in a service request conversation
   */
  static async sendMessage(message: ChatMessageCreate): Promise<ChatMessage> {
    console.log('📤 sendMessage called with:', {
      hasAttachments: !!(message.attachments && message.attachments.length > 0),
      attachmentCount: message.attachments?.length || 0,
      messageType: message.message_type,
      messageText: message.message
    });
    
    // Handle file uploads if present
    if (message.attachments && message.attachments.length > 0) {
      console.log('📤 Calling sendMessageWithAttachments');
      return this.sendMessageWithAttachments(message);
    }

    const response = await apiClient.post('/chat/messages', message);
    console.log('Chat service response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response || {}));
    
    // Check if response is undefined or null
    if (response === undefined || response === null) {
      console.warn('Backend returned undefined/null response');
    }
    
    return response;
  }

  /**
   * Send a message with file attachments
   */
  static async sendMessageWithAttachments(message: ChatMessageCreate): Promise<ChatMessage> {
    console.log('📤 sendMessageWithAttachments called with:', {
      attachments: message.attachments,
      attachmentCount: message.attachments?.length || 0,
      messageType: message.message_type
    });
    
    if (message.attachments && message.attachments.length > 0) {
      // Upload attachments first
      const uploadedAttachments = await Promise.all(
        message.attachments.map(async (attachment) => {
          console.log('📤 Uploading attachment:', {
            fileName: attachment.file.name,
            fileSize: attachment.file.size,
            fileType: attachment.file.type
          });
          
          const formData = new FormData();
          formData.append('file', attachment.file, attachment.file.name);
          
          // Debug FormData contents
          console.log('📤 FormData entries:');
          for (const [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value);
          }
          
          // Debug the file object itself
          console.log('📤 File object details:', {
            name: attachment.file.name,
            size: attachment.file.size,
            type: attachment.file.type,
            lastModified: attachment.file.lastModified
          });
          
          // Test with simple endpoint first using native fetch
          console.log('🧪 Testing with test-upload endpoint first...');
          try {
            const token = await StorageHelper.getItem('authToken');
            const testResponse = await fetch('https://pawfectpal-production.up.railway.app/image_upload/test-upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData
            });
            
            if (testResponse.ok) {
              const testData = await testResponse.json();
              console.log('🧪 Test upload successful:', testData);
            } else {
              const errorText = await testResponse.text();
              console.error('🧪 Test upload failed:', testResponse.status, errorText);
            }
          } catch (testError) {
            console.error('🧪 Test upload failed:', testError);
          }
          
          // Use native fetch since API client has issues with FormData
          const token = await StorageHelper.getItem('authToken');
          const uploadResponse = await fetch('https://pawfectpal-production.up.railway.app/image_upload/chat-attachment', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          });
          
          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
          }
          
          const uploadData = await uploadResponse.json();
          console.log('📤 Upload response data:', uploadData);
          
          return {
            id: uploadData.id,
            file_name: uploadData.file_name,
            file_url: uploadData.file_url,
            file_type: uploadData.file_type,
            file_size: uploadData.file_size,
            created_at: new Date().toISOString(),
          };
        })
      );
      
      // Send message with uploaded attachments
      const messagePayload = {
        service_request_id: message.service_request_id,
        message: message.message,
        message_type: message.message_type || 'image',
        metadata: message.metadata,
        attachments: uploadedAttachments,
      };
      console.log('📤 Sending message with attachments:', messagePayload);
      
      const response = await apiClient.post('/chat/messages', messagePayload);
      console.log('📤 Message sent response:', response);
      return response;
    } else {
      // Send regular message
      const response = await apiClient.post('/chat/messages', {
        service_request_id: message.service_request_id,
        message: message.message,
        message_type: message.message_type || 'text',
        metadata: message.metadata,
      });
      return response;
    }
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
    return response;
  }

  /**
   * Get all conversations for the current user
   */
  static async getMyConversations(): Promise<ChatConversation[]> {
    const response = await apiClient.get('/chat/my-conversations');
    return response;
  }

  /**
   * Mark a message as read
   */
  static async markMessageRead(messageId: number): Promise<void> {
    await apiClient.put(`/chat/messages/${messageId}/read`);
  }
}