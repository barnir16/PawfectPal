/**
 * Locale helper for managing language and dark mode settings
 * Compatible with React web (uses localStorage)
 */
export class LocaleHelper {
  private static readonly LANGUAGE_KEY = 'app_language';
  private static readonly DARK_MODE_KEY = 'dark_mode_setting';

  static getLanguage(): string {
    try {
      const language = localStorage.getItem(this.LANGUAGE_KEY);
      return language || 'en';
    } catch (error) {
      console.error('Error getting language:', error);
      return 'en';
    }
  }

  static setLanguage(language: string): void {
    try {
      localStorage.setItem(this.LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }

  static getDarkModeSetting(): boolean {
    try {
      const setting = localStorage.getItem(this.DARK_MODE_KEY);
      return setting === 'true';
    } catch (error) {
      console.error('Error getting dark mode setting:', error);
      return false;
    }
  }

  static setDarkModeSetting(enabled: boolean): void {
    try {
      localStorage.setItem(this.DARK_MODE_KEY, enabled.toString());
    } catch (error) {
      console.error('Error setting dark mode setting:', error);
    }
  }

  static initializeDarkMode(): void {
    try {
      const isDarkMode = this.getDarkModeSetting();
      this.applyDarkMode(isDarkMode);
    } catch (error) {
      console.error('Error initializing dark mode:', error);
    }
  }

  static applyDarkMode(enabled: boolean): void {
    this.setDarkModeSetting(enabled);

    if (enabled) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  static getCurrentLanguage(): string {
    return this.getLanguage();
  }

  static setNewLocale(language: string): void {
    this.setLanguage(language);
  }

  static getSupportedLanguages(): string[] {
    return ['en', 'he']; // English and Hebrew
  }

  static getLanguageDisplayName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      en: 'English',
      he: 'עברית',
    };
    return languageNames[languageCode] || languageCode;
  }
}
