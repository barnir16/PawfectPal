import { BASE_URL } from "../../services";

export interface Service {
  id: number;
  petName: string;
  serviceType: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

export interface Provider {
  id: number;
  full_name: string;
  profile_image?: string;
  provider_services?: string[]; 
  provider_rating?: number; 
  provider_bio?: string;
  provider_hourly_rate?: number;
  city?: string;
  state?: string;
  country?: string;
}

export async function getServices(status: "active" | "history"): Promise<Service[]> {
  const response = await fetch(`${BASE_URL}/service_booking/?status=${status}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data: Service[] = await response.json();
  return data;
}

export async function getProviders(filter: string[]): Promise<Provider[]> {
  const query = filter.map(f => `filter=${encodeURIComponent(f)}`).join("&");
  const response = await fetch(`${BASE_URL}/providers/?${query}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: Provider[] = await response.json();
  return data;
}
