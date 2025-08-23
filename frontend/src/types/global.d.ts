// Global type definitions for external APIs

declare global {
  interface Window {
    gapi?: {
      client?: {
        calendar?: {
          events?: {
            insert: (params: {
              calendarId: string;
              resource: {
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
                  overrides: Array<{
                    method: string;
                    minutes: number;
                  }>;
                };
              };
            }) => Promise<any>;
          };
        };
      };
    };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: any) => any;
        };
        id?: {
          initialize: (config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export {};
