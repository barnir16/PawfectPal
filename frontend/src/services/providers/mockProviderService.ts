import type { ServiceProvider } from '../../types/services';
import { getBaseUrl } from "../api";
import { getToken } from "../api";

export class MockProviderService {
  private static providers: ServiceProvider[] = [];
  private static loaded = false;

  /**
   * Load providers from database via API
   */
  private static async loadProviders(forceReload: boolean = false): Promise<void> {
    if (this.loaded && !forceReload) return;

    try {
      // Try to fetch from backend API first using proper base URL and auth
      const token = await getToken();
      const response = await fetch(`${getBaseUrl()}/providers/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });

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
        username: "david_cohen_1",
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
      },
      {
        id: 2,
        username: "sarah_levy_2",
        full_name: "שרה לוי",
        profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&seed=2001",
        provider_services: ["walking"],
        provider_rating: 4.8,
        provider_bio: "מטפלת מנוסה בהליכות כלבים, מתמחה בכלבים גדולים וקטנים. אוהבת בעלי חיים ומבינה את הצרכים שלהם",
        provider_hourly_rate: 45,
        location: {
          latitude: 31.7683,
          longitude: 35.2137
        },
        distance_km: 5.7,
        is_available: true,
        languages: ["עברית"],
        experience_years: 6,
        response_time_minutes: 8,
        completed_bookings: 89,
        last_online: "2024-01-15T09:15:00Z",
        verified: true,
        reviews_count: 18,
        average_rating: 4.8
      },
      {
        id: 3,
        username: "avi_abraham_3",
        full_name: "אבי אברהם",
        profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&seed=1002",
        provider_services: ["walking"],
        provider_rating: 4.2,
        provider_bio: "מטפל מנוסה בהליכות כלבים עם ניסיון רב. מבטיח פעילות גופנית מספקת לכלב שלך",
        provider_hourly_rate: 38,
        location: {
          latitude: 32.794,
          longitude: 34.9896
        },
        distance_km: 8.2,
        is_available: true,
        languages: ["עברית", "אנגלית", "רוסית"],
        experience_years: 3,
        response_time_minutes: 25,
        completed_bookings: 45,
        last_online: "2024-01-14T16:45:00Z",
        verified: false,
        reviews_count: 12,
        average_rating: 4.2
      },
      {
        id: 4,
        username: "michal_israeli_4",
        full_name: "מיכל ישראלי",
        profile_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&seed=2002",
        provider_services: ["sitting"],
        provider_rating: 4.7,
        provider_bio: "מטפלת מקצועית בשמירה על חיות מחמד. ניסיון עם כלבים, חתולים ובעלי חיים אחרים",
        provider_hourly_rate: 65,
        location: {
          latitude: 32.1093,
          longitude: 34.8055
        },
        distance_km: 1.8,
        is_available: true,
        languages: ["עברית", "אנגלית"],
        experience_years: 4,
        response_time_minutes: 12,
        completed_bookings: 156,
        last_online: "2024-01-15T11:20:00Z",
        verified: true,
        reviews_count: 31,
        average_rating: 4.7
      },
      {
        id: 5,
        username: "alon_goldberg_5",
        full_name: "אלון גולדברג",
        profile_image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face&seed=1003",
        provider_services: ["sitting"],
        provider_rating: 4.9,
        provider_bio: "מטפל מסור עם ניסיון רב בהליכות כלבים. זמין בבוקר ובערב",
        provider_hourly_rate: 72,
        location: {
          latitude: 31.78,
          longitude: 35.22
        },
        distance_km: 3.4,
        is_available: true,
        languages: ["עברית"],
        experience_years: 3,
        response_time_minutes: 6,
        completed_bookings: 98,
        last_online: "2024-01-15T08:30:00Z",
        verified: true,
        reviews_count: 27,
        average_rating: 4.9
      },
      {
        id: 6,
        username: "rachel_rosen_6",
        full_name: "רחל רוזן",
        profile_image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face&seed=2003",
        provider_services: ["sitting"],
        provider_rating: 4.3,
        provider_bio: "מטפלת מנוסה בשמירה על חיות מחמד. זמינה 24/7 לטיפול בחיות מחמד",
        provider_hourly_rate: 58,
        location: {
          latitude: 32.82,
          longitude: 34.98
        },
        distance_km: 6.1,
        is_available: true,
        languages: ["עברית", "אנגלית", "רוסית"],
        experience_years: 7,
        response_time_minutes: 18,
        completed_bookings: 203,
        last_online: "2024-01-15T07:45:00Z",
        verified: true,
        reviews_count: 42,
        average_rating: 4.3
      },
      {
        id: 7,
        username: "danny_stern_7",
        full_name: "דני שטרן",
        profile_image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face&seed=1004",
        provider_services: ["boarding"],
        provider_rating: 4.6,
        provider_bio: "פנסיון ביתי חם ומסור. מבטיח טיפול אישי ונוח לכל חיית מחמד",
        provider_hourly_rate: 120,
        location: {
          latitude: 32.06,
          longitude: 34.77
        },
        distance_km: 4.2,
        is_available: true,
        languages: ["עברית", "אנגלית"],
        experience_years: 8,
        response_time_minutes: 10,
        completed_bookings: 89,
        last_online: "2024-01-15T12:10:00Z",
        verified: true,
        reviews_count: 19,
        average_rating: 4.6
      },
      {
        id: 8,
        username: "noa_katz_8",
        full_name: "נועה כץ",
        profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&seed=2004",
        provider_services: ["boarding"],
        provider_rating: 4.4,
        provider_bio: "מטפלת מנוסה בשמירה על חיות מחמד. זמינה 24/7 לטיפול בחיות מחמד",
        provider_hourly_rate: 95,
        location: {
          latitude: 31.75,
          longitude: 35.2
        },
        distance_km: 2.8,
        is_available: true,
        languages: ["עברית"],
        experience_years: 5,
        response_time_minutes: 14,
        completed_bookings: 67,
        last_online: "2024-01-15T09:30:00Z",
        verified: false,
        reviews_count: 15,
        average_rating: 4.4
      },
      {
        id: 9,
        username: "michael_barak_9",
        full_name: "מיכאל ברק",
        profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&seed=1005",
        provider_services: ["boarding"],
        provider_rating: 4.8,
        provider_bio: "פנסיון ביתי חם ומסור. מבטיח טיפול אישי ונוח לכל חיית מחמד",
        provider_hourly_rate: 110,
        location: {
          latitude: 32.79,
          longitude: 34.99
        },
        distance_km: 7.5,
        is_available: true,
        languages: ["עברית", "אנגלית", "רוסית"],
        experience_years: 6,
        response_time_minutes: 22,
        completed_bookings: 134,
        last_online: "2024-01-14T18:20:00Z",
        verified: true,
        reviews_count: 28,
        average_rating: 4.8
      },
      {
        id: 10,
        username: "tamar_david_10",
        full_name: "תמר דוד",
        profile_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&seed=2005",
        provider_services: ["grooming"],
        provider_rating: 4.7,
        provider_bio: "מטפלת מקצועית בטיפוח חיות מחמד עם 6+ שנות ניסיון. מתמחה בכל הגזעים",
        provider_hourly_rate: 85,
        location: {
          latitude: 32.08,
          longitude: 34.78
        },
        distance_km: 1.2,
        is_available: true,
        languages: ["עברית", "אנגלית"],
        experience_years: 6,
        response_time_minutes: 9,
        completed_bookings: 178,
        last_online: "2024-01-15T13:45:00Z",
        verified: true,
        reviews_count: 35,
        average_rating: 4.7
      },
      {
        id: 11,
        username: "yonatan_zohar_11",
        full_name: "יונתן זוהר",
        profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&seed=1006",
        provider_services: ["grooming"],
        provider_rating: 4.5,
        provider_bio: "מטפל מנוסה בטיפוח כלבים וחתולים. מבטיח טיפול עדין ומקצועי",
        provider_hourly_rate: 75,
        location: {
          latitude: 31.77,
          longitude: 35.21
        },
        distance_km: 3.1,
        is_available: true,
        languages: ["עברית"],
        experience_years: 4,
        response_time_minutes: 11,
        completed_bookings: 92,
        last_online: "2024-01-15T10:15:00Z",
        verified: true,
        reviews_count: 21,
        average_rating: 4.5
      },
      {
        id: 12,
        username: "dina_cohen_12",
        full_name: "דינה כהן",
        profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face&seed=2006",
        provider_services: ["grooming"],
        provider_rating: 4.3,
        provider_bio: "מטפלת מקצועית בטיפוח עם ציוד מודרני. ניסיון עם כל סוגי הפרווה",
        provider_hourly_rate: 68,
        location: {
          latitude: 32.81,
          longitude: 34.97
        },
        distance_km: 5.9,
        is_available: true,
        languages: ["עברית", "אנגלית", "רוסית"],
        experience_years: 3,
        response_time_minutes: 16,
        completed_bookings: 56,
        last_online: "2024-01-14T17:30:00Z",
        verified: false,
        reviews_count: 14,
        average_rating: 4.3
      },
      {
        id: 13,
        username: "uriel_levy_13",
        full_name: "אוריאל לוי",
        profile_image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face&seed=1007",
        provider_services: ["veterinary"],
        provider_rating: 4.9,
        provider_bio: "וטרינר מנוסה עם 10+ שנות ניסיון. מתמחה ברפואה פנימית וניתוחים",
        provider_hourly_rate: 250,
        location: {
          latitude: 32.07,
          longitude: 34.76
        },
        distance_km: 2.1,
        is_available: true,
        languages: ["עברית", "אנגלית"],
        experience_years: 11,
        response_time_minutes: 5,
        completed_bookings: 312,
        last_online: "2024-01-15T14:20:00Z",
        verified: true,
        reviews_count: 67,
        average_rating: 4.9
      },
      {
        id: 14,
        username: "ruti_abraham_14",
        full_name: "רותי אברהם",
        profile_image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face&seed=2007",
        provider_services: ["veterinary"],
        provider_rating: 4.6,
        provider_bio: "דוקטור וטרינרית מקצועית עם ניסיון רב. מבטיחה טיפול רפואי מעולה",
        provider_hourly_rate: 220,
        location: {
          latitude: 31.76,
          longitude: 35.19
        },
        distance_km: 4.7,
        is_available: true,
        languages: ["עברית"],
        experience_years: 8,
        response_time_minutes: 7,
        completed_bookings: 189,
        last_online: "2024-01-15T11:50:00Z",
        verified: true,
        reviews_count: 41,
        average_rating: 4.6
      },
      {
        id: 15,
        username: "amit_israeli_15",
        full_name: "עמית ישראלי",
        profile_image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face&seed=1008",
        provider_services: ["veterinary"],
        provider_rating: 4.4,
        provider_bio: "וטרינר מנוסה עם התמחות בבעלי חיים קטנים. זמין לטיפולים דחופים",
        provider_hourly_rate: 200,
        location: {
          latitude: 32.8,
          longitude: 34.96
        },
        distance_km: 6.8,
        is_available: true,
        languages: ["עברית", "אנגלית", "רוסית"],
        experience_years: 6,
        response_time_minutes: 13,
        completed_bookings: 145,
        last_online: "2024-01-14T20:10:00Z",
        verified: true,
        reviews_count: 33,
        average_rating: 4.4
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
