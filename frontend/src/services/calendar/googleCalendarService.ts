import { Task } from '../../types/tasks/task';

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface GoogleCalendarConfig {
  apiKey: string;
  calendarId: string;
  clientId: string;
}

class GoogleCalendarService {
  private config: GoogleCalendarConfig | null = null;
  private accessToken: string | null = null;

  constructor() {
    // Load config from environment or Firebase Remote Config
    this.loadConfig();
  }

  private async loadConfig() {
    try {
      // Load configuration from Firebase Remote Config
      const { configService } = await import('../config/firebaseConfigService');
      const apiConfig = configService.getApiConfig();
      
      this.config = {
        apiKey: apiConfig.googleMapsApiKey || '', // Will be empty if not configured
        calendarId: 'primary',
        clientId: apiConfig.googleClientId || ''
      };
    } catch (error) {
      console.error('Failed to load Google Calendar config:', error);
      // Fallback to empty config to prevent errors
      this.config = {
        apiKey: '',
        calendarId: 'primary',
        clientId: ''
      };
    }
  }

  async isConfigured(): Promise<boolean> {
    return this.config !== null && this.accessToken !== null;
  }

  async authenticate(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Google Calendar not configured');
    }

    try {
      // Use Google Identity Services for authentication
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.config.clientId,
        scope: 'https://www.googleapis.com/auth/calendar',
        callback: (response: any) => {
          this.accessToken = response.access_token;
        }
      });

      tokenClient.requestAccessToken();
      return true;
    } catch (error) {
      console.error('Google Calendar authentication failed:', error);
      return false;
    }
  }

  async createEvent(task: Task): Promise<string> {
    if (!this.config || !this.accessToken) {
      throw new Error('Google Calendar not authenticated');
    }

    const event: GoogleCalendarEvent = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: task.dateTime || new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(new Date(task.dateTime || new Date()).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 }
        ]
      }
    };

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.config.calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, task: Task): Promise<void> {
    if (!this.config || !this.accessToken) {
      throw new Error('Google Calendar not authenticated');
    }

    const event: GoogleCalendarEvent = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: task.dateTime || new Date().toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(new Date(task.dateTime || new Date()).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.config.calendarId}/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.config || !this.accessToken) {
      throw new Error('Google Calendar not authenticated');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.config.calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Google Calendar API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      throw error;
    }
  }

  async syncTasks(tasks: Task[]): Promise<{ success: number; failed: number }> {
    if (!this.config || !this.accessToken) {
      throw new Error('Google Calendar not authenticated');
    }

    let success = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        if (task.isCompleted) {
          // Skip completed tasks
          continue;
        }

        await this.createEvent(task);
        success++;
      } catch (error) {
        console.error(`Failed to sync task "${task.title}":`, error);
        failed++;
      }
    }

    return { success, failed };
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
