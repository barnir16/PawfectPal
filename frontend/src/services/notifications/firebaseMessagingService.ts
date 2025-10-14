/**
 * Firebase Cloud Messaging Service
 * Handles push notifications for chat messages
 */
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { configService } from '../config/firebaseConfigService';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
  requireInteraction?: boolean;
}

export interface ChatNotificationData {
  type: 'new_message' | 'message_read' | 'typing';
  service_request_id: string;
  sender_id: string;
  sender_username: string;
  message_preview?: string;
  timestamp: string;
}

class FirebaseMessagingService {
  private static instance: FirebaseMessagingService;
  private messaging: Messaging | null = null;
  private app: FirebaseApp | null = null;
  private isInitialized = false;
  private fcmToken: string | null = null;
  private messageHandlers: ((payload: any) => void)[] = [];

  private constructor() {}

  static getInstance(): FirebaseMessagingService {
    if (!FirebaseMessagingService.instance) {
      FirebaseMessagingService.instance = new FirebaseMessagingService();
    }
    return FirebaseMessagingService.instance;
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check if notifications are enabled
      if (!configService.isFeatureEnabled('enableNotifications')) {
        console.log('🔕 Notifications disabled in config');
        return false;
      }

      // TEMPORARILY DISABLE FCM TO FIX OTHER ISSUES
      console.log('🔕 FCM temporarily disabled to fix other issues');
      return false;

      // Get Firebase config
      const firebaseConfig = configService.getAll();
      
      // Initialize Firebase app (check if already exists)
      try {
        this.app = getApp(); // Try to get existing app
        console.log('🔔 Using existing Firebase app');
      } catch (error) {
        // App doesn't exist, create new one
        this.app = initializeApp({
          apiKey: firebaseConfig.googleClientId, // Using Google Client ID as API key
          projectId: 'pawfectpal-ac5d7',
          messagingSenderId: configService.get('firebaseMessagingSenderId') || '123456789',
          appId: '1:123456789:web:abcdef'
        });
        console.log('🔔 Created new Firebase app');
      }

      // Initialize messaging
      this.messaging = getMessaging(this.app);

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return false;
      }

      // Get FCM token
      this.fcmToken = await this.getFCMToken();
      if (!this.fcmToken) {
        console.error('❌ Failed to get FCM token');
        return false;
      }

      // Set up message listener
      this.setupMessageListener();

      console.log('✅ Firebase Cloud Messaging initialized');
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Firebase Cloud Messaging:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  private async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Get FCM token
   */
  private async getFCMToken(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      const token = await getToken(this.messaging, {
        vapidKey: configService.get('firebaseVapidKey') || 'YOUR_VAPID_KEY' // Get from Remote Config
      });
      
      if (token) {
        console.log('🔑 FCM Token obtained:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.warn('⚠️ No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Set up message listener for foreground notifications
   */
  private setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('📨 FCM message received:', payload);
      
      // Notify all registered handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error('❌ Error in message handler:', error);
        }
      });

      // Show notification if app is in foreground
      this.showForegroundNotification(payload);
    });
  }

  /**
   * Show notification when app is in foreground
   */
  private showForegroundNotification(payload: any): void {
    const notification = payload.notification;
    const data = payload.data;

    if (notification) {
      // Create custom notification
      const notificationOptions: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        badge: notification.badge || '/favicon.ico',
        tag: data?.service_request_id || 'chat',
        data: data,
        requireInteraction: false,
        silent: false
      };

      // Show notification
      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(notification.title, notificationOptions);
        });
      } else {
        // Fallback to browser notification
        new Notification(notification.title, notificationOptions);
      }
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler: (payload: any) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Unregister message handler
   */
  offMessage(handler: (payload: any) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Get FCM token for server registration
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if FCM is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.fcmToken !== null;
  }

  /**
   * Send chat notification
   */
  async sendChatNotification(data: ChatNotificationData): Promise<void> {
    if (!this.isReady()) {
      console.warn('⚠️ FCM not ready, cannot send notification');
      return;
    }

    try {
      // This would typically be called from the backend
      // For now, we'll just log the notification data
      console.log('📤 Sending chat notification:', data);
      
      // In a real implementation, you would send this to your backend
      // which would then send the notification via Firebase Admin SDK
      
    } catch (error) {
      console.error('❌ Error sending chat notification:', error);
    }
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification: Notification): void {
    const data = notification.data;
    
    if (data?.service_request_id) {
      // Navigate to chat page
      window.location.href = `/chat/${data.service_request_id}`;
    }
    
    notification.close();
  }
}

export const firebaseMessagingService = FirebaseMessagingService.getInstance();

