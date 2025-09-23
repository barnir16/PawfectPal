/**
 * API Key Manager for React (Web)
 * Uses localStorage for key management
 */
export class ApiKeyManager {
  private static readonly PETS_API_KEY_KEY = 'pets_api_key';
  private static readonly GEMINI_API_KEY_KEY = 'gemini_api_key';

  static getPetsApiKey(): string | null {
    try {
      return localStorage.getItem(this.PETS_API_KEY_KEY);
    } catch (error) {
      console.error('Error getting pets API key:', error);
      return null;
    }
  }

  static setPetsApiKey(key: string | null): void {
    try {
      if (key) {
        localStorage.setItem(this.PETS_API_KEY_KEY, key);
      } else {
        localStorage.removeItem(this.PETS_API_KEY_KEY);
      }
    } catch (error) {
      console.error('Error setting pets API key:', error);
    }
  }

  static getGeminiApiKey(): string | null {
    try {
      return localStorage.getItem(this.GEMINI_API_KEY_KEY);
    } catch (error) {
      console.error('Error getting Gemini API key:', error);
      return null;
    }
  }

  static setGeminiApiKey(key: string | null): void {
    try {
      if (key) {
        localStorage.setItem(this.GEMINI_API_KEY_KEY, key);
      } else {
        localStorage.removeItem(this.GEMINI_API_KEY_KEY);
      }
    } catch (error) {
      console.error('Error setting Gemini API key:', error);
    }
  }

  static hasPetsApiKey(): boolean {
    return !!this.getPetsApiKey();
  }

  static hasGeminiApiKey(): boolean {
    return !!this.getGeminiApiKey();
  }

  static clearAllKeys(): void {
    try {
      localStorage.removeItem(this.PETS_API_KEY_KEY);
      localStorage.removeItem(this.GEMINI_API_KEY_KEY);
    } catch (error) {
      console.error('Error clearing API keys:', error);
    }
  }

  static getAllKeys(): { pets?: string; gemini?: string } {
    try {
      const petsKey = this.getPetsApiKey();
      const geminiKey = this.getGeminiApiKey();

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
