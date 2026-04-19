/**
 * Firebase Cloud Messaging Service
 * Handles push notifications for chat messages
 */
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { initializeApp, FirebaseApp, getApp } from 'firebase/app';
import { configService } from '../config/firebaseConfigService';
import { SHARED_CONFIG } from '../../config/shared';

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
      if (!configService.isFeatureEnabled('enableNotifications')) {
        return false;
      }

      if (typeof window === 'undefined' || !window.isSecureContext) {
        return false;
      }

      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        return false;
      }

      const firebaseConfig = SHARED_CONFIG.firebase;
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        return false;
      }

      const vapidKey = configService.get('firebaseVapidKey');
      if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY') {
        return false;
      }

      if (Notification.permission !== 'granted') {
        return false;
      }

      try {
        this.app = getApp();
      } catch {
        this.app = initializeApp({
          ...firebaseConfig,
          messagingSenderId:
            configService.get('firebaseMessagingSenderId') ||
            firebaseConfig.messagingSenderId,
        });
      }

      this.messaging = getMessaging(this.app);

      await navigator.serviceWorker.ready;

      this.fcmToken = await this.getFCMToken();
      if (!this.fcmToken) {
        return false;
      }

      this.setupMessageListener();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn('Firebase Cloud Messaging is unavailable in this environment:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  private async getFCMToken(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      const vapidKey = configService.get('firebaseVapidKey');

      const token = await getToken(this.messaging, { vapidKey });
      return token || null;
    } catch (error) {
      console.warn('Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * Set up message listener for foreground notifications
   */
  private setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      this.messageHandlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error('Error in notification message handler:', error);
        }
      });

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
      const notificationOptions: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/favicon.ico',
        badge: notification.badge || '/favicon.ico',
        tag: data?.service_request_id || 'chat',
        data,
        requireInteraction: false,
        silent: false,
      };

      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(notification.title, notificationOptions);
        });
      } else {
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
   * Placeholder for future backend-backed notification sending.
   */
  async sendChatNotification(data: ChatNotificationData): Promise<void> {
    void data;
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification: Notification): void {
    const data = notification.data;

    if (data?.service_request_id) {
      window.location.href = `/chat/${data.service_request_id}`;
    }

    notification.close();
  }
}

export const firebaseMessagingService = FirebaseMessagingService.getInstance();
