import type { Task } from '../types/tasks/task';

/**
 * Notification helper for React web
 * Uses Web Notifications API (https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
 */
export class NotificationHelper {
  /**
   * Schedule a notification for a task
   * Note: Web Notifications API does not support scheduling,
   * so this triggers immediately or you can implement scheduling with setTimeout while app is open.
   */
  static scheduleNotification(task: Task): void {
    try {
      if (!this.isNotificationSupported()) {
        console.warn('Notifications not supported in this browser');
        return;
      }

      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      const taskDateTime = new Date(task.dateTime);
      const now = new Date();
      const timeUntilTask = taskDateTime.getTime() - now.getTime();

      if (timeUntilTask > 0) {
        setTimeout(() => {
          new Notification('PawfectPal Reminder', {
            body: `${task.title}: ${task.description}`,
          });
        }, timeUntilTask);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   * Note: Web Notifications API has no built-in cancel for notifications scheduled with setTimeout.
   * You would need to track timeouts to clear them if needed.
   */
  static cancelNotification(_taskId: number): void {
    // No direct support in Web Notifications API
    console.warn('Cancel notification is not supported in Web Notifications API.');
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (!this.isNotificationSupported()) {
        console.warn('Notifications not supported in this browser');
        return false;
      }
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are supported
   */
  static isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Get current notification permission status
   */
  static getNotificationPermission(): string {
    if (!this.isNotificationSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Initialize notification settings
   */
  static initializeNotifications(): void {
    // No special initialization is needed for the Web Notifications API.
  }
}
