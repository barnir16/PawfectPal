import type { ServiceProvider } from '../../types/services';

export class MockProviderService {
  private static providers: ServiceProvider[] = [];
  private static loaded = false;

  /**
   * Load providers from database via API
   */
  private static async loadProviders(forceReload: boolean = false): Promise<void> {
    if (this.loaded && !forceReload) return;
    
    try {
      // Try to fetch from backend API first
      const response = await fetch('/api/providers/');
      if (response.ok) {
        this.providers = await response.json();
        this.loaded = true;
        console.log(`📊 Loaded ${this.providers.length} providers from database`);
        return;
      }
    } catch (error) {
      console.log('Backend API not available, using fallback data');
    }
    
    // Fallback to sample data if backend is not available
    this.providers = this.getFallbackProviders();
    this.loaded = true;
    console.log(`📊 Loaded ${this.providers.length} fallback providers`);
  }

  /**
   * Force reload providers from database
   */
  static async reloadProviders(): Promise<void> {
    this.loaded = false;
    await this.loadProviders(true);
  }

  /**
   * Get fallback providers when database is not available
   */
  private static getFallbackProviders(): ServiceProvider[] {
    return [
      {
        id: 1,
        username: "demo_walking_1",
        full_name: "דוד כהן",
        profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&seed=1001",
        provider_services: ["walking"],
        provider_rating: 4.5,
        provider_bio: "מקצועי בהליכות כלבים, מתמחה בכלבים גדולים וקטנים. אוהב בעלי חיים ומבין את הצרכים שלהם",
        provider_hourly_rate: 52,
        location: {
          latitude: 32.0853,
          longitude: 34.7818
        },
        distance_km: 2.3,
        is_available: true,
        languages: ["עברית", "אנגלית"],
        experience_years: 5,
        response_time_minutes: 15,
        completed_bookings: 127,
        last_online: "2024-01-15T10:30:00Z",
        verified: true,
        reviews_count: 23,
        average_rating: 4.5
      }
    ];
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
