export class ApiKeyManager {
  private static readonly PETS_API_KEY_KEY = 'pets_api_key';
  private static readonly GEMINI_API_KEY_KEY = 'gemini_api_key';

  static get petsApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.PETS_API_KEY_KEY);
  }

  static set petsApiKey(key: string | null) {
    if (typeof window === 'undefined') return;
    
    if (key) {
      localStorage.setItem(this.PETS_API_KEY_KEY, key);
    } else {
      localStorage.removeItem(this.PETS_API_KEY_KEY);
    }
  }

  static get geminiApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.GEMINI_API_KEY_KEY);
  }

  static set geminiApiKey(key: string | null) {
    if (typeof window === 'undefined') return;
    
    if (key) {
      localStorage.setItem(this.GEMINI_API_KEY_KEY, key);
    } else {
      localStorage.removeItem(this.GEMINI_API_KEY_KEY);
    }
  }

  static hasPetsApiKey(): boolean {
    return !!this.petsApiKey;
  }

  static hasGeminiApiKey(): boolean {
    return !!this.geminiApiKey;
  }

  static clearAllKeys(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.PETS_API_KEY_KEY);
    localStorage.removeItem(this.GEMINI_API_KEY_KEY);
  }
} 