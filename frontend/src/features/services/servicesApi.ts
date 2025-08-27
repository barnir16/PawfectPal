export interface Service {
  id: number;
  petName: string;
  serviceType: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

export async function getServices(status: "active" | "history"): Promise<Service[]> {
  const response = await fetch(`http://localhost:8000/service_booking/?status=${status}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data: Service[] = await response.json();
  return data;
}
