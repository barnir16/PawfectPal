/**
 * Offline Message Queue Service
 * Handles queuing messages when offline and sending them when online
 */
import { ChatMessageCreate } from '../types/services/chat';

export interface QueuedMessage {
  id: string;
  message: ChatMessageCreate;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  queuedMessages: number;
  lastSyncTime?: number;
}

class OfflineMessageService {
  private static instance: OfflineMessageService;
  private queuedMessages: QueuedMessage[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private statusHandlers: ((status: OfflineStatus) => void)[] = [];

  private constructor() {
    this.loadQueuedMessages();
    this.setupOnlineStatusListeners();
  }

  static getInstance(): OfflineMessageService {
    if (!OfflineMessageService.instance) {
      OfflineMessageService.instance = new OfflineMessageService();
    }
    return OfflineMessageService.instance;
  }

  /**
   * Queue a message for sending when online
   */
  queueMessage(message: ChatMessageCreate): string {
    const queuedMessage: QueuedMessage = {
      id: this.generateMessageId(),
      message,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    this.queuedMessages.push(queuedMessage);
    this.saveQueuedMessages();
    this.notifyStatusHandlers();

    console.log('📱 Message queued for offline sending:', queuedMessage.id);
    return queuedMessage.id;
  }

  /**
   * Remove a message from the queue
   */
  removeMessage(messageId: string): boolean {
    const initialLength = this.queuedMessages.length;
    this.queuedMessages = this.queuedMessages.filter(msg => msg.id !== messageId);
    
    if (this.queuedMessages.length < initialLength) {
      this.saveQueuedMessages();
      this.notifyStatusHandlers();
      console.log('📱 Message removed from queue:', messageId);
      return true;
    }
    
    return false;
  }

  /**
   * Get all queued messages
   */
  getQueuedMessages(): QueuedMessage[] {
    return [...this.queuedMessages];
  }

  /**
   * Get offline status
   */
  getOfflineStatus(): OfflineStatus {
    return {
      isOnline: this.isOnline,
      queuedMessages: this.queuedMessages.length,
      lastSyncTime: this.getLastSyncTime()
    };
  }

  /**
   * Subscribe to offline status changes
   */
  onStatusChange(handler: (status: OfflineStatus) => void): void {
    this.statusHandlers.push(handler);
  }

  /**
   * Unsubscribe from offline status changes
   */
  offStatusChange(handler: (status: OfflineStatus) => void): void {
    const index = this.statusHandlers.indexOf(handler);
    if (index > -1) {
      this.statusHandlers.splice(index, 1);
    }
  }

  /**
   * Sync queued messages when coming online
   */
  async syncQueuedMessages(sendMessageFn: (message: ChatMessageCreate) => Promise<void>): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.queuedMessages.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Syncing queued messages...');

    const messagesToSync = [...this.queuedMessages];
    const successfulMessages: string[] = [];
    const failedMessages: QueuedMessage[] = [];

    for (const queuedMessage of messagesToSync) {
      try {
        await sendMessageFn(queuedMessage.message);
        successfulMessages.push(queuedMessage.id);
        console.log('✅ Queued message sent successfully:', queuedMessage.id);
      } catch (error) {
        console.error('❌ Failed to send queued message:', queuedMessage.id, error);
        
        // Increment retry count
        queuedMessage.retryCount++;
        
        if (queuedMessage.retryCount < queuedMessage.maxRetries) {
          failedMessages.push(queuedMessage);
        } else {
          console.warn('⚠️ Message exceeded max retries, removing from queue:', queuedMessage.id);
        }
      }
    }

    // Update queue with failed messages
    this.queuedMessages = failedMessages;
    this.saveQueuedMessages();
    this.setLastSyncTime(Date.now());
    this.notifyStatusHandlers();

    this.syncInProgress = false;
    console.log(`🔄 Sync complete: ${successfulMessages.length} sent, ${failedMessages.length} failed`);
  }

  /**
   * Check if there are queued messages
   */
  hasQueuedMessages(): boolean {
    return this.queuedMessages.length > 0;
  }

  /**
   * Clear all queued messages
   */
  clearQueuedMessages(): void {
    this.queuedMessages = [];
    this.saveQueuedMessages();
    this.notifyStatusHandlers();
    console.log('📱 All queued messages cleared');
  }

  private generateMessageId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadQueuedMessages(): void {
    try {
      const stored = localStorage.getItem('pawfectpal_queued_messages');
      if (stored) {
        this.queuedMessages = JSON.parse(stored);
        console.log(`📱 Loaded ${this.queuedMessages.length} queued messages`);
      }
    } catch (error) {
      console.error('❌ Failed to load queued messages:', error);
      this.queuedMessages = [];
    }
  }

  private saveQueuedMessages(): void {
    try {
      localStorage.setItem('pawfectpal_queued_messages', JSON.stringify(this.queuedMessages));
    } catch (error) {
      console.error('❌ Failed to save queued messages:', error);
    }
  }

  private getLastSyncTime(): number | undefined {
    try {
      const stored = localStorage.getItem('pawfectpal_last_sync');
      return stored ? parseInt(stored, 10) : undefined;
    } catch (error) {
      console.error('❌ Failed to get last sync time:', error);
      return undefined;
    }
  }

  private setLastSyncTime(timestamp: number): void {
    try {
      localStorage.setItem('pawfectpal_last_sync', timestamp.toString());
    } catch (error) {
      console.error('❌ Failed to set last sync time:', error);
    }
  }

  private setupOnlineStatusListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Connection restored');
      this.notifyStatusHandlers();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📱 Connection lost - going offline');
      this.notifyStatusHandlers();
    });
  }

  private notifyStatusHandlers(): void {
    const status = this.getOfflineStatus();
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('❌ Error in status handler:', error);
      }
    });
  }
}

export const offlineMessageService = OfflineMessageService.getInstance();

