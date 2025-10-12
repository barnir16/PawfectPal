"""
Frontend Tests for Offline Message Service
Tests offline message queuing, persistence, and synchronization
"""
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineMessageService } from '../src/services/chat/offlineMessageService';
import { ChatMessage, ChatMessageCreate } from '../src/types/services/chat';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
});

describe('OfflineMessageService', () => {
  let offlineService: OfflineMessageService;
  let mockChatService: any;

  beforeEach(() => {
    // Clear localStorage
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Mock chat service
    mockChatService = {
      sendMessage: vi.fn(),
      sendMessageWithFiles: vi.fn(),
    };
    
    offlineService = new OfflineMessageService(mockChatService);
  });

  afterEach(() => {
    offlineService.clearOfflineMessages();
  });

  describe('Message Queuing', () => {
    it('should queue messages when offline', () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Hello offline!',
        message_type: 'text',
      };

      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessage(message);

      const queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages).toHaveLength(1);
      expect(queuedMessages[0].message).toBe('Hello offline!');
      expect(queuedMessages[0].status).toBe('pending');
    });

    it('should send messages immediately when online', async () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Hello online!',
        message_type: 'text',
      };

      // Simulate online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      mockChatService.sendMessage.mockResolvedValue({ id: 1, ...message });

      await offlineService.sendMessage(message);

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(message);
      
      const queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages).toHaveLength(0);
    });

    it('should queue file messages when offline', () => {
      const files = [new File(['test'], 'test.txt', { type: 'text/plain' })];
      const message = 'File message';

      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessageWithFiles(message, files, 1);

      const queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages).toHaveLength(1);
      expect(queuedMessages[0].message).toBe(message);
      expect(queuedMessages[0].hasFiles).toBe(true);
      expect(queuedMessages[0].files).toEqual(files);
    });

    it('should send file messages immediately when online', async () => {
      const files = [new File(['test'], 'test.txt', { type: 'text/plain' })];
      const message = 'File message';

      // Simulate online state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      mockChatService.sendMessageWithFiles.mockResolvedValue({ id: 1, message });

      await offlineService.sendMessageWithFiles(message, files, 1);

      expect(mockChatService.sendMessageWithFiles).toHaveBeenCalledWith(message, files, 1);
      
      const queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages).toHaveLength(0);
    });
  });

  describe('Message Persistence', () => {
    it('should persist messages to localStorage', () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Persistent message',
        message_type: 'text',
      };

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessage(message);

      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      const storedData = localStorageMock.setItem.mock.calls[0];
      expect(storedData[0]).toBe('offline_messages');
      expect(JSON.parse(storedData[1])).toHaveLength(1);
    });

    it('should load messages from localStorage on initialization', () => {
      const storedMessages = [
        {
          id: 'offline_1',
          service_request_id: 1,
          message: 'Stored message',
          message_type: 'text',
          status: 'pending',
          timestamp: Date.now(),
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedMessages));

      const newService = new OfflineMessageService(mockChatService);
      const loadedMessages = newService.getOfflineMessages();

      expect(loadedMessages).toHaveLength(1);
      expect(loadedMessages[0].message).toBe('Stored message');
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const newService = new OfflineMessageService(mockChatService);
      const loadedMessages = newService.getOfflineMessages();

      expect(loadedMessages).toHaveLength(0);
    });

    it('should handle empty localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const newService = new OfflineMessageService(mockChatService);
      const loadedMessages = newService.getOfflineMessages();

      expect(loadedMessages).toHaveLength(0);
    });
  });

  describe('Message Synchronization', () => {
    it('should sync queued messages when coming online', async () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Queued message',
        message_type: 'text',
      };

      // Queue message while offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessage(message);
      expect(offlineService.getOfflineMessages()).toHaveLength(1);

      // Mock successful send
      mockChatService.sendMessage.mockResolvedValue({ id: 1, ...message });

      // Simulate coming online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      await offlineService.syncOfflineMessages();

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(message);
      expect(offlineService.getOfflineMessages()).toHaveLength(0);
    });

    it('should handle sync failures gracefully', async () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Failed message',
        message_type: 'text',
      };

      // Queue message
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessage(message);

      // Mock failed send
      mockChatService.sendMessage.mockRejectedValue(new Error('Network error'));

      // Simulate coming online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      await offlineService.syncOfflineMessages();

      // Message should still be queued
      const queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages).toHaveLength(1);
      expect(queuedMessages[0].status).toBe('failed');
    });

    it('should retry failed messages', async () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Retry message',
        message_type: 'text',
      };

      // Queue message
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessage(message);

      // Mock first failure, then success
      mockChatService.sendMessage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 1, ...message });

      // Simulate coming online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // First sync attempt fails
      await offlineService.syncOfflineMessages();
      expect(offlineService.getOfflineMessages()).toHaveLength(1);

      // Retry succeeds
      await offlineService.retryFailedMessages();
      expect(offlineService.getOfflineMessages()).toHaveLength(0);
    });

    it('should sync messages in correct order', async () => {
      const messages = [
        { service_request_id: 1, message: 'First', message_type: 'text' as const },
        { service_request_id: 1, message: 'Second', message_type: 'text' as const },
        { service_request_id: 1, message: 'Third', message_type: 'text' as const },
      ];

      // Queue messages while offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      messages.forEach(msg => offlineService.sendMessage(msg));

      // Mock successful sends
      mockChatService.sendMessage.mockResolvedValue({ id: 1 });

      // Simulate coming online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      await offlineService.syncOfflineMessages();

      // Verify messages were sent in order
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(3);
      expect(mockChatService.sendMessage.mock.calls[0][0].message).toBe('First');
      expect(mockChatService.sendMessage.mock.calls[1][0].message).toBe('Second');
      expect(mockChatService.sendMessage.mock.calls[2][0].message).toBe('Third');
    });
  });

  describe('Message Status Management', () => {
    it('should track message status correctly', () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Status test',
        message_type: 'text',
      };

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessage(message);

      let queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages[0].status).toBe('pending');

      // Mark as failed
      offlineService.markMessageAsFailed(queuedMessages[0].id);
      queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages[0].status).toBe('failed');

      // Mark as sent
      offlineService.markMessageAsSent(queuedMessages[0].id);
      queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages[0].status).toBe('sent');
    });

    it('should remove sent messages after successful sync', async () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Success message',
        message_type: 'text',
      };

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessage(message);

      mockChatService.sendMessage.mockResolvedValue({ id: 1, ...message });

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      await offlineService.syncOfflineMessages();

      expect(offlineService.getOfflineMessages()).toHaveLength(0);
    });
  });

  describe('Network Status Handling', () => {
    it('should listen for online events', () => {
      const syncSpy = vi.spyOn(offlineService, 'syncOfflineMessages');
      
      // Simulate online event
      window.dispatchEvent(new Event('online'));
      
      expect(syncSpy).toHaveBeenCalled();
    });

    it('should handle offline events', () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Offline message',
        message_type: 'text',
      };

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));
      
      offlineService.sendMessage(message);
      
      expect(offlineService.getOfflineMessages()).toHaveLength(1);
    });
  });

  describe('Message Filtering and Management', () => {
    it('should filter messages by service request', () => {
      const messages = [
        { service_request_id: 1, message: 'Message 1', message_type: 'text' as const },
        { service_request_id: 2, message: 'Message 2', message_type: 'text' as const },
        { service_request_id: 1, message: 'Message 3', message_type: 'text' as const },
      ];

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      messages.forEach(msg => offlineService.sendMessage(msg));

      const serviceRequest1Messages = offlineService.getOfflineMessagesForServiceRequest(1);
      expect(serviceRequest1Messages).toHaveLength(2);

      const serviceRequest2Messages = offlineService.getOfflineMessagesForServiceRequest(2);
      expect(serviceRequest2Messages).toHaveLength(1);
    });

    it('should clear messages for specific service request', () => {
      const messages = [
        { service_request_id: 1, message: 'Message 1', message_type: 'text' as const },
        { service_request_id: 2, message: 'Message 2', message_type: 'text' as const },
        { service_request_id: 1, message: 'Message 3', message_type: 'text' as const },
      ];

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      messages.forEach(msg => offlineService.sendMessage(msg));

      offlineService.clearOfflineMessagesForServiceRequest(1);

      const remainingMessages = offlineService.getOfflineMessages();
      expect(remainingMessages).toHaveLength(1);
      expect(remainingMessages[0].service_request_id).toBe(2);
    });

    it('should clear all offline messages', () => {
      const messages = [
        { service_request_id: 1, message: 'Message 1', message_type: 'text' as const },
        { service_request_id: 2, message: 'Message 2', message_type: 'text' as const },
      ];

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      messages.forEach(msg => offlineService.sendMessage(msg));

      offlineService.clearOfflineMessages();

      expect(offlineService.getOfflineMessages()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage quota exceeded', () => {
      const message: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Large message',
        message_type: 'text',
      };

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock localStorage quota exceeded
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw error
      expect(() => offlineService.sendMessage(message)).not.toThrow();
    });

    it('should handle file serialization errors', () => {
      const files = [new File(['test'], 'test.txt', { type: 'text/plain' })];
      const message = 'File message';

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Mock JSON.stringify to fail
      const originalStringify = JSON.stringify;
      JSON.stringify = vi.fn().mockImplementation(() => {
        throw new Error('Serialization error');
      });

      expect(() => offlineService.sendMessageWithFiles(message, files, 1)).not.toThrow();

      // Restore original function
      JSON.stringify = originalStringify;
    });
  });

  describe('Performance and Memory Management', () => {
    it('should limit offline message queue size', () => {
      const maxMessages = 100;
      
      // Create more messages than the limit
      for (let i = 0; i < maxMessages + 10; i++) {
        const message: ChatMessageCreate = {
          service_request_id: 1,
          message: `Message ${i}`,
          message_type: 'text',
        };

        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });

        offlineService.sendMessage(message);
      }

      const queuedMessages = offlineService.getOfflineMessages();
      expect(queuedMessages.length).toBeLessThanOrEqual(maxMessages);
    });

    it('should clean up old messages', () => {
      const oldMessage: ChatMessageCreate = {
        service_request_id: 1,
        message: 'Old message',
        message_type: 'text',
      };

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      offlineService.sendMessage(oldMessage);

      // Manually set old timestamp
      const queuedMessages = offlineService.getOfflineMessages();
      queuedMessages[0].timestamp = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago

      offlineService.cleanupOldMessages();

      expect(offlineService.getOfflineMessages()).toHaveLength(0);
    });
  });
});

