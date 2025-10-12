export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'vaccine' | 'weight' | 'health' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
}

export interface NotificationSettings {
  vaccineReminders: boolean;
  weightAlerts: boolean;
  healthMilestones: boolean;
  generalUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class NotificationService {
  private static readonly VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual key
  private static readonly NOTIFICATION_STORAGE_KEY = 'pawfectpal_notifications';
  private static readonly SETTINGS_STORAGE_KEY = 'pawfectpal_notification_settings';
  
  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported in this browser');
    }
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return Notification.permission;
  }
  
  /**
   * Check if notifications are supported and permitted
   */
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  
  /**
   * Check if notifications are permitted
   */
  static isPermitted(): boolean {
    return Notification.permission === 'granted';
  }
  
  /**
   * Register service worker for push notifications
   */
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }
    
    try {
      // Enable service worker for production
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  
  /**
   * Subscribe to push notifications
   */
  static async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return null;
    }
    
    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return null;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });
      
      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }
  
  /**
   * Send local notification
   */
  static async sendLocalNotification(data: NotificationData): Promise<void> {
    if (!this.isPermitted()) {
      console.warn('Notifications not permitted');
      return;
    }
    
    try {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data.id,
        data: data.data,
        requireInteraction: data.priority === 'urgent',
        silent: false,
      });
      
      // Store notification locally
      this.storeNotification(data);
      
      // Auto-close after 10 seconds (except urgent)
      if (data.priority !== 'urgent') {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }
      
      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        if (data.actionUrl) {
          window.location.href = data.actionUrl;
        }
        
        // Mark as read
        this.markNotificationAsRead(data.id);
      };
      
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }
  
  /**
   * Send vaccine reminder notification
   */
  static async sendVaccineReminder(
    petName: string,
    vaccineName: string,
    dueDate: Date,
    isOverdue: boolean = false
  ): Promise<void> {
    const priority = isOverdue ? 'urgent' : 'high';
    const title = isOverdue 
      ? `🚨 חיסון באיחור - ${petName}`
      : `💉 תזכורת חיסון - ${petName}`;
    
    const body = isOverdue
      ? `החיסון ${vaccineName} עבר זמנו! אנא קבע תור בהקדם.`
      : `החיסון ${vaccineName} יפוג ב-${dueDate.toLocaleDateString('he-IL')}`;
    
    const notificationData: NotificationData = {
      id: `vaccine-${Date.now()}`,
      title,
      body,
      type: 'vaccine',
      priority,
      timestamp: new Date(),
      read: false,
      actionUrl: '/vaccines',
      data: {
        petName,
        vaccineName,
        dueDate: dueDate.toISOString(),
        isOverdue
      }
    };
    
    await this.sendLocalNotification(notificationData);
  }
  
  /**
   * Send weight alert notification
   */
  static async sendWeightAlert(
    petName: string,
    alertType: 'sudden_change' | 'trend' | 'out_of_range',
    message: string
  ): Promise<void> {
    const notificationData: NotificationData = {
      id: `weight-${Date.now()}`,
      title: `⚖️ התראת משקל - ${petName}`,
      body: message,
      type: 'weight',
      priority: 'medium',
      timestamp: new Date(),
      read: false,
      actionUrl: '/weight',
      data: {
        petName,
        alertType
      }
    };
    
    await this.sendLocalNotification(notificationData);
  }
  
  /**
   * Send health reminder notification
   */
  static async sendHealthReminder(
    petName: string,
    reminderType: 'checkup' | 'grooming' | 'dental' | 'parasite',
    dueDate: Date
  ): Promise<void> {
    const typeLabels = {
      checkup: 'בדיקה תקופתית',
      grooming: 'טיפוח',
      dental: 'ניקוי שיניים',
      parasite: 'טיפול נגד טפילים'
    };
    
    const notificationData: NotificationData = {
      id: `health-${Date.now()}`,
      title: `🏥 תזכורת בריאות - ${petName}`,
      body: `${typeLabels[reminderType]} יפוג ב-${dueDate.toLocaleDateString('he-IL')}`,
      type: 'health',
      priority: 'medium',
      timestamp: new Date(),
      read: false,
      actionUrl: '/pets/',
      data: {
        petName,
        reminderType,
        dueDate: dueDate.toISOString()
      }
    };
    
    await this.sendLocalNotification(notificationData);
  }
  
  /**
   * Get all stored notifications
   */
  static getStoredNotifications(): NotificationData[] {
    try {
      const stored = localStorage.getItem(this.NOTIFICATION_STORAGE_KEY);
      if (!stored) return [];
      
      const notifications = JSON.parse(stored);
      return notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }
  
  /**
   * Store notification locally
   */
  private static storeNotification(notification: NotificationData): void {
    try {
      const notifications = this.getStoredNotifications();
      notifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      localStorage.setItem(this.NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to store notification:', error);
    }
  }
  
  /**
   * Mark notification as read
   */
  static markNotificationAsRead(id: string): void {
    try {
      const notifications = this.getStoredNotifications();
      const notification = notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
        localStorage.setItem(this.NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }
  
  /**
   * Clear all notifications
   */
  static clearAllNotifications(): void {
    try {
      localStorage.removeItem(this.NOTIFICATION_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }
  
  /**
   * Get unread notifications count
   */
  static getUnreadCount(): number {
    const notifications = this.getStoredNotifications();
    return notifications.filter(n => !n.read).length;
  }
  
  /**
   * Convert VAPID key to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  /**
   * Schedule notification for future delivery
   */
  static scheduleNotification(
    data: NotificationData,
    delayMs: number
  ): void {
    setTimeout(() => {
      this.sendLocalNotification(data);
    }, delayMs);
  }
  
  /**
   * Schedule vaccine reminder
   */
  static scheduleVaccineReminder(
    petName: string,
    vaccineName: string,
    dueDate: Date,
    reminderDays: number[] = [7, 3, 1] // Remind 7, 3, and 1 day before
  ): void {
    const now = new Date();
    
    reminderDays.forEach(days => {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);
      
      if (reminderDate > now) {
        const delayMs = reminderDate.getTime() - now.getTime();
        
        this.scheduleNotification({
          id: `vaccine-reminder-${petName}-${vaccineName}-${days}`,
          title: `💉 תזכורת חיסון - ${petName}`,
          body: `החיסון ${vaccineName} יפוג בעוד ${days} ימים`,
          type: 'vaccine',
          priority: days === 1 ? 'high' : 'medium',
          timestamp: reminderDate,
          read: false,
          actionUrl: '/vaccines',
          data: {
            petName,
            vaccineName,
            dueDate: dueDate.toISOString(),
            daysUntilDue: days
          }
        }, delayMs);
      }
    });
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const stored = localStorage.getItem(this.SETTINGS_STORAGE_KEY);
      if (!stored) return null;
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return null;
    }
  }

  /**
   * Save notification settings
   */
  static async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      localStorage.setItem(this.SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      throw error;
    }
  }
}

export default NotificationService;

