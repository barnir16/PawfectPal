import type { Task } from '../../types/tasks/task';
import { configService } from '../config/firebaseConfigService';

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
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

interface GoogleCalendarConfig {
  clientId: string;
  calendarId: string;
}

type CalendarNamespace = 'tasks' | 'vaccines';

type CalendarSyncMap = Record<string, string>;

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const SYNC_STORAGE_KEY = 'pawfectpal.googleCalendar.syncMap.v1';
const TOKEN_STORAGE_KEY = 'pawfectpal.googleCalendar.accessToken';

class GoogleCalendarService {
  private config: GoogleCalendarConfig | null = null;
  private accessToken: string | null = null;
  private gisScriptPromise: Promise<void> | null = null;

  constructor() {
    this.loadConfig();
    this.accessToken = this.restoreStoredToken();
  }

  private loadConfig() {
    const oauthConfig = configService.getOAuthConfig();
    this.config = {
      clientId: oauthConfig.googleClientId || '',
      calendarId: 'primary',
    };
  }

  private restoreStoredToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private persistToken(token: string | null) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (token) {
        window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures and keep the in-memory token.
    }
  }

  private async ensureGoogleIdentityLoaded(): Promise<void> {
    if (window.google?.accounts?.oauth2) {
      return;
    }

    if (!this.gisScriptPromise) {
      this.gisScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(
          `script[src="${GOOGLE_IDENTITY_SCRIPT}"]`
        );

        if (existingScript) {
          existingScript.addEventListener('load', () => resolve(), { once: true });
          existingScript.addEventListener(
            'error',
            () => reject(new Error('Failed to load Google Identity Services')),
            { once: true }
          );
          return;
        }

        const script = document.createElement('script');
        script.src = GOOGLE_IDENTITY_SCRIPT;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
      });
    }

    await this.gisScriptPromise;
  }

  private getConfig(): GoogleCalendarConfig {
    if (!this.config || !this.config.clientId) {
      this.loadConfig();
    }

    if (!this.config?.clientId) {
      throw new Error('Google Calendar is not configured. Missing Google client ID.');
    }

    return this.config;
  }

  async isConfigured(): Promise<boolean> {
    try {
      const config = this.getConfig();
      return Boolean(config.clientId);
    } catch {
      return false;
    }
  }

  async authenticate(interactive = true): Promise<boolean> {
    const config = this.getConfig();
    await this.ensureGoogleIdentityLoaded();

    return new Promise((resolve) => {
      const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
        client_id: config.clientId,
        scope: GOOGLE_CALENDAR_SCOPE,
        prompt: interactive ? 'consent' : '',
        callback: (response: { access_token?: string; error?: string }) => {
          if (response.error || !response.access_token) {
            console.error('Google Calendar authentication failed:', response.error);
            resolve(false);
            return;
          }

          this.accessToken = response.access_token;
          this.persistToken(response.access_token);
          resolve(true);
        },
      });

      if (!tokenClient) {
        resolve(false);
        return;
      }

      tokenClient.requestAccessToken();
    });
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.accessToken) {
      return;
    }

    const authenticated = await this.authenticate(true);
    if (!authenticated || !this.accessToken) {
      throw new Error('Google Calendar authorization was not completed.');
    }
  }

  private getStorageMap(): CalendarSyncMap {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const rawValue = window.localStorage.getItem(SYNC_STORAGE_KEY);
      if (!rawValue) {
        return {};
      }

      const parsedValue = JSON.parse(rawValue);
      return typeof parsedValue === 'object' && parsedValue ? parsedValue : {};
    } catch {
      return {};
    }
  }

  private setStorageMap(value: CalendarSyncMap) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore storage errors.
    }
  }

  private getSyncKey(task: Task, namespace: CalendarNamespace): string {
    return `${namespace}:${task.id}`;
  }

  private buildEventFromTask(task: Task): GoogleCalendarEvent {
    const startDate = new Date(task.dateTime || new Date().toISOString());
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const recurrence: string[] = [];
    if (task.repeatUnit && task.repeatInterval) {
      let rule = `RRULE:FREQ=${task.repeatUnit.toUpperCase()}`;
      if (task.repeatInterval > 1) {
        rule += `;INTERVAL=${task.repeatInterval}`;
      }
      if (task.repeatEndDate) {
        const untilDate = new Date(task.repeatEndDate);
        rule += `;UNTIL=${untilDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
      }
      recurrence.push(rule);
    }

    return {
      summary: task.title,
      description: task.description || 'Pet care task from PawfectPal',
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      recurrence: recurrence.length > 0 ? recurrence : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 24 * 60 },
        ],
      },
    };
  }

  private async fetchCalendar(
    path: string,
    options: RequestInit
  ): Promise<Response> {
    const config = this.getConfig();
    await this.ensureAuthenticated();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}${path}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      }
    );

    if (response.status === 401) {
      this.accessToken = null;
      this.persistToken(null);
      throw new Error('Google Calendar authorization expired. Please try syncing again.');
    }

    return response;
  }

  async upsertTaskEvent(task: Task, namespace: CalendarNamespace = 'tasks'): Promise<string> {
    const syncMap = this.getStorageMap();
    const syncKey = this.getSyncKey(task, namespace);
    const existingEventId = syncMap[syncKey];
    const eventPayload = this.buildEventFromTask(task);

    if (existingEventId) {
      const updateResponse = await this.fetchCalendar(`/events/${existingEventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventPayload),
      });

      if (updateResponse.ok) {
        return existingEventId;
      }

      if (updateResponse.status !== 404) {
        const errorBody = await updateResponse.text();
        throw new Error(
          `Failed to update Google Calendar event (${updateResponse.status}): ${errorBody}`
        );
      }
    }

    const createResponse = await this.fetchCalendar('/events', {
      method: 'POST',
      body: JSON.stringify(eventPayload),
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.text();
      throw new Error(
        `Failed to create Google Calendar event (${createResponse.status}): ${errorBody}`
      );
    }

    const createdEvent = await createResponse.json();
    if (createdEvent?.id) {
      syncMap[syncKey] = createdEvent.id;
      this.setStorageMap(syncMap);
      return createdEvent.id;
    }

    throw new Error('Google Calendar did not return an event ID.');
  }

  async deleteTaskEvent(task: Task, namespace: CalendarNamespace = 'tasks'): Promise<void> {
    const syncMap = this.getStorageMap();
    const syncKey = this.getSyncKey(task, namespace);
    const existingEventId = syncMap[syncKey];

    if (!existingEventId) {
      return;
    }

    const response = await this.fetchCalendar(`/events/${existingEventId}`, {
      method: 'DELETE',
    });

    if (!response.ok && response.status !== 404) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to delete Google Calendar event (${response.status}): ${errorBody}`
      );
    }

    delete syncMap[syncKey];
    this.setStorageMap(syncMap);
  }

  async syncTasks(
    tasks: Task[],
    namespace: CalendarNamespace = 'tasks'
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        if (task.isCompleted) {
          await this.deleteTaskEvent(task, namespace);
          continue;
        }

        await this.upsertTaskEvent(task, namespace);
        success += 1;
      } catch (error) {
        console.error(`Failed to sync task "${task.title}" to Google Calendar:`, error);
        failed += 1;
      }
    }

    return { success, failed };
  }
}

export const googleCalendarService = new GoogleCalendarService();
