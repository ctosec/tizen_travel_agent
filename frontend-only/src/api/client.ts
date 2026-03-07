/**
 * Frontend-only API client.
 * - Destination/Itinerary: direct Google API calls from browser
 * - Flights/Hotels: mock data
 * - Payment: Cloudflare Worker (VITE_PAYMENT_URL)
 */
import { getDestination } from '../services/destination';
import { generateItinerary as generateItineraryService } from '../services/itinerary';
import { searchMockFlights } from '../services/mockFlights';
import { searchMockHotels } from '../services/mockHotels';

const PAYMENT_BASE = import.meta.env.VITE_PAYMENT_URL || '';

// Kept for backward compatibility with components that import API_BASE
export const API_BASE = '';

export async function fetchServerBaseUrl(): Promise<string> {
  return PAYMENT_BASE || window.location.origin;
}

export function getQrBaseUrl(): string {
  return PAYMENT_BASE || window.location.origin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

async function paymentRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  const res = await fetch(`${PAYMENT_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  // Destination — uses Gemini + Google Places directly
  getDestination: async (country: string, city: string) => {
    const data = await getDestination(country, city);
    return { data };
  },

  // Itinerary — uses Gemini + Google Places directly
  generateItinerary: async (params: { country: string; city: string; startDate: string; duration: number }) => {
    const data = await generateItineraryService(params);
    return { data };
  },

  // Flights — mock data (Amadeus API requires server-side OAuth)
  searchFlights: async (params: Any) => {
    const data = searchMockFlights(params);
    return { data };
  },

  // Hotels — mock data (Amadeus API requires server-side OAuth)
  searchHotels: async (params: Any) => {
    const data = searchMockHotels(params);
    return { data };
  },

  // Payment — Cloudflare Worker
  createPaymentSession: (data: Any) =>
    paymentRequest<Any>('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),

  getPaymentStatus: (orderId: string) =>
    paymentRequest<Any>(`/api/sessions/${orderId}/status`),

  // Bookings — mock (no DB)
  getBookings: async (_ids?: string[]) => {
    return [];
  },
};
