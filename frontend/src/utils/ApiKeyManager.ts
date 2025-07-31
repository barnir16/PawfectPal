import { StorageHelper } from './StorageHelper';

/**
 * API Key Manager for React Native
 * Uses AsyncStorage for secure key management
 */
export class ApiKeyManager {
  private static readonly PETS_API_KEY_KEY = 'pets_api_key';
  private static readonly GEMINI_API_KEY_KEY = 'gemini_api_key';

  /**
   * Get the pets API key
   */
  static async getPetsApiKey(): Promise<string | null> {
    try {
      return await StorageHelper.getItem(this.PETS_API_KEY_KEY);
    } catch (error) {
      console.error('Error getting pets API key:', error);
      return null;
    }
  }

  /**
   * Set the pets API key
   */
  static async setPetsApiKey(key: string | null): Promise<void> {
    try {
      if (key) {
        await StorageHelper.setItem(this.PETS_API_KEY_KEY, key);
      } else {
        await StorageHelper.removeItem(this.PETS_API_KEY_KEY);
      }
    } catch (error) {
      console.error('Error setting pets API key:', error);
    }
  }

  /**
   * Get the Gemini API key
   */
  static async getGeminiApiKey(): Promise<string | null> {
    try {
      return await StorageHelper.getItem(this.GEMINI_API_KEY_KEY);
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return null;
    }
  }

  /**
   * Set the Gemini API key
   */
  static async setGeminiApiKey(key: string | null): Promise<void> {
    try {
      if (key) {
        await StorageHelper.setItem(this.GEMINI_API_KEY_KEY, key);
      } else {
        await StorageHelper.removeItem(this.GEMINI_API_KEY_KEY);
      }
    } catch (error) {
      console.error('Error setting Gemini API key:', error);
    }
  }

  /**
   * Check if pets API key exists
   */
  static async hasPetsApiKey(): Promise<boolean> {
    const key = await this.getPetsApiKey();
    return !!key;
  }

  /**
   * Check if Gemini API key exists
   */
  static async hasGeminiApiKey(): Promise<boolean> {
    const key = await this.getGeminiApiKey();
    return !!key;
  }

  /**
   * Clear all stored API keys
   */
  static async clearAllKeys(): Promise<void> {
    try {
      await StorageHelper.removeItem(this.PETS_API_KEY_KEY);
      await StorageHelper.removeItem(this.GEMINI_API_KEY_KEY);
    } catch (error) {
      console.error('Error clearing API keys:', error);
    }
  }

  /**
   * Get all API keys
   */
  static async getAllKeys(): Promise<{ pets?: string; gemini?: string }> {
    try {
      const [petsKey, geminiKey] = await Promise.all([
        this.getPetsApiKey(),
        this.getGeminiApiKey(),
      ]);

      return {
        pets: petsKey || undefined,
        gemini: geminiKey || undefined,
      };
    } catch (error) {
      console.error('Error getting all API keys:', error);
      return {};
    }
  }
} 