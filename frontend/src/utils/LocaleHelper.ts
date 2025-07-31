import { StorageHelper } from './StorageHelper';

/**
 * Locale helper for managing language and dark mode settings
 * Compatible with React Native
 */
export class LocaleHelper {
  private static readonly LANGUAGE_KEY = 'app_language';
  private static readonly DARK_MODE_KEY = 'dark_mode_setting';

  /**
   * Get the current language setting
   */
  static async getLanguage(): Promise<string> {
    const language = await StorageHelper.getItem(this.LANGUAGE_KEY);
    return language || 'en';
  }

  /**
   * Set the language setting
   */
  static async setLanguage(language: string): Promise<void> {
    await StorageHelper.setItem(this.LANGUAGE_KEY, language);
  }

  /**
   * Get the dark mode setting
   */
  static async getDarkModeSetting(): Promise<boolean> {
    const setting = await StorageHelper.getItem(this.DARK_MODE_KEY);
    return setting === 'true';
  }

  /**
   * Set the dark mode setting
   */
  static async setDarkModeSetting(enabled: boolean): Promise<void> {
    await StorageHelper.setItem(this.DARK_MODE_KEY, enabled.toString());
  }

  /**
   * Initialize dark mode based on stored setting
   */
  static async initializeDarkMode(): Promise<void> {
    try {
      const isDarkMode = await this.getDarkModeSetting();
      await this.applyDarkMode(isDarkMode);
    } catch (error) {
      console.error('Error initializing dark mode:', error);
    }
  }

  /**
   * Apply dark mode setting
   * Note: In React Native, you would typically use a theme context or state management
   */
  static async applyDarkMode(enabled: boolean): Promise<void> {
    // In React Native, you would update your theme context here
    // For now, we'll just log the setting
    console.log(`Dark mode ${enabled ? 'enabled' : 'disabled'}`);
    
    // Store the setting
    await this.setDarkModeSetting(enabled);
  }

  /**
   * Get the current language for translations
   */
  static async getCurrentLanguage(): Promise<string> {
    return await this.getLanguage();
  }

  /**
   * Set a new locale and reload the app
   */
  static async setNewLocale(language: string): Promise<void> {
    await this.setLanguage(language);
    
    // In React Native, you might want to trigger a re-render
    // or reload the app to apply the new language
    console.log(`Language changed to: ${language}`);
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages(): string[] {
    return ['en', 'he']; // English and Hebrew
  }

  /**
   * Get language display name
   */
  static getLanguageDisplayName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'he': 'עברית',
    };
    return languageNames[languageCode] || languageCode;
  }
} 