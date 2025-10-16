/**
 * WebSocket Service for Real-time Chat
 * Handles WebSocket connections and real-time messaging
 */
import { ChatMessage, ChatMessageCreate } from '../types/services/chat';

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
  private isEnabled = true; // Add missing isEnabled property
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

    this.isConnecting = true;

    try {
      const wsUrl = this.getWebSocketUrl(serviceRequestId, token);
      console.log('🔌 Connecting to WebSocket:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          
          // Start ping interval to keep connection alive
          this.startPingInterval();
          
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPingInterval(); // Stop ping interval on close
          this.notifyConnectionHandlers(false);
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(serviceRequestId, token);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        // Set timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ WebSocket connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      console.log('🔌 Disconnecting WebSocket');
      
      // Stop ping interval
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
      console.warn('⚠️ WebSocket not connected, cannot send message');
      return;
    }

    const messageData = {
      type: 'message',
      message: message.message,
      message_type: message.message_type || 'text'
    };

    console.log('📤 Sending message via WebSocket:', messageData);
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
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://pawfectpal-production-2f07.up.railway.app'
      : 'ws://localhost:8000';
    
    return `${baseUrl}/ws/chat/${serviceRequestId}?token=${encodeURIComponent(token)}`;
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
    
    // Disable WebSocket after 5 failed attempts
    if (this.reconnectAttempts > 5) {
      console.warn('⚠️ WebSocket disabled after multiple failed attempts. Real-time chat unavailable.');
      this.isEnabled = false;
      this.notifyConnectionHandlers(false);
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect(serviceRequestId, token).catch(error => {
        console.error('❌ Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval(); // Clear any existing interval
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: 'ping' }));
          console.log('🏓 Sent ping to keep connection alive');
        } catch (error) {
          console.error('❌ Failed to send ping:', error);
          this.stopPingInterval();
        }
      }
    }, 30000); // Send ping every 30 seconds
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
