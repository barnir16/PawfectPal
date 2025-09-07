import { Task } from '../../types/tasks/task';
import { useNotifications } from '../../contexts/NotificationContext';

export interface TaskNotificationService {
  checkOverdueTasks: (tasks: Task[]) => void;
  checkUpcomingTasks: (tasks: Task[]) => void;
  sendTaskReminder: (task: Task) => void;
  sendTaskCompleted: (task: Task) => void;
}

export const createTaskNotificationService = (addNotification: (notification: any) => void) => {
  const checkOverdueTasks = (tasks: Task[]) => {
    const now = new Date();
    const overdueTasks = tasks.filter(task => {
      if (task.isCompleted) return false;
      if (!task.dateTime) return false;
      
      const taskDate = new Date(task.dateTime);
      return taskDate < now;
    });

    overdueTasks.forEach(task => {
      addNotification({
        type: 'warning',
        title: 'Overdue Task',
        message: `"${task.title}" was due ${Math.ceil((now.getTime() - new Date(task.dateTime!).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
        duration: 8000,
        action: {
          label: 'View Task',
          onClick: () => {
            // Navigate to tasks page or specific task
            window.location.href = '/tasks';
          }
        }
      });
    });
  };

  const checkUpcomingTasks = (tasks: Task[]) => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingTasks = tasks.filter(task => {
      if (task.isCompleted) return false;
      if (!task.dateTime) return false;
      
      const taskDate = new Date(task.dateTime);
      return taskDate >= tomorrow && taskDate <= nextWeek;
    });

    if (upcomingTasks.length > 0) {
      addNotification({
        type: 'info',
        title: 'Upcoming Tasks',
        message: `You have ${upcomingTasks.length} task(s) due this week`,
        duration: 6000,
        action: {
          label: 'View Tasks',
          onClick: () => {
            window.location.href = '/tasks';
          }
        }
      });
    }
  };

  const sendTaskReminder = (task: Task) => {
    addNotification({
      type: 'info',
      title: 'Task Reminder',
      message: `Don't forget: "${task.title}"`,
      duration: 5000,
      action: {
        label: 'Mark Complete',
        onClick: () => {
          // This would need to be connected to the task completion logic
          console.log('Mark task as complete:', task.id);
        }
      }
    });
  };

  const sendTaskCompleted = (task: Task) => {
    addNotification({
      type: 'success',
      title: 'Task Completed',
      message: `Great job! "${task.title}" is now complete`,
      duration: 3000
    });
  };

  return {
    checkOverdueTasks,
    checkUpcomingTasks,
    sendTaskReminder,
    sendTaskCompleted
  };
};
