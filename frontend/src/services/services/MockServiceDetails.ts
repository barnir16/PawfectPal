import type { Service } from "../../types/services";

// Detailed info type
export type ServiceDetails = Service & {
  notes: string;
  gps?: {
    lat: number;
    lng: number;
    path?: { lat: number; lng: number }[];
  };
  groomingSteps?: string[];
};

export class MockServiceDetails {
  private static details: ServiceDetails[] = [];

  private static getFallbackDetails(): ServiceDetails[] {
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
        notes: "Buddy was energetic and happy on the walk. Took two breaks.",
        gps: {
          lat: 40.7128,
          lng: -74.006,
          path: [
            { lat: 40.7128, lng: -74.006 },
            { lat: 40.7129, lng: -74.0055 },
            { lat: 40.7132, lng: -74.0058 },
            { lat: 40.7130, lng: -74.0060 }, // back near start
          ],
        },
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
        notes: "Milo enjoyed playing with toys and napped for 1 hour.",
      },
      {
        id: 3,
        user_id: 2,
        service_type: "grooming",
        pet_id: 103,
        pet_name: "Charlie",
        start_datetime: new Date(now.getTime() - 86400 * 1000 * 5).toISOString(),
        end_datetime: new Date(now.getTime() - 86400 * 1000 * 5 + 3600 * 1000).toISOString(),
        status: "completed",
        currency: "USD",
        before_images: [],
        after_images: [],
        notes: "Charlie got a full haircut. Very cooperative.",
        groomingSteps: ["Brushed coat", "Trimmed nails", "Bath", "Haircut"],
      },
      {
        id: 4,
        user_id: 3,
        service_type: "walking",
        pet_id: 104,
        pet_name: "Bella",
        start_datetime: new Date(now.getTime() - 86400 * 1000 * 2).toISOString(),
        end_datetime: new Date(now.getTime() - 86400 * 1000 * 2 + 3600 * 1000).toISOString(),
        status: "cancelled",
        currency: "USD",
        before_images: [],
        after_images: [],
        notes: "Walk cancelled due to rain.",
        gps: {
          lat: 40.7150,
          lng: -74.0070,
          path: [{ lat: 40.7150, lng: -74.0070 }],
        },
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
        notes: "Rocky seems to be enjoying his stay.",
      },
      {
        id: 6,
        user_id: 3,
        service_type: "walking",
        pet_id: 106,
        pet_name: "Luna",
        start_datetime: new Date(now.getTime() - 86400 * 1000 * 3).toISOString(),
        end_datetime: new Date(now.getTime() - 86400 * 1000 * 3 + 7200 * 1000).toISOString(),
        status: "completed",
        currency: "USD",
        before_images: [],
        after_images: [],
        notes: "Luna was calm and walked steadily.",
        gps: {
          lat: 40.7100,
          lng: -74.0080,
          path: [
            { lat: 40.7100, lng: -74.0080 },
            { lat: 40.7105, lng: -74.0075 },
            { lat: 40.7110, lng: -74.0078 },
            { lat: 40.7100, lng: -74.0080 }, // back to start
          ],
        },
      },
    ];
  }

  private static ensureLoaded() {
    if (!this.details.length) {
      this.details = this.getFallbackDetails();
    }
  }

  static async getServiceDetails(id: number): Promise<ServiceDetails | null> {
    this.ensureLoaded();
    await new Promise((resolve) => setTimeout(resolve, 200)); // simulate API delay
    return this.details.find((d) => d.id === id) || null;
  }
}

export default MockServiceDetails;
