import { Task } from '../types';

export class NotificationHelper {
  static async scheduleNotification(task: Task): Promise<void> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Request permission
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }
    }

    // Schedule notification
    const taskDateTime = new Date(task.dateTime);
    const now = new Date();
    const timeUntilTask = taskDateTime.getTime() - now.getTime();

    if (timeUntilTask > 0) {
      setTimeout(() => {
        new Notification('PawfectPal Reminder', {
          body: `${task.title}: ${task.description}`,
          icon: '/favicon.ico',
          tag: `task-${task.id}`,
        });
      }, timeUntilTask);
    }
  }

  static async cancelNotification(taskId: number): Promise<void> {
    // In a real app, you'd cancel the scheduled notification
    // For now, we'll just log it
    console.log(`Cancelled notification for task ${taskId}`);
  }

  static async enableNotifications(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  static getNotificationPermission(): NotificationPermission {
    return Notification.permission;
  }
} 