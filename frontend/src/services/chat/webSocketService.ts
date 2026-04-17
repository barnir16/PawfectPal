/**
 * WebSocket Service for real-time chat
 */
import { ChatMessage, ChatMessageCreate } from '../../types/services/chat';
import { getBaseUrl } from '../api';

export interface WebSocketMessage {
  type: 'new_message' | 'message_sent' | 'typing' | 'message_status' | 'connection_established' | 'error';
  message?: ChatMessage;
  service_request_id?: number;
  user_id?: number;
  is_typing?: boolean;
  message_id?: number;
  status?: string;
  timestamp?: string;
  username?: string;
}

export interface TypingIndicator {
  service_request_id: number;
  user_id: number;
  is_typing: boolean;
  timestamp: string;
}

export interface MessageStatus {
  message_id: number;
  status: 'delivered' | 'read';
  user_id: number;
  timestamp: string;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private isEnabled = true;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket for a specific service request
   */
  async connect(serviceRequestId: number, token: string): Promise<boolean> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return true;
    }

    if (!this.isEnabled) {
      return false;
    }

    this.isConnecting = true;

    try {
      const wsUrl = this.getWebSocketUrl(serviceRequestId, token);
      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          this.startPingInterval();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.stopPingInterval();
          this.notifyConnectionHandlers(false);

          const shouldNotReconnect =
            event.code === 1000 || // normal closure
            event.code === 1008 || // policy / auth / permission
            event.code === 1003 || // unsupported data
            event.code === 1002 || // protocol error
            event.code === 1007;   // invalid payload data

          if (!shouldNotReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(serviceRequestId, token);
          }
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          reject(error);
        };

        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.stopPingInterval();
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
      this.notifyConnectionHandlers(false);
    }
  }

  /**
   * Send a chat message via WebSocket
   */
  sendMessage(message: ChatMessageCreate): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const messageData = {
      type: 'message',
      message: message.message,
      message_type: message.message_type || 'text'
    };

    this.ws.send(JSON.stringify(messageData));
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(isTyping: boolean): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const typingData = {
      type: 'typing',
      is_typing: isTyping
    };

    this.ws.send(JSON.stringify(typingData));
  }

  /**
   * Mark message as delivered
   */
  markMessageAsDelivered(messageId: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const deliveredData = {
      type: 'message_delivered',
      message_id: messageId
    };

    this.ws.send(JSON.stringify(deliveredData));
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const readData = {
      type: 'message_read',
      message_id: messageId
    };

    this.ws.send(JSON.stringify(readData));
  }

  /**
   * Subscribe to message events
   */
  onMessage(type: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Unsubscribe from message events
   */
  offMessage(type: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * Unsubscribe from connection status changes
   */
  offConnectionChange(handler: (connected: boolean) => void): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private getWebSocketUrl(serviceRequestId: number, token: string): string {
    const websocketBaseUrl = getBaseUrl().replace(/^http/, 'ws');
    return `${websocketBaseUrl}/ws/chat/${serviceRequestId}?token=${encodeURIComponent(token)}`;
  }

  private handleMessage(data: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(data.type);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  private scheduleReconnect(serviceRequestId: number, token: string): void {
    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.isEnabled = false;
      this.notifyConnectionHandlers(false);
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(serviceRequestId, token).catch(() => {
        // Connection state is surfaced through handlers.
      });
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        } catch {
          this.stopPingInterval();
        }
      }
    }, 30000);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const webSocketService = WebSocketService.getInstance();
