const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:3000/api';

let _qrBaseUrl: string | null = null;

export async function fetchServerBaseUrl(): Promise<string> {
  if (_qrBaseUrl) return _qrBaseUrl;
  try {
    const res = await fetch(`${API_BASE}/server-info`);
    const data = await res.json();
    _qrBaseUrl = data.baseUrl as string;
    return _qrBaseUrl!;
  } catch {
    _qrBaseUrl = API_BASE.replace('/api', '');
    return _qrBaseUrl!;
  }
}

export function getQrBaseUrl(): string {
  return _qrBaseUrl || API_BASE.replace('/api', '');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export const api = {
  // Destination
  getDestination: (country: string, city: string) =>
    request<Any>(`/destination/${country}/${city}`),

  // Itinerary
  generateItinerary: (params: { country: string; city: string; startDate: string; duration: number }) =>
    request<Any>('/itinerary/generate', { method: 'POST', body: JSON.stringify(params) }),

  // Flights
  searchFlights: (params: Any) =>
    request<Any>('/flights/search', { method: 'POST', body: JSON.stringify(params) }),

  // Hotels
  searchHotels: (params: Any) =>
    request<Any>('/hotels/search', { method: 'POST', body: JSON.stringify(params) }),

  // Payment sessions
  createPaymentSession: (data: Any) =>
    request<Any>('/payments/sessions', { method: 'POST', body: JSON.stringify(data) }),
  getPaymentStatus: (orderId: string) =>
    request<Any>(`/payments/sessions/${orderId}/status`),

  // Bookings
  getBookings: (ids?: string[]) =>
    request<Any>(`/bookings${ids ? `?ids=${ids.join(',')}` : ''}`),
};

export { API_BASE };
