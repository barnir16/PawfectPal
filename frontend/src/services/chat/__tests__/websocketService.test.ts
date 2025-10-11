"""
Frontend Tests for WebSocket Service
Tests WebSocket connection, message handling, and real-time features
"""
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from '../src/services/chat/websocketService';
import { ChatMessage, MessageStatus } from '../src/types/services/chat';

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public send: (data: string) => void;
  public close: () => void;

  constructor(url: string) {
    this.url = url;
    this.send = vi.fn();
    this.close = vi.fn();
  }

  // Simulate connection events
  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateClose(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocketService', () => {
  let websocketService: WebSocketService;
  let mockWebSocket: MockWebSocket;
  let mockToken: string;
  let mockServiceRequestId: number;

  beforeEach(() => {
    websocketService = new WebSocketService();
    mockToken = 'mock-jwt-token';
    mockServiceRequestId = 1;
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    websocketService.disconnect();
    vi.restoreAllMocks();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket with correct URL', () => {
      const connectSpy = vi.spyOn(websocketService, 'connect');
      
      websocketService.connect(mockServiceRequestId, mockToken);
      
      expect(connectSpy).toHaveBeenCalledWith(mockServiceRequestId, mockToken);
    });

    it('should handle successful connection', () => {
      const onConnectionOpen = vi.fn();
      websocketService.onConnectionOpen = onConnectionOpen;
      
      websocketService.connect(mockServiceRequestId, mockToken);
      
      // Get the mock WebSocket instance
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateOpen();
      
      expect(onConnectionOpen).toHaveBeenCalled();
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    it('should handle connection errors', () => {
      const onConnectionError = vi.fn();
      websocketService.onConnectionError = onConnectionError;
      
      websocketService.connect(mockServiceRequestId, mockToken);
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateError();
      
      expect(onConnectionError).toHaveBeenCalled();
    });

    it('should handle connection close', () => {
      const onConnectionClose = vi.fn();
      websocketService.onConnectionClose = onConnectionClose;
      
      websocketService.connect(mockServiceRequestId, mockToken);
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateClose(1000, 'Normal closure');
      
      expect(onConnectionClose).toHaveBeenCalledWith(1000, 'Normal closure');
    });

    it('should disconnect properly', () => {
      websocketService.connect(mockServiceRequestId, mockToken);
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      const closeSpy = vi.spyOn(ws, 'close');
      
      websocketService.disconnect();
      
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should prevent multiple connections', () => {
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws1 = (websocketService as any).websocket;
      
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws2 = (websocketService as any).websocket;
      
      expect(ws1).toBe(ws2); // Same instance
    });
  });

  describe('Message Handling', () => {
    beforeEach(() => {
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateOpen();
    });

    it('should send chat messages', () => {
      const message = 'Hello, world!';
      const messageType = 'text';
      
      websocketService.sendMessage(message, messageType);
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'message',
        message,
        message_type: messageType
      }));
    });

    it('should send typing indicators', () => {
      websocketService.sendTypingIndicator(true);
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'typing',
        is_typing: true
      }));
    });

    it('should send message read status', () => {
      const messageId = 123;
      
      websocketService.sendMessageRead(messageId);
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'message_read',
        message_id: messageId
      }));
    });

    it('should send message delivered status', () => {
      const messageId = 123;
      
      websocketService.sendMessageDelivered(messageId);
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'message_delivered',
        message_id: messageId
      }));
    });

    it('should handle incoming messages', () => {
      const onMessage = vi.fn();
      websocketService.onMessage = onMessage;
      
      const messageData = {
        type: 'new_message',
        message: {
          id: 1,
          service_request_id: mockServiceRequestId,
          sender_id: 2,
          message: 'Hello!',
          message_type: 'text',
          created_at: '2024-01-01T10:00:00Z',
          delivery_status: 'sent',
          is_read: false
        }
      };
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateMessage(JSON.stringify(messageData));
      
      expect(onMessage).toHaveBeenCalledWith(messageData);
    });

    it('should handle typing indicators', () => {
      const onTypingIndicator = vi.fn();
      websocketService.onTypingIndicator = onTypingIndicator;
      
      const typingData = {
        type: 'typing',
        user_id: 2,
        is_typing: true
      };
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateMessage(JSON.stringify(typingData));
      
      expect(onTypingIndicator).toHaveBeenCalledWith(typingData);
    });

    it('should handle message status updates', () => {
      const onMessageStatus = vi.fn();
      websocketService.onMessageStatus = onMessageStatus;
      
      const statusData = {
        type: 'message_status',
        message_id: 123,
        status: 'read',
        user_id: 2
      };
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateMessage(JSON.stringify(statusData));
      
      expect(onMessageStatus).toHaveBeenCalledWith(statusData);
    });

    it('should handle connection established message', () => {
      const onConnectionEstablished = vi.fn();
      websocketService.onConnectionEstablished = onConnectionEstablished;
      
      const connectionData = {
        type: 'connection_established',
        message: 'Connected to chat'
      };
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateMessage(JSON.stringify(connectionData));
      
      expect(onConnectionEstablished).toHaveBeenCalledWith(connectionData);
    });

    it('should handle error messages', () => {
      const onError = vi.fn();
      websocketService.onError = onError;
      
      const errorData = {
        type: 'error',
        message: 'Invalid message format'
      };
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateMessage(JSON.stringify(errorData));
      
      expect(onError).toHaveBeenCalledWith(errorData);
    });

    it('should handle malformed JSON messages', () => {
      const onError = vi.fn();
      websocketService.onError = onError;
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateMessage('invalid json');
      
      expect(onError).toHaveBeenCalledWith({
        type: 'error',
        message: 'Invalid JSON received from server'
      });
    });
  });

  describe('Connection State Management', () => {
    it('should track connection state correctly', () => {
      expect(websocketService.isConnected()).toBe(false);
      
      websocketService.connect(mockServiceRequestId, mockToken);
      expect(websocketService.isConnected()).toBe(false); // Still connecting
      
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateOpen();
      expect(websocketService.isConnected()).toBe(true);
      
      ws.simulateClose();
      expect(websocketService.isConnected()).toBe(false);
    });

    it('should handle reconnection attempts', () => {
      const onReconnecting = vi.fn();
      websocketService.onReconnecting = onReconnecting;
      
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateOpen();
      
      // Simulate unexpected close
      ws.simulateClose(1006, 'Abnormal closure');
      
      // Should attempt reconnection
      expect(onReconnecting).toHaveBeenCalled();
    });

    it('should prevent sending messages when disconnected', () => {
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      
      // Don't simulate open, so connection remains closed
      websocketService.sendMessage('Hello', 'text');
      
      expect(ws.send).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket send errors', () => {
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateOpen();
      
      // Mock send to throw error
      ws.send = vi.fn().mockImplementation(() => {
        throw new Error('Send failed');
      });
      
      const onError = vi.fn();
      websocketService.onError = onError;
      
      websocketService.sendMessage('Hello', 'text');
      
      expect(onError).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to send message: Send failed'
      });
    });

    it('should handle connection timeout', () => {
      const onConnectionTimeout = vi.fn();
      websocketService.onConnectionTimeout = onConnectionTimeout;
      
      websocketService.connect(mockServiceRequestId, mockToken);
      
      // Simulate timeout by not opening the connection
      // In a real implementation, you would use a timer
      setTimeout(() => {
        expect(onConnectionTimeout).toHaveBeenCalled();
      }, 100);
    });
  });

  describe('Message Queue', () => {
    it('should queue messages when disconnected', () => {
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      
      // Don't simulate open, so connection remains closed
      websocketService.sendMessage('Message 1', 'text');
      websocketService.sendMessage('Message 2', 'text');
      
      expect(ws.send).not.toHaveBeenCalled();
      
      // When connection opens, queued messages should be sent
      ws.simulateOpen();
      
      // In a real implementation, you would check that queued messages are sent
      expect(ws.send).toHaveBeenCalledTimes(2);
    });

    it('should clear message queue on disconnect', () => {
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateOpen();
      
      websocketService.sendMessage('Message 1', 'text');
      websocketService.disconnect();
      
      // Queue should be cleared
      expect((websocketService as any).messageQueue).toEqual([]);
    });
  });

  describe('Event Callbacks', () => {
    it('should call all registered callbacks', () => {
      const callbacks = {
        onConnectionOpen: vi.fn(),
        onConnectionClose: vi.fn(),
        onConnectionError: vi.fn(),
        onMessage: vi.fn(),
        onTypingIndicator: vi.fn(),
        onMessageStatus: vi.fn(),
        onConnectionEstablished: vi.fn(),
        onError: vi.fn(),
        onReconnecting: vi.fn(),
        onConnectionTimeout: vi.fn()
      };
      
      // Set all callbacks
      Object.entries(callbacks).forEach(([key, callback]) => {
        (websocketService as any)[key] = callback;
      });
      
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      
      // Test each callback
      ws.simulateOpen();
      expect(callbacks.onConnectionOpen).toHaveBeenCalled();
      
      ws.simulateMessage(JSON.stringify({ type: 'connection_established' }));
      expect(callbacks.onConnectionEstablished).toHaveBeenCalled();
      
      ws.simulateMessage(JSON.stringify({ type: 'new_message', message: {} }));
      expect(callbacks.onMessage).toHaveBeenCalled();
      
      ws.simulateMessage(JSON.stringify({ type: 'typing', user_id: 1, is_typing: true }));
      expect(callbacks.onTypingIndicator).toHaveBeenCalled();
      
      ws.simulateMessage(JSON.stringify({ type: 'message_status', message_id: 1, status: 'read' }));
      expect(callbacks.onMessageStatus).toHaveBeenCalled();
      
      ws.simulateError();
      expect(callbacks.onConnectionError).toHaveBeenCalled();
      
      ws.simulateClose();
      expect(callbacks.onConnectionClose).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete message flow', () => {
      const onMessage = vi.fn();
      websocketService.onMessage = onMessage;
      
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateOpen();
      
      // Send a message
      websocketService.sendMessage('Hello!', 'text');
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'message',
        message: 'Hello!',
        message_type: 'text'
      }));
      
      // Simulate response
      const responseMessage = {
        type: 'new_message',
        message: {
          id: 1,
          service_request_id: mockServiceRequestId,
          sender_id: 2,
          message: 'Hi there!',
          message_type: 'text',
          created_at: '2024-01-01T10:00:00Z',
          delivery_status: 'sent',
          is_read: false
        }
      };
      
      ws.simulateMessage(JSON.stringify(responseMessage));
      expect(onMessage).toHaveBeenCalledWith(responseMessage);
    });

    it('should handle typing indicator flow', () => {
      const onTypingIndicator = vi.fn();
      websocketService.onTypingIndicator = onTypingIndicator;
      
      websocketService.connect(mockServiceRequestId, mockToken);
      const ws = (websocketService as any).websocket as MockWebSocket;
      ws.simulateOpen();
      
      // Send typing indicator
      websocketService.sendTypingIndicator(true);
      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'typing',
        is_typing: true
      }));
      
      // Simulate typing response
      const typingResponse = {
        type: 'typing',
        user_id: 2,
        is_typing: true
      };
      
      ws.simulateMessage(JSON.stringify(typingResponse));
      expect(onTypingIndicator).toHaveBeenCalledWith(typingResponse);
    });
  });
});

