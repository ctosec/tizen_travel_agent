import { create } from 'zustand';
import { api } from '../api/client';
import type { ItineraryDay } from '../types/itinerary';

interface ItineraryState {
  days: ItineraryDay[];
  loading: boolean;
  error: string | null;
  startDate: string;
  duration: number;
  setStartDate: (date: string) => void;
  setDuration: (d: number) => void;
  generateItinerary: (country: string, city: string) => Promise<void>;
}

function getDefaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split('T')[0];
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  days: [],
  loading: false,
  error: null,
  startDate: getDefaultStartDate(),
  duration: 5,
  setStartDate: (date) => set({ startDate: date }),
  setDuration: (d) => set({ duration: Math.max(2, Math.min(14, d)) }),
  generateItinerary: async (country, city) => {
    const { startDate, duration } = get();
    set({ loading: true, error: null });
    try {
      const res = await api.generateItinerary({ country, city, startDate, duration });
      set({ days: res.data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to generate itinerary', loading: false });
    }
  },
}));
