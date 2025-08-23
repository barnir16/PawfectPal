import type { Task } from '../types/tasks/task';

/**
 * Calendar export utility for tasks
 * Supports ICS file generation and Google Calendar integration
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  attendees?: string[];
  reminderMinutes?: number;
  recurrenceRule?: string;
}

export interface ICSOptions {
  includeDescription: boolean;
  includeLocation: boolean;
  includeAttendees: boolean;
  includeReminders: boolean;
  timezone: string;
}

/**
 * Convert a Task to a CalendarEvent
 */
export const taskToCalendarEvent = (task: Task): CalendarEvent => {
  const startDate = new Date(task.dateTime);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  return {
    id: `task-${task.id}`,
    title: task.title,
    description: task.description,
    startDate,
    endDate,
    location: task.location,
    attendees: task.assignedTo ? [`user-${task.assignedTo}`] : undefined,
    reminderMinutes: task.reminderTime,
    recurrenceRule: task.recurrenceRule
  };
};

/**
 * Generate ICS content for a calendar event
 */
export const generateICSContent = (
  events: CalendarEvent[],
  options: ICSOptions = {
    includeDescription: true,
    includeLocation: true,
    includeAttendees: true,
    includeReminders: true,
    timezone: 'UTC'
  }
): string => {
  const now = new Date();
  const calendarId = `pawfectpal-${now.getTime()}`;
  
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PawfectPal//Pet Care Tasks//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:PUBLISH`,
    `X-WR-CALNAME:PawfectPal Pet Care Tasks`,
    `X-WR-CALDESC:Pet care tasks and reminders`,
    `X-WR-TIMEZONE:${options.timezone}`,
    ''
  ];
  
  events.forEach(event => {
    ics.push(
      'BEGIN:VEVENT',
      `UID:${event.id}`,
      `DTSTAMP:${formatDateToICS(now)}`,
      `DTSTART:${formatDateToICS(event.startDate)}`,
      `DTEND:${formatDateToICS(event.endDate)}`,
      `SUMMARY:${escapeICSField(event.title)}`
    );
    
    if (options.includeDescription && event.description) {
      ics.push(`DESCRIPTION:${escapeICSField(event.description)}`);
    }
    
    if (options.includeLocation && event.location) {
      ics.push(`LOCATION:${escapeICSField(event.location)}`);
    }
    
    if (options.includeAttendees && event.attendees && event.attendees.length > 0) {
      event.attendees.forEach(attendee => {
        ics.push(`ATTENDEE:mailto:${attendee}`);
      });
    }
    
    if (options.includeReminders && event.reminderMinutes) {
      ics.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `TRIGGER:-PT${event.reminderMinutes}M`,
        'DESCRIPTION:Reminder',
        'END:VALARM'
      );
    }
    
    if (event.recurrenceRule) {
      ics.push(`RRULE:${event.recurrenceRule}`);
    }
    
    ics.push('END:VEVENT');
  });
  
  ics.push('END:VCALENDAR');
  
  return ics.join('\r\n');
};

/**
 * Generate ICS file for tasks
 */
export const generateTasksICS = async (
  tasks: Task[],
  options: ICSOptions = {
    includeDescription: true,
    includeLocation: true,
    includeAttendees: true,
    includeReminders: true,
    timezone: 'UTC'
  }
): Promise<string> => {
  try {
    const events = tasks.map(taskToCalendarEvent);
    const icsContent = generateICSContent(events, options);
    
    // Create blob and data URL
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const dataUrl = await blobToDataURL(blob);
    
    return dataUrl;
  } catch (error) {
    console.error('Error generating ICS file:', error);
    throw new Error('Failed to generate ICS file');
  }
};

/**
 * Download ICS file
 */
export const downloadICS = (dataUrl: string, filename: string = 'pet-care-tasks.ics'): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Sync tasks with Google Calendar
 * Note: This requires Google Calendar API integration
 */
export const syncWithGoogleCalendar = async (
  tasks: Task[],
  googleApiKey: string
): Promise<boolean> => {
  try {
    console.log('Syncing tasks with Google Calendar...');
    
    // This is a placeholder implementation
    // In a real app, you would:
    // 1. Use Google Calendar API v3
    // 2. Authenticate with OAuth 2.0
    // 3. Create calendar events for each task
    
    const events = tasks.map(taskToCalendarEvent);
    
    // Placeholder: simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log(`Successfully synced ${events.length} tasks with Google Calendar`);
    return true;
  } catch (error) {
    console.error('Error syncing with Google Calendar:', error);
    return false;
  }
};

/**
 * Check if Google Calendar sync is available
 */
export const isGoogleCalendarSyncAvailable = (): boolean => {
  // This would check if:
  // 1. Google Calendar API is configured
  // 2. User is authenticated
  // 3. Required permissions are granted
  return false; // Placeholder
};

/**
 * Get Google Calendar authentication URL
 */
export const getGoogleCalendarAuthUrl = (): string => {
  // This would return the OAuth 2.0 authorization URL
  // for Google Calendar API access
  return 'https://accounts.google.com/o/oauth2/auth?client_id=...&scope=...&redirect_uri=...';
};

/**
 * Helper function to format date for ICS
 */
const formatDateToICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Helper function to escape ICS field values
 */
const escapeICSField = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
};

/**
 * Helper function to convert blob to data URL
 */
const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Get supported timezones
 */
export const getSupportedTimezones = (): string[] => {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];
};
