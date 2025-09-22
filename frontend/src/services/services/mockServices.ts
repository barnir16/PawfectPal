import type { Service } from "../../types/services";

export class MockService {
  private static services: Service[] = [];
  private static loaded = false;

  /**
   * Load services from database via API
   */
  private static async loadServices(
    forceReload: boolean = false,
  ): Promise<void> {
    if (this.loaded && !forceReload) return;

    try {
      const response = await fetch("/api/services/");
      if (response.ok) {
        this.services = await response.json();
        this.loaded = true;
        console.log(`📊 Loaded ${this.services.length} services from database`);
        return;
      }
    } catch (error) {
      console.log("Backend API not available, using fallback data");
    }

    this.services = this.getFallbackServices();
    this.loaded = true;
    console.log(`📊 Loaded ${this.services.length} fallback services`);
  }

  /**
   * Force reload services from database
   */
  static async reloadServices(): Promise<void> {
    this.loaded = false;
    await this.loadServices(true);
  }

  /**
   * Get fallback/dummy services
   */
  private static getFallbackServices(): Service[] {
    const now = new Date();

    return [
      {
        id: 1,
        user_id: 1,
        service_type: "walking",
        pet_id: 101,
        pet_name: "Buddy",
        start_datetime: now.toISOString(),
        end_datetime: new Date(now.getTime() + 3600 * 1000).toISOString(),
        status: "in_progress",
        currency: "USD",
        before_images: [],
        after_images: [],
      },
      {
        id: 2,
        user_id: 1,
        service_type: "sitting",
        pet_id: 102,
        pet_name: "Milo",
        start_datetime: now.toISOString(),
        status: "in_progress",
        currency: "USD",
        before_images: [],
        after_images: [],
      },
      {
        id: 3,
        user_id: 2,
        service_type: "grooming",
        pet_id: 103,
        pet_name: "Charlie",
        start_datetime: new Date(
          now.getTime() - 86400 * 1000 * 5,
        ).toISOString(),
        end_datetime: new Date(
          now.getTime() - 86400 * 1000 * 5 + 3600 * 1000,
        ).toISOString(),
        status: "completed",
        currency: "USD",
        before_images: [],
        after_images: [],
      },
      {
        id: 4,
        user_id: 3,
        service_type: "walking",
        pet_id: 104,
        pet_name: "Bella",
        start_datetime: new Date(
          now.getTime() - 86400 * 1000 * 2,
        ).toISOString(),
        end_datetime: new Date(
          now.getTime() - 86400 * 1000 * 2 + 3600 * 1000,
        ).toISOString(),
        status: "cancelled",
        currency: "USD",
        before_images: [],
        after_images: [],
      },
      {
        id: 5,
        user_id: 2,
        service_type: "boarding",
        pet_id: 105,
        pet_name: "Rocky",
        start_datetime: now.toISOString(),
        status: "in_progress",
        currency: "USD",
        before_images: [],
        after_images: [],
      },
      {
        id: 6,
        user_id: 3,
        service_type: "walking",
        pet_id: 106,
        pet_name: "Luna",
        start_datetime: new Date(
          now.getTime() - 86400 * 1000 * 3,
        ).toISOString(),
        end_datetime: new Date(
          now.getTime() - 86400 * 1000 * 3 + 7200 * 1000,
        ).toISOString(),
        status: "completed",
        currency: "USD",
        before_images: [],
        after_images: [],
      },
    ];
  }

  /**
   * Get all services, optionally filtered by status
   */
  static async getServices(
    status?: "in_progress" | "completed" | "cancelled",
  ): Promise<Service[]> {
    await this.loadServices();
    await new Promise((resolve) => setTimeout(resolve, 400)); // simulate API delay

    if (!status) return this.services;

    return this.services.filter((service) => service.status === status);
  }

  /**
   * Get service by ID
   */
  static async getServiceById(id: number): Promise<Service | null> {
    await this.loadServices();
    await new Promise((resolve) => setTimeout(resolve, 300));
    return this.services.find((s) => s.id === id) || null;
  }

  /**
   * Search services by pet name or service type
   */
  static async searchServices(query: string): Promise<Service[]> {
    await this.loadServices();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const q = query.toLowerCase();
    return this.services.filter(
      (s) =>
        s.pet_name.toLowerCase().includes(q) ||
        s.service_type.toLowerCase().includes(q),
    );
  }

  /**
   * Get services by date range
   */
  static async getServicesByDateRange(
    start: Date,
    end: Date,
  ): Promise<Service[]> {
    await this.loadServices();
    return this.services.filter((s) => {
      const startTime = new Date(s.start_datetime).getTime();
      const endTime = s.end_datetime
        ? new Date(s.end_datetime).getTime()
        : startTime;
      return startTime >= start.getTime() && endTime <= end.getTime();
    });
  }

  static async getServicesByStatus(
    status: "in_progress" | "completed" | "cancelled",
  ): Promise<Service[]> {
    return this.getServices(status);
  }
}

export default MockService;
