import { StorageHelper } from './StorageHelper';

export class LocaleHelper {
  private static readonly PREF_LANGUAGE_KEY = 'language';
  private static readonly PREF_LANGUAGE_DEFAULT = 'en';
  private static readonly PREF_DARK_MODE_KEY = 'dark_mode';
  private static readonly PREF_DARK_MODE_DEFAULT = 'system';

  static async getLanguage(): Promise<string> {
    try {
      const saved = await StorageHelper.getItem(this.PREF_LANGUAGE_KEY);
      return saved || this.PREF_LANGUAGE_DEFAULT;
    } catch (error) {
      console.error('Error getting language:', error);
      return this.PREF_LANGUAGE_DEFAULT;
    }
  }

  static async setLanguage(language: string): Promise<void> {
    try {
      await StorageHelper.setItem(this.PREF_LANGUAGE_KEY, language);
      // In a real app, you'd trigger a language change event
      // For React Native, you might need to restart the app or use a state management solution
    } catch (error) {
      console.error('Error setting language:', error);
    }
  }

  static async getDarkModeSetting(): Promise<string> {
    try {
      const saved = await StorageHelper.getItem(this.PREF_DARK_MODE_KEY);
      return saved || this.PREF_DARK_MODE_DEFAULT;
    } catch (error) {
      console.error('Error getting dark mode setting:', error);
      return this.PREF_DARK_MODE_DEFAULT;
    }
  }

  static async setDarkModeSetting(mode: string): Promise<void> {
    try {
      await StorageHelper.setItem(this.PREF_DARK_MODE_KEY, mode);
      // Note: Dark mode application in React Native is different from web
      // You'll need to implement this using React Native's appearance API
    } catch (error) {
      console.error('Error setting dark mode:', error);
    }
  }

  static applyDarkMode(mode: string): void {
    // Note: This is a placeholder for React Native dark mode implementation
    // In a real React Native app, you would use:
    // - React Native's Appearance API
    // - A theme provider (like react-native-paper or styled-components)
    // - Navigation theme configuration
    console.log('Dark mode setting:', mode);
  }

  static async initializeDarkMode(): Promise<void> {
    try {
      const mode = await this.getDarkModeSetting();
      this.applyDarkMode(mode);
    } catch (error) {
      console.error('Error initializing dark mode:', error);
    }
  }

  static async getCurrentLanguage(): Promise<string> {
    return await this.getLanguage();
  }

  static async setNewLocale(language: string): Promise<void> {
    await this.setLanguage(language);
  }
} 