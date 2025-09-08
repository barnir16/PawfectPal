import { getBaseUrl, getToken } from "../../services/api";
import type { Service } from "../../types/services";

import type { ServiceProvider } from "../../types/services";

export async function getServices(status: "active" | "history"): Promise<Service[]> {
  const token = await getToken();
  console.log('🔑 Token for services API:', token ? 'Present' : 'Missing');
  
  const response = await fetch(`${getBaseUrl()}/service_booking/?status=${status}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data: Service[] = await response.json();
  return data;
}

export async function getProviders(filter: string[]): Promise<ServiceProvider[]> {
  const token = await getToken();
  console.log('🔑 Token for providers API:', token ? 'Present' : 'Missing');
  const query = filter.map(f => `filter=${encodeURIComponent(f)}`).join("&");
  const response = await fetch(`${getBaseUrl()}/providers/?${query}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: ServiceProvider[] = await response.json();
  return data;
}
