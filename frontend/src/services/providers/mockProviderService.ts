import type { ServiceProvider } from '../../types/services';

export class MockProviderService {
  private static providers: ServiceProvider[] = [];
  private static loaded = false;

  /**
   * Load providers from JSON file
   */
  private static async loadProviders(forceReload: boolean = false): Promise<void> {
    if (this.loaded && !forceReload) return;
    
    try {
      const response = await fetch('/fake_providers.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.providers = await response.json();
      this.loaded = true;
      console.log(`📊 Loaded ${this.providers.length} mock providers`);
    } catch (error) {
      console.error('Error loading mock providers:', error);
      this.providers = [];
    }
  }

  /**
   * Force reload providers from JSON file
   */
  static async reloadProviders(): Promise<void> {
    this.loaded = false;
    await this.loadProviders(true);
  }

  /**
   * Get all providers, optionally filtered by service type
   */
  static async getProviders(serviceType?: string): Promise<ServiceProvider[]> {
    // Load providers if not already loaded
    await this.loadProviders();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!serviceType) {
      return this.providers;
    }
    
    return this.providers.filter(provider => 
      provider.provider_services.includes(serviceType as any)
    );
  }

  /**
   * Get a single provider by ID
   */
  static async getProviderById(id: number): Promise<ServiceProvider | null> {
    await this.loadProviders();
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.providers.find(provider => provider.id === id) || null;
  }

  /**
   * Search providers by name or service type
   */
  static async searchProviders(query: string): Promise<ServiceProvider[]> {
    await this.loadProviders();
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const lowercaseQuery = query.toLowerCase();
    
    return this.providers.filter(provider => 
      provider.full_name?.toLowerCase().includes(lowercaseQuery) ||
      provider.username.toLowerCase().includes(lowercaseQuery) ||
      provider.provider_services.some(service => 
        service.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  /**
   * Get providers by location (within radius)
   */
  static async getProvidersByLocation(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 10
  ): Promise<ServiceProvider[]> {
    await this.loadProviders();
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return this.providers.filter(provider => {
      if (!provider.location) return false;
      
      const distance = this.calculateDistance(
        latitude, longitude,
        provider.location.latitude, provider.location.longitude
      );
      
      return distance <= radiusKm;
    });
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export default MockProviderService;
